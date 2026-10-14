import { beforeEach, describe, expect, it } from 'vitest';
import type { Config } from './config';
import { openDb, type DB } from './db';
import { advance, startSession, submitAnswer, viewSession } from './practice';
import * as repo from './repo';
import {
	askTutor, conversationView, FALLBACK_INTRO, monthSpendUsd, openTutor, type TutorDeps, type TutorEvent
} from './tutor';
import { FAKE_REPLY, fakeModel, type FakeStep } from './tutor-model';

const NOW = new Date('2026-10-13T16:00:00Z');
const config: Config = {
	studentPassword: 'a',
	parentPassword: 'b',
	sessionSecret: 'x'.repeat(32),
	anthropicApiKey: null,
	tutorModel: 'claude-sonnet-5-5',
	tutorMonthlyCapUsd: 10,
	priceInputPerMTok: 2,
	priceOutputPerMTok: 10,
	databasePath: ':memory:',
	tutorFake: true
};

let db: DB;
let seed = 0;
beforeEach(() => {
	db = openDb(':memory:');
	seed = 0;
});

function deps(steps?: FakeStep[], model: TutorDeps['model'] | 'none' = fakeModel(steps)): TutorDeps {
	return { db, model: model === 'none' ? null : model, config, now: () => NOW };
}

/** A practice session showing feedback for a wrong answer; returns the session and attempt ids. */
function wrongAnswer(kind: 'practice' | 'placement' = 'practice'): { sessionId: number; attemptId: number } {
	const sessionId = startSession(db, kind, kind === 'practice' ? 'fraction-add-sub' : null, NOW);
	viewSession(db, sessionId, NOW, () => ++seed);
	submitAnswer(db, sessionId, '999999', NOW);
	return { sessionId, attemptId: repo.getSession(db, sessionId)!.feedback!.attemptId };
}

async function collect(events: AsyncGenerator<TutorEvent>): Promise<TutorEvent[]> {
	const out: TutorEvent[] = [];
	for await (const e of events) out.push(e);
	return out;
}

const textOf = (events: TutorEvent[]) =>
	events.map((e) => (e.type === 'text' ? e.text : '')).join('');

describe('openTutor', () => {
	it('streams the first explanation and stores the conversation', async () => {
		const d = deps();
		const { attemptId } = wrongAnswer();
		const events = await collect(openTutor(d, attemptId));
		expect(textOf(events)).toBe(FAKE_REPLY);
		expect(events.at(-1)).toEqual({ type: 'done', remaining: 6 });

		const conv = repo.getConversationByAttempt(db, attemptId)!;
		expect(conv.apiMessages.map((m) => m.role)).toEqual(['user', 'assistant']);
		expect(String(conv.apiMessages[0].content)).toContain('Elevens svar: 999999');
		expect(repo.listMessages(db, conv.id)).toMatchObject([{ role: 'tutor', content: FAKE_REPLY, inputTokens: 100, outputTokens: 20 }]);
	});

	it('opens only once per attempt', async () => {
		const model = fakeModel();
		const { attemptId } = wrongAnswer();
		await collect(openTutor(deps(undefined, model), attemptId));
		const again = await collect(openTutor(deps(undefined, model), attemptId));
		expect(again).toEqual([{ type: 'error', message: 'Samtalen er allerede i gang.' }]);
		expect(model.calls).toHaveLength(1);
	});

	it('refuses placement problems, right answers and problems she has moved on from', async () => {
		const placement = wrongAnswer('placement');
		expect((await collect(openTutor(deps(), placement.attemptId)))[0].type).toBe('error');

		const sessionId = startSession(db, 'practice', 'counting', NOW);
		viewSession(db, sessionId, NOW, () => ++seed);
		submitAnswer(db, sessionId, repo.getSession(db, sessionId)!.current!.problem.answerText, NOW);
		const right = repo.getSession(db, sessionId)!.feedback!.attemptId;
		expect((await collect(openTutor(deps(), right)))[0].type).toBe('error');

		const moved = wrongAnswer();
		advance(db, moved.sessionId, NOW);
		expect(await collect(openTutor(deps(), moved.attemptId))).toEqual([
			{ type: 'error', message: 'Samtalen er slut. Gå videre til næste opgave.' }
		]);
	});
});

