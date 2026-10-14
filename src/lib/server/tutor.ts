// Tutor conversations (spec section 6): one per wrong answer, while its
// feedback is on screen. Capped per month; whenever the model can't be used,
// she gets the generator's worked solution instead.

import type Anthropic from '@anthropic-ai/sdk';
import type { Problem } from '../skills/types';
import { localMonth } from '../time';
import type { Config } from './config';
import type { DB } from './db';
import * as repo from './repo';
import type { TutorModel } from './tutor-model';
import {
	addUsage, buildContextMessage, costUsd, MAX_MESSAGE_CHARS, MAX_STUDENT_MESSAGES, usageFrom,
	ZERO_USAGE, type Usage
} from './tutor-prompt';

export type TutorEvent =
	| { type: 'text'; text: string }
	| { type: 'fallback'; intro: string; steps: string[] }
	| { type: 'done'; remaining: number }
	| { type: 'error'; message: string };

export interface TutorDeps {
	db: DB;
	model: TutorModel | null;
	config: Config;
	now: () => Date;
}

export interface ConversationView {
	started: boolean;
	open: boolean;
	remaining: number;
	messages: { role: 'student' | 'tutor'; text: string }[];
}

export type ReplyEvent =
	| { type: 'text'; text: string }
	| { type: 'flag'; reason: string }
	| { type: 'end'; messages: Anthropic.MessageParam[]; text: string; usage: Usage; refused: boolean };

export const FALLBACK_INTRO = 'Her er løsningen trin for trin.';
const MAX_TOOL_ROUNDS = 3;
const ENDED = 'Samtalen er slut. Gå videre til næste opgave.';

/** Conversations with a reply on its way; one question at a time. */
const busy = new Set<number>();

const error = (message: string): TutorEvent => ({ type: 'error', message });
const fallback = (problem: Problem): TutorEvent => ({ type: 'fallback', intro: FALLBACK_INTRO, steps: problem.solution });

export function monthSpendUsd(db: DB, now: Date, config: Config): number {
	const month = localMonth(now);
	const prices = { inputPerMTok: config.priceInputPerMTok, outputPerMTok: config.priceOutputPerMTok };
	return repo
		.allUsage(db)
		.filter((u) => localMonth(u.createdAt) === month)
		.reduce((sum, u) => sum + costUsd(u, prices), 0);
}

function available(deps: TutorDeps): boolean {
	return deps.model !== null && monthSpendUsd(deps.db, deps.now(), deps.config) < deps.config.tutorMonthlyCapUsd;
}

/** One tutor reply, following any flag_for_parent calls. Throws if the model fails. */
export async function* streamReply(model: TutorModel, start: Anthropic.MessageParam[]): AsyncGenerator<ReplyEvent> {
	const messages = [...start];
	let text = '';
	let usage = ZERO_USAGE;
	for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
		const turn = model.run(messages);
		for await (const delta of turn.deltas) {
			text += delta;
			yield { type: 'text', text: delta };
		}
		const message = await turn.final();
		usage = addUsage(usage, usageFrom(message.usage));
		if (message.stop_reason === 'refusal') {
			yield { type: 'end', messages: start, text, usage, refused: true };
			return;
		}
		messages.push({ role: 'assistant', content: message.content });
		if (message.stop_reason !== 'tool_use') break;

		const results: Anthropic.ToolResultBlockParam[] = [];
		for (const block of message.content) {
			if (block.type !== 'tool_use') continue;
			if (block.name === 'flag_for_parent') {
				const reason = (block.input as { reason?: unknown }).reason;
				yield { type: 'flag', reason: typeof reason === 'string' && reason ? reason.slice(0, 300) : 'flagged' };
			}
			results.push({ type: 'tool_result', tool_use_id: block.id, content: 'ok' });
		}
		messages.push({ role: 'user', content: results });
	}
	yield { type: 'end', messages, text, usage, refused: false };
}

function saveReply(deps: TutorDeps, conversationId: number, text: string, usage: Usage): void {
	if (!text && usage.inputTokens + usage.outputTokens + usage.cacheWriteTokens + usage.cacheReadTokens === 0) return;
	repo.addMessage(deps.db, {
		conversationId,
		role: 'tutor',
		content: text,
		...usage,
		createdAt: deps.now().toISOString()
	});
}

