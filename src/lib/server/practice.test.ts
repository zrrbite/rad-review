import { beforeEach, describe, expect, it } from 'vitest';
import { replay } from '../adaptive/state';
import { SKILL_IDS } from '../skills/curriculum';
import { openDb, type DB } from './db';
import { advance, homeInfo, startSession, submitAnswer, viewSession } from './practice';
import * as repo from './repo';

const NOW = new Date('2026-10-13T16:00:00Z'); // a Tuesday
let db: DB;
let seed = 0;
const newSeed = () => ++seed;

beforeEach(() => {
	db = openDb(':memory:');
	seed = 0;
});

const view = (id: number) => viewSession(db, id, NOW, newSeed)!;
const currentProblem = (id: number) => repo.getSession(db, id)!.current!.problem;
const answerRight = (id: number) => submitAnswer(db, id, currentProblem(id).answerText, NOW);
const answerWrong = (id: number) => submitAnswer(db, id, '999999', NOW);

describe('startSession', () => {
	it('sizes each kind of session', () => {
		expect(repo.getSession(db, startSession(db, 'adaptive', null, NOW))?.targetCount).toBe(10);
		expect(repo.getSession(db, startSession(db, 'practice', 'circle', NOW))).toMatchObject({
			targetCount: 10,
			skillId: 'circle'
		});
		expect(repo.getSession(db, startSession(db, 'placement', null, NOW))?.targetCount).toBe(12);
		expect(() => startSession(db, 'practice', null, NOW)).toThrow();
	});

	it('makes the second placement sitting only as long as what is left', () => {
		for (const id of SKILL_IDS.slice(0, 19)) {
			repo.saveSkillState(db, replay(id, [{ correct: true, at: NOW.toISOString() }]));
		}
		expect(repo.getSession(db, startSession(db, 'placement', null, NOW))?.targetCount).toBe(5);
	});
});

describe('viewSession', () => {
	it('shows a question without the answer', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		const v = view(id);
		expect(v.state).toBe('question');
		if (v.state !== 'question') return;
		expect(Object.keys(v.problem).sort()).toEqual(
			['inputHint', 'isRetry', 'number', 'prompt', 'skillName', 'table', 'total'].sort()
		);
		expect(v.problem).toMatchObject({ number: 1, total: 10, isRetry: false });
	});

	it('shows the same problem after a reload', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		const first = view(id);
		const second = view(id);
		expect(second).toEqual(first);
		expect(repo.getSession(db, id)?.pickedCount).toBe(1);
	});

	it('returns null for a session that does not exist', () => {
		expect(viewSession(db, 999, NOW, newSeed)).toBeNull();
	});
});