describe('askTutor', () => {
	it('continues the conversation with her question', async () => {
		const model = fakeModel([{ text: 'Første svar.' }, { text: 'Andet svar.' }]);
		const d = deps(undefined, model);
		const { attemptId } = wrongAnswer();
		await collect(openTutor(d, attemptId));
		const events = await collect(askTutor(d, attemptId, '  Hvorfor fællesnævner?  '));
		expect(textOf(events)).toBe('Andet svar.');
		expect(events.at(-1)).toEqual({ type: 'done', remaining: 5 });
		expect(model.calls[1].map((m) => m.role)).toEqual(['user', 'assistant', 'user']);
		expect(model.calls[1][2].content).toBe('Hvorfor fællesnævner?');
		const conv = repo.getConversationByAttempt(db, attemptId)!;
		expect(repo.listMessages(db, conv.id).map((m) => m.role)).toEqual(['tutor', 'student', 'tutor']);
	});

	it('limits length, count and timing of questions', async () => {
		const d = deps();
		const { sessionId, attemptId } = wrongAnswer();
		await collect(openTutor(d, attemptId));

		expect(await collect(askTutor(d, attemptId, 'x'.repeat(501)))).toEqual([
			{ type: 'error', message: 'Skriv et spørgsmål på højst 500 tegn.' }
		]);
		expect((await collect(askTutor(d, attemptId, '   ')))[0].type).toBe('error');

		for (let i = 0; i < 6; i++) await collect(askTutor(d, attemptId, `Spørgsmål ${i}`));
		expect(await collect(askTutor(d, attemptId, 'Et til?'))).toEqual([
			{ type: 'error', message: 'Du har stillet alle dine spørgsmål til denne opgave. Gå videre til næste opgave.' }
		]);

		advance(db, sessionId, NOW);
		expect(await collect(askTutor(d, attemptId, 'Hallo?'))).toEqual([
			{ type: 'error', message: 'Samtalen er slut. Gå videre til næste opgave.' }
		]);
	});

	it('answers one question at a time', async () => {
		const d = deps();
		const { attemptId } = wrongAnswer();
		await collect(openTutor(d, attemptId));
		const first = askTutor(d, attemptId, 'Første');
		await first.next();
		expect(await collect(askTutor(d, attemptId, 'Anden'))).toEqual([
			{ type: 'error', message: 'Vent på svaret, før du spørger igen.' }
		]);
		await collect(first);
		expect((await collect(askTutor(d, attemptId, 'Tredje'))).at(-1)?.type).toBe('done');
	});
});

describe('flagging and failures', () => {
	it('flags the conversation when Claude calls flag_for_parent', async () => {
		const model = fakeModel([
			{ text: 'Det lyder hårdt. ', flag: 'Student wrote that they hate themselves.' },
			{ text: 'Tal med en voksen, du stoler på.' }
		]);
		const { attemptId } = wrongAnswer();
		const events = await collect(openTutor(deps(undefined, model), attemptId));
		expect(textOf(events)).toBe('Det lyder hårdt. Tal med en voksen, du stoler på.');
		const conv = repo.getConversationByAttempt(db, attemptId)!;
		expect(conv).toMatchObject({ flagged: true, flagReason: 'Student wrote that they hate themselves.' });
		expect(conv.apiMessages.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
		expect(model.calls[1][2].content).toEqual([
			{ type: 'tool_result', tool_use_id: expect.any(String), content: 'ok' }
		]);
	});

	it('shows the worked solution when Claude declines', async () => {
		const { attemptId } = wrongAnswer();
		const problem = repo.getAttempt(db, attemptId)!.problem;
		const events = await collect(openTutor(deps([{ text: '', stopReason: 'refusal' }]), attemptId));
		expect(events.at(-1)).toEqual({ type: 'fallback', intro: FALLBACK_INTRO, steps: problem.solution });
		expect(repo.getConversationByAttempt(db, attemptId)?.closedAt).toBe(NOW.toISOString());
	});

	it('shows the worked solution when the call fails', async () => {
		const { attemptId } = wrongAnswer();
		const events = await collect(openTutor(deps([{ text: 'x', fail: true }]), attemptId));
		expect(events.at(-1)?.type).toBe('fallback');
		expect(repo.getConversationByAttempt(db, attemptId)?.closedAt).not.toBeNull();
	});

	it('shows the worked solution with no model, and once the monthly cap is reached', async () => {
		const a = wrongAnswer();
		expect((await collect(openTutor(deps(undefined, 'none'), a.attemptId)))[0].type).toBe('fallback');

		const b = wrongAnswer();
		await collect(openTutor(deps(), b.attemptId));
		const conv = repo.getConversationByAttempt(db, b.attemptId)!;
		repo.addMessage(db, {
			conversationId: conv.id, role: 'tutor', content: '…', createdAt: NOW.toISOString(),
			inputTokens: 0, outputTokens: 1_000_000, cacheWriteTokens: 0, cacheReadTokens: 0
		});
		const model = fakeModel();
		const c = wrongAnswer();
		expect((await collect(openTutor(deps(undefined, model), c.attemptId)))[0].type).toBe('fallback');
		expect(model.calls).toHaveLength(0);
	});
});

describe('monthSpendUsd', () => {
	it('counts only this Copenhagen month', () => {
		const { attemptId } = wrongAnswer();
		const conv = repo.createConversation(db, attemptId, [], NOW)!;
		const add = (createdAt: string) =>
			repo.addMessage(db, {
				conversationId: conv.id, role: 'tutor', content: '', createdAt,
				inputTokens: 0, outputTokens: 100_000, cacheWriteTokens: 0, cacheReadTokens: 0
			});
		add('2026-10-31T23:30:00.000Z'); // already November in Copenhagen
		add('2026-11-05T12:00:00.000Z');
		add('2026-10-20T12:00:00.000Z');
		expect(monthSpendUsd(db, new Date('2026-11-10T12:00:00Z'), config)).toBeCloseTo(2, 10);
		expect(monthSpendUsd(db, NOW, config)).toBeCloseTo(1, 10);
	});
});

describe('conversationView', () => {
	it('reports whether a conversation exists and what was said', async () => {
		const { attemptId } = wrongAnswer();
		expect(conversationView(db, attemptId)).toEqual({ started: false, open: true, remaining: 6, messages: [] });
		await collect(openTutor(deps(), attemptId));
		expect(conversationView(db, attemptId)).toEqual({
			started: true,
			open: true,
			remaining: 6,
			messages: [{ role: 'tutor', text: FAKE_REPLY }]
		});
	});
});
