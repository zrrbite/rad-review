import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { replay } from '../adaptive/state';
import { generateProblem } from '../skills/registry';
import { openDb, type DB } from './db';
import * as repo from './repo';

const NOW = new Date('2026-10-13T16:00:00Z');
const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);
const problem = generateProblem('order-of-operations', 1, 1);

function attempt(db: DB, sessionId: number, correct: boolean, minutes: number, skillId = problem.skillId) {
	return repo.insertAttempt(db, {
		sessionId,
		skillId,
		level: 1,
		seed: 1,
		problem: { ...problem, skillId },
		givenAnswer: correct ? problem.answerText : '999',
		correct,
		isRetry: false,
		createdAt: later(minutes).toISOString()
	});
}

let db: DB;
beforeEach(() => {
	db = openDb(':memory:');
});

describe('openDb', () => {
	it('migrates once and can be reopened', () => {
		const path = join(mkdtempSync(join(tmpdir(), 'rad-review-')), 'test.db');
		const first = openDb(path);
		expect(first.pragma('user_version', { simple: true })).toBe(1);
		first.close();
		const second = openDb(path);
		expect(second.pragma('user_version', { simple: true })).toBe(1);
		second.close();
	});
});

describe('sessions', () => {
	it('starts in the question phase with nothing picked', () => {
		const id = repo.createSession(db, 'adaptive', null, 10, NOW);
		expect(repo.getSession(db, id)).toEqual({
			id,
			kind: 'adaptive',
			skillId: null,
			targetCount: 10,
			pickedCount: 0,
			phase: 'question',
			current: null,
			feedback: null,
			retryPending: false,
			startedAt: NOW.toISOString(),
			endedAt: null
		});
		expect(repo.getSession(db, id + 1)).toBeUndefined();
	});

	it('stores the problem and feedback as JSON', () => {
		const id = repo.createSession(db, 'practice', 'circle', 10, NOW);
		const feedback: repo.Feedback = {
			attemptId: 7,
			correct: false,
			given: '12',
			answerText: '19',
			isRetry: false,
			tutorAllowed: true,
			nextLabel: 'Prøv en lignende'
		};
		repo.updateSession(db, id, { current: { problem, isRetry: false }, pickedCount: 1 });
		repo.updateSession(db, id, { phase: 'feedback', feedback, retryPending: true });
		const s = repo.getSession(db, id);
		expect(s?.current?.problem).toEqual(problem);
		expect(s).toMatchObject({ phase: 'feedback', feedback, retryPending: true, pickedCount: 1, skillId: 'circle' });
		repo.updateSession(db, id, { current: null, feedback: null });
		expect(repo.getSession(db, id)).toMatchObject({ current: null, feedback: null });
		repo.updateSession(db, id, {});
	});
});

describe('attempts and skill state', () => {
	it('keeps attempts in order and finds earlier wrong ones', () => {
		const s = repo.createSession(db, 'adaptive', null, 10, NOW);
		const a1 = attempt(db, s, false, 1);
		attempt(db, s, true, 2);
		const a3 = attempt(db, s, false, 3);
		const a4 = attempt(db, s, false, 4);
		attempt(db, s, false, 5, 'circle');

		expect(repo.attemptsForSkill(db, 'order-of-operations').map((a) => a.id)).toEqual([a1, a1 + 1, a3, a4]);
		expect(repo.sessionAttempts(db, s)).toHaveLength(5);
		expect(repo.allAttempts(db)).toHaveLength(5);
		expect(repo.recentWrongAttempts(db, 'order-of-operations', a4, 3).map((a) => a.id)).toEqual([a3, a1]);
		expect(repo.recentAttemptsForSkill(db, 'order-of-operations', 2).map((a) => a.id)).toEqual([a4, a3]);
		expect(repo.getAttempt(db, a1)).toMatchObject({ correct: false, givenAnswer: '999', problem });
		expect(repo.toRecord(repo.getAttempt(db, a1)!)).toEqual({ correct: false, at: later(1).toISOString() });
	});

	it('loads every skill, untried unless saved', () => {
		const empty = repo.loadSkillStates(db);
		expect(Object.keys(empty)).toHaveLength(24);
		expect(empty.circle.status).toBe('untried');

		const state = replay('circle', [{ correct: true, at: NOW.toISOString() }]);
		repo.saveSkillState(db, state);
		repo.saveSkillState(db, state);
		expect(repo.loadSkillStates(db).circle).toEqual(state);
	});
});

describe('tutor conversations', () => {
	it('allows one conversation per attempt', () => {
		const s = repo.createSession(db, 'adaptive', null, 10, NOW);
		const a = attempt(db, s, false, 1);
		const messages: repo.ApiMessage[] = [{ role: 'user', content: 'kontekst' }];
		const conv = repo.createConversation(db, a, messages, NOW);
		expect(conv).toMatchObject({ attemptId: a, apiMessages: messages, flagged: false, closedAt: null });
		expect(repo.createConversation(db, a, messages, NOW)).toBeNull();
		expect(repo.getConversationByAttempt(db, a)?.id).toBe(conv?.id);
	});

	it('stores messages, flags, usage and closes by session', () => {
		const s = repo.createSession(db, 'adaptive', null, 10, NOW);
		const a = attempt(db, s, false, 1);
		const b = attempt(db, s, false, 2);
		const first = repo.createConversation(db, a, [], NOW)!;
		const second = repo.createConversation(db, b, [], later(5))!;

		repo.addMessage(db, {
			conversationId: first.id, role: 'tutor', content: 'Første svar', createdAt: NOW.toISOString(),
			inputTokens: 100, outputTokens: 50, cacheWriteTokens: 10, cacheReadTokens: 0
		});
		repo.addMessage(db, {
			conversationId: first.id, role: 'student', content: 'Hvorfor?', createdAt: later(1).toISOString(),
			inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0
		});
		expect(repo.listMessages(db, first.id).map((m) => m.role)).toEqual(['tutor', 'student']);
		expect(repo.countStudentMessages(db, first.id)).toBe(1);
		expect(repo.allUsage(db)).toEqual([
			{ createdAt: NOW.toISOString(), inputTokens: 100, outputTokens: 50, cacheWriteTokens: 10, cacheReadTokens: 0 }
		]);

		repo.setApiMessages(db, first.id, [{ role: 'user', content: 'x' }]);
		expect(repo.getConversation(db, first.id)?.apiMessages).toEqual([{ role: 'user', content: 'x' }]);

		repo.flagConversation(db, first.id, 'sounded upset');
		expect(repo.countFlagged(db)).toBe(1);
		const list = repo.listConversations(db);
		expect(list.map((c) => c.id)).toEqual([first.id, second.id]);
		expect(list[0]).toMatchObject({ flagged: true, flagReason: 'sounded upset', firstReply: 'Første svar', skillId: 'order-of-operations' });

		repo.closeConversationsForSession(db, s, later(10));
		expect(repo.getConversation(db, first.id)?.closedAt).toBe(later(10).toISOString());
		expect(repo.getConversation(db, second.id)?.closedAt).toBe(later(10).toISOString());
		repo.closeConversation(db, first.id, later(20));
		expect(repo.getConversation(db, first.id)?.closedAt).toBe(later(10).toISOString());
	});
});