describe('answering', () => {
	it('stores a right answer and updates the skill', () => {
		const id = startSession(db, 'practice', 'circle', NOW);
		view(id);
		expect(answerRight(id)).toEqual({ ok: true });
		const v = view(id);
		expect(v.state).toBe('feedback');
		if (v.state !== 'feedback') return;
		expect(v.feedback).toMatchObject({ correct: true, nextLabel: 'Næste', tutorAllowed: false });
		expect(repo.attemptsForSkill(db, 'circle')).toHaveLength(1);
		expect(repo.loadSkillStates(db).circle.status).toBe('progressing');
	});

	it('ignores a second submit of the same problem', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		view(id);
		const text = currentProblem(id).answerText;
		submitAnswer(db, id, text, NOW);
		expect(submitAnswer(db, id, text, NOW)).toEqual({ ok: true });
		expect(repo.sessionAttempts(db, id)).toHaveLength(1);
	});

	it('does not count unreadable or ambiguous input', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		const before = view(id);
		expect(submitAnswer(db, id, 'abc', NOW)).toEqual({
			ok: false,
			message: 'Det forstod jeg ikke – skriv fx 3/4 eller 2,5.'
		});
		const ambiguous = submitAnswer(db, id, '2.500', NOW);
		expect(ambiguous.ok).toBe(false);
		if (!ambiguous.ok) expect(ambiguous.message).toContain('Mener du 2,5 eller 2500?');
		expect(repo.sessionAttempts(db, id)).toHaveLength(0);
		expect(view(id)).toEqual(before);
	});

	it('offers one similar problem after a wrong answer', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		const first = view(id);
		const skill = currentProblem(id).skillId;
		answerWrong(id);
		const fb = view(id);
		expect(fb.state === 'feedback' && fb.feedback).toMatchObject({
			correct: false,
			tutorAllowed: true,
			nextLabel: 'Prøv en lignende'
		});

		advance(db, id, NOW);
		const retry = view(id);
		expect(retry.state === 'question' && retry.problem).toMatchObject({ isRetry: true, number: 1 });
		expect(currentProblem(id).skillId).toBe(skill);
		expect(first.state === 'question' && first.problem.number).toBe(1);

		answerWrong(id);
		const fb2 = view(id);
		expect(fb2.state === 'feedback' && fb2.feedback).toMatchObject({ isRetry: true, nextLabel: 'Næste' });
		advance(db, id, NOW);
		const next = view(id);
		expect(next.state === 'question' && next.problem).toMatchObject({ isRetry: false, number: 2 });
	});

	it('gives no tutor and no retry during placement', () => {
		const id = startSession(db, 'placement', null, NOW);
		view(id);
		expect(currentProblem(id)).toMatchObject({ skillId: 'order-of-operations', level: 2 });
		answerWrong(id);
		const fb = view(id);
		expect(fb.state === 'feedback' && fb.feedback).toMatchObject({ tutorAllowed: false, nextLabel: 'Næste' });
		advance(db, id, NOW);
		view(id);
		expect(currentProblem(id).skillId).toBe('percent-of');
	});
});

describe('the end of a session', () => {
	it('summarises after the last problem, and stays finished', () => {
		const id = startSession(db, 'practice', 'counting', NOW);
		for (let i = 0; i < 10; i++) {
			view(id);
			answerRight(id);
			advance(db, id, NOW);
		}
		const done = view(id);
		expect(done).toEqual({
			state: 'done',
			kind: 'practice',
			summary: { answered: 10, correct: 10, strongerSkills: ['Tælleprincippet'] }
		});
		expect(repo.getSession(db, id)?.endedAt).toBe(NOW.toISOString());
		expect(view(id)).toEqual(done);
		expect(submitAnswer(db, id, '5', NOW)).toEqual({ ok: true });
		expect(repo.sessionAttempts(db, id)).toHaveLength(10);
	});
});

describe('advance', () => {
	it('closes the tutor conversations of the session', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		view(id);
		answerWrong(id);
		const [attempt] = repo.sessionAttempts(db, id);
		const conv = repo.createConversation(db, attempt.id, [], NOW)!;
		advance(db, id, NOW);
		expect(repo.getConversation(db, conv.id)?.closedAt).toBe(NOW.toISOString());
	});

	it('does nothing outside the feedback phase', () => {
		const id = startSession(db, 'adaptive', null, NOW);
		const before = view(id);
		advance(db, id, NOW);
		expect(view(id)).toEqual(before);
	});
});

describe('homeInfo', () => {
	it('counts untried skills and days practised this week', () => {
		expect(homeInfo(db, NOW)).toEqual({ untriedCount: 24, totalSkills: 24, daysThisWeek: 0 });
		const id = startSession(db, 'adaptive', null, NOW);
		view(id);
		answerRight(id);
		repo.insertAttempt(db, {
			...repo.sessionAttempts(db, id)[0],
			createdAt: '2026-10-11T12:00:00.000Z' // Sunday last week
		});
		expect(homeInfo(db, NOW)).toMatchObject({ untriedCount: 23, daysThisWeek: 1 });
	});
});
