import { beforeEach, describe, expect, it } from 'vitest';
import { replay } from '../adaptive/state';
import { openDb, type DB } from './db';
import { minutesThisWeek, overview, skillHistory, skillMap, weakTrend } from './progress';
import * as repo from './repo';
import type { Config } from './config';
import type { AttemptRow } from './repo';

const NOW = new Date('2026-10-13T16:00:00Z');
let db: DB;
beforeEach(() => {
	db = openDb(':memory:');
});

describe('skillMap', () => {
	it('lists every topic and skill, untried at first', () => {
		const map = skillMap(db, NOW);
		expect(map.map((t) => t.name)).toEqual([
			'Tal og regning', 'Procent', 'Algebra og ligninger', 'Funktioner',
			'Geometri og måling', 'Statistik og sandsynlighed'
		]);
		expect(map.flatMap((t) => t.skills)).toHaveLength(24);
		expect(map[0].skills[0]).toEqual({
			id: 'order-of-operations', name: 'Regnehierarki', status: 'untried', label: 'Ikke prøvet', detail: null
		});
	});

	it('shows due reviews and, for the parent, the details', () => {
		const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
		repo.saveSkillState(db, replay('circle', [true, true, true].map((correct) => ({ correct, at: days(3) }))));
		const circle = skillMap(db, NOW, true)[4].skills.find((s) => s.id === 'circle');
		expect(circle).toMatchObject({ status: 'due', label: 'Skal genopfriskes' });
		expect(circle?.detail).toMatch(/^100 % · niveau 3 · 10\.? okt/);
		expect(skillMap(db, NOW)[4].skills.find((s) => s.id === 'circle')?.detail).toBeNull();
	});
});

const config = { tutorMonthlyCapUsd: 10, priceInputPerMTok: 2, priceOutputPerMTok: 10 } as Config;

function row(id: number, sessionId: number, at: string, correct: boolean, skillId: AttemptRow['skillId'] = 'circle'): AttemptRow {
	return {
		id, sessionId, skillId, level: 2, seed: 1, correct, isRetry: false, givenAnswer: '1', createdAt: at,
		problem: {
			skillId, level: 2, seed: 1, prompt: 'Udregn $1 + 1$.', answer: { kind: 'number', value: { n: 2, d: 1 } },
			answerText: '2', inputHint: 'Skriv et tal.', solution: ['Svar: 2']
		}
	};
}

describe('minutesThisWeek', () => {
	it('adds the gaps between answers in a session, at most 5 minutes each', () => {
		const attempts = [
			row(1, 1, '2026-10-13T16:00:00.000Z', true),
			row(2, 1, '2026-10-13T16:02:00.000Z', true), // +2
			row(3, 1, '2026-10-13T16:30:00.000Z', true), // +5 (capped)
			row(4, 2, '2026-10-13T17:00:00.000Z', true), // new session: no gap
			row(5, 2, '2026-10-13T17:01:30.000Z', true), // +1,5
			row(6, 3, '2026-10-05T10:00:00.000Z', true),
			row(7, 3, '2026-10-05T10:03:00.000Z', true) // last week
		];
		expect(minutesThisWeek(attempts, NOW)).toBe(9); // 8,5 rounded
	});
});

describe('weakTrend', () => {
	it('counts weak skills at the end of each day', () => {
		const attempts = [
			row(1, 1, '2026-10-11T10:00:00.000Z', false, 'circle'),
			row(2, 1, '2026-10-11T10:01:00.000Z', false, 'scale'),
			row(3, 2, '2026-10-12T10:00:00.000Z', true, 'circle'),
			row(4, 2, '2026-10-12T10:01:00.000Z', true, 'circle'),
			row(5, 3, '2026-10-13T10:00:00.000Z', true, 'scale'),
			row(6, 3, '2026-10-13T10:01:00.000Z', true, 'scale')
		];
		expect(weakTrend(attempts, NOW).map((p) => [p.date, p.weak])).toEqual([
			['2026-10-11', 2],
			['2026-10-12', 1],
			['2026-10-13', 0]
		]);
		expect(weakTrend(attempts, NOW)[0].label).toMatch(/11\.? okt/);
		expect(weakTrend([], NOW)).toEqual([]);
	});

	it('looks back at most the given number of days', () => {
		const attempts = [row(1, 1, '2026-08-01T10:00:00.000Z', false)];
		const trend = weakTrend(attempts, NOW, 30);
		expect(trend).toHaveLength(30);
		expect(trend[0].date).toBe('2026-09-14');
		expect(trend.every((p) => p.weak === 1)).toBe(true);
	});
});

describe('overview', () => {
	it('summarises practice, statuses, cost and flags', () => {
		const s = repo.createSession(db, 'adaptive', null, 10, NOW);
		const a = repo.insertAttempt(db, { ...row(0, s, NOW.toISOString(), false), sessionId: s });
		repo.saveSkillState(db, replay('circle', [{ correct: false, at: NOW.toISOString() }]));
		const conv = repo.createConversation(db, a, [], NOW)!;
		repo.flagConversation(db, conv.id, 'upset');
		repo.addMessage(db, {
			conversationId: conv.id, role: 'tutor', content: 'Hej', createdAt: NOW.toISOString(),
			inputTokens: 0, outputTokens: 50_000, cacheWriteTokens: 0, cacheReadTokens: 0
		});

		const o = overview(db, NOW, config);
		expect(o.daysThisWeek).toBe(1);
		expect(o.lastPractised).toMatch(/13\.? okt/);
		expect(o.counts).toEqual([
			{ status: 'untried', label: 'Ikke prøvet', count: 23 },
			{ status: 'weak', label: 'Svag', count: 1 },
			{ status: 'progressing', label: 'På vej', count: 0 },
			{ status: 'solid', label: 'Sikker', count: 0 },
			{ status: 'due', label: 'Skal genopfriskes', count: 0 }
		]);
		expect(o.trend.at(-1)).toMatchObject({ date: '2026-10-13', weak: 1 });
		expect(o).toMatchObject({ spend: '0,5', cap: '10', flaggedCount: 1, conversationCount: 1 });
	});

	it('works before anything has happened', () => {
		expect(overview(db, NOW, config)).toMatchObject({
			lastPractised: null, daysThisWeek: 0, minutesThisWeek: 0, trend: [], spend: '0', flaggedCount: 0
		});
	});
});

describe('skillHistory', () => {
	it('lists recent answers newest first, with any conversation', () => {
		const s = repo.createSession(db, 'adaptive', null, 10, NOW);
		const first = repo.insertAttempt(db, { ...row(0, s, NOW.toISOString(), false), sessionId: s });
		repo.insertAttempt(db, { ...row(0, s, NOW.toISOString(), true), sessionId: s });
		const conv = repo.createConversation(db, first, [], NOW)!;
		const history = skillHistory(db, 'circle');
		expect(history.map((h) => h.correct)).toEqual([true, false]);
		expect(history[1]).toMatchObject({ given: '1', answerText: '2', conversationId: conv.id });
		expect(history[1].promptHtml).toContain('katex');
		expect(history[0].conversationId).toBeNull();
	});
});