async function* runTurn(
	deps: TutorDeps,
	conversationId: number,
	start: Anthropic.MessageParam[],
	problem: Problem
): AsyncGenerator<TutorEvent> {
	busy.add(conversationId);
	let text = '';
	try {
		for await (const event of streamReply(deps.model!, start)) {
			if (event.type === 'text') {
				text += event.text;
				yield event;
			} else if (event.type === 'flag') {
				repo.flagConversation(deps.db, conversationId, event.reason);
			} else {
				saveReply(deps, conversationId, event.text, event.usage);
				if (event.refused) {
					repo.closeConversation(deps.db, conversationId, deps.now());
					yield fallback(problem);
					return;
				}
				repo.setApiMessages(deps.db, conversationId, event.messages);
			}
		}
	} catch (err) {
		console.error('tutor call failed', err);
		saveReply(deps, conversationId, text, ZERO_USAGE);
		repo.closeConversation(deps.db, conversationId, deps.now());
		yield fallback(problem);
		return;
	} finally {
		busy.delete(conversationId);
	}
	yield { type: 'done', remaining: MAX_STUDENT_MESSAGES - repo.countStudentMessages(deps.db, conversationId) };
}

export async function* openTutor(deps: TutorDeps, attemptId: number): AsyncGenerator<TutorEvent> {
	const attempt = repo.getAttempt(deps.db, attemptId);
	const session = attempt && repo.getSession(deps.db, attempt.sessionId);
	if (!attempt || !session || attempt.correct || session.kind === 'placement') {
		yield error('Tutoren kan ikke hjælpe med denne opgave.');
		return;
	}
	if (repo.getConversationByAttempt(deps.db, attemptId)) {
		yield error('Samtalen er allerede i gang.');
		return;
	}
	if (session.phase !== 'feedback' || session.feedback?.attemptId !== attemptId) {
		yield error(ENDED);
		return;
	}
	if (!available(deps)) {
		yield fallback(attempt.problem);
		return;
	}
	const earlier = repo.recentWrongAttempts(deps.db, attempt.skillId, attempt.id, 3);
	const context = buildContextMessage({
		problem: attempt.problem,
		givenAnswer: attempt.givenAnswer,
		earlier: earlier.map((a) => ({ problem: a.problem, givenAnswer: a.givenAnswer }))
	});
	const conversation = repo.createConversation(deps.db, attemptId, [{ role: 'user', content: context }], deps.now());
	if (!conversation) {
		yield error('Samtalen er allerede i gang.');
		return;
	}
	yield* runTurn(deps, conversation.id, conversation.apiMessages, attempt.problem);
}

export async function* askTutor(deps: TutorDeps, attemptId: number, text: string): AsyncGenerator<TutorEvent> {
	const conversation = repo.getConversationByAttempt(deps.db, attemptId);
	const attempt = repo.getAttempt(deps.db, attemptId);
	if (!conversation || !attempt || conversation.closedAt) {
		yield error(ENDED);
		return;
	}
	const question = text.trim();
	if (!question || question.length > MAX_MESSAGE_CHARS) {
		yield error(`Skriv et spørgsmål på højst ${MAX_MESSAGE_CHARS} tegn.`);
		return;
	}
	if (busy.has(conversation.id)) {
		yield error('Vent på svaret, før du spørger igen.');
		return;
	}
	if (repo.countStudentMessages(deps.db, conversation.id) >= MAX_STUDENT_MESSAGES) {
		yield error('Du har stillet alle dine spørgsmål til denne opgave. Gå videre til næste opgave.');
		return;
	}
	if (!available(deps)) {
		yield fallback(attempt.problem);
		return;
	}
	repo.addMessage(deps.db, {
		conversationId: conversation.id,
		role: 'student',
		content: question,
		...ZERO_USAGE,
		createdAt: deps.now().toISOString()
	});
	const messages: Anthropic.MessageParam[] = [...conversation.apiMessages, { role: 'user', content: question }];
	yield* runTurn(deps, conversation.id, messages, attempt.problem);
}

export function conversationView(db: DB, attemptId: number): ConversationView {
	const conversation = repo.getConversationByAttempt(db, attemptId);
	if (!conversation) return { started: false, open: true, remaining: MAX_STUDENT_MESSAGES, messages: [] };
	return {
		started: true,
		open: conversation.closedAt === null,
		remaining: MAX_STUDENT_MESSAGES - repo.countStudentMessages(db, conversation.id),
		messages: repo.listMessages(db, conversation.id).map((m) => ({ role: m.role, text: m.content }))
	};
}
