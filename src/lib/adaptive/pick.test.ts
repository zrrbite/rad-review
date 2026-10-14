import { describe, expect, it } from 'vitest';
import { createRng } from '../rng';
import { topicOf, type SkillId } from '../skills/curriculum';
import { blocked, fillStates, pickNext, placementQueue, type SkillStates } from './pick';
import type { SkillState } from './state';

const NOW = new Date('2026-10-13T16:00:00Z');
const PAST = '2026-10-10T16:00:00.000Z';
const FUTURE = '2026-10-20T16:00:00.000Z';

const solid = (nextReviewAt: string): Partial<SkillState> => ({
	status: 'solid', level: 3, strength: 0.95, attemptCount: 6, nextReviewAt, lastAttemptAt: PAST
});
const weak = (strength: number, level: 1 | 2 | 3 = 1): Partial<SkillState> => ({
	status: 'weak', level, strength, attemptCount: 4, lastAttemptAt: PAST
});

/** Every skill solid and not due, then the overrides. */
function make(overrides: Partial<Record<SkillId, Partial<SkillState>>> = {}, base = solid(FUTURE)): SkillStates {
	const states = fillStates({});
	for (const id of Object.keys(states) as SkillId[]) states[id] = { ...states[id], ...base };
	for (const [id, patch] of Object.entries(overrides)) {
		states[id as SkillId] = { ...states[id as SkillId], ...patch };
	}
	return states;
}

describe('fillStates', () => {
	it('fills every skill that has no state with an untried one', () => {
		const states = fillStates({});
		expect(Object.keys(states)).toHaveLength(24);
		expect(states.circle).toMatchObject({ status: 'untried', level: 2 });
	});
});

describe('pickNext', () => {
	it('starts with the first new skill when everything is untried', () => {
		expect(pickNext(fillStates({}), [], NOW, createRng(1))).toEqual({
			skillId: 'order-of-operations', level: 2, pool: 'new'
		});
	});

	it('draws pools roughly 60 / 25 / 15', () => {
		const states = make({
			circle: weak(0.3),
			'percent-of': weak(0.4),
			counting: solid(PAST),
			scale: { status: 'untried', level: 2, strength: 0, attemptCount: 0, nextReviewAt: null }
		});
		const counts = { train: 0, review: 0, new: 0, 'early-review': 0 };
		const runs = 4000;
		for (let seed = 1; seed <= runs; seed++) counts[pickNext(states, [], NOW, createRng(seed)).pool]++;
		expect(counts.train / runs).toBeCloseTo(0.6, 1);
		expect(counts.review / runs).toBeCloseTo(0.25, 1);
		expect(counts.new / runs).toBeCloseTo(0.15, 1);
		expect(counts['early-review']).toBe(0);
	});

	it('trains one of the three weakest skills, at their own level', () => {
		const states = make({
			circle: weak(0.1),
			scale: weak(0.2, 2),
			counting: weak(0.3),
			frequency: weak(0.4),
			probability: weak(0.5)
		});
		const seen = new Set<SkillId>();
		for (let seed = 1; seed <= 300; seed++) {
			const pick = pickNext(states, [], NOW, createRng(seed));
			expect(pick.pool).toBe('train');
			seen.add(pick.skillId);
			expect(pick.level).toBe(states[pick.skillId].level);
		}
		expect([...seen].sort()).toEqual(['circle', 'counting', 'scale']);
	});

	it('reviews the most overdue skill first', () => {
		const states = make({ circle: solid('2026-10-12T00:00:00.000Z'), scale: solid('2026-10-09T00:00:00.000Z') });
		expect(pickNext(states, [], NOW, createRng(3))).toMatchObject({ skillId: 'scale', pool: 'review' });
	});

	it('never gives the same skill three times in a row', () => {
		const states = make({ circle: weak(0.1) });
		expect(blocked('circle', ['scale', 'circle', 'circle'])).toBe(true);
		expect(blocked('circle', ['circle', 'scale'])).toBe(false);
		for (let seed = 1; seed <= 50; seed++) {
			expect(pickNext(states, ['circle', 'circle'], NOW, createRng(seed)).skillId).not.toBe('circle');
		}
	});

	it('reviews early when nothing is weak, due or new', () => {
		const states = make({ circle: solid('2026-10-14T00:00:00.000Z') });
		expect(pickNext(states, [], NOW, createRng(1))).toEqual({ skillId: 'circle', level: 3, pool: 'early-review' });
	});
});

describe('placementQueue', () => {
	it('takes 12 untried skills with topics alternating', () => {
		const queue = placementQueue(fillStates({}));
		expect(queue).toHaveLength(12);
		expect(queue[0]).toBe('order-of-operations');
		for (let i = 1; i < queue.length; i++) expect(topicOf(queue[i]).id).not.toBe(topicOf(queue[i - 1]).id);
	});

	it('takes what is left in the second sitting', () => {
		const first = placementQueue(fillStates({}));
		const states = fillStates({});
		for (const id of first) states[id] = { ...states[id], status: 'progressing', attemptCount: 1 };
		const second = placementQueue(states);
		expect(second).toHaveLength(12);
		expect(second.filter((id) => first.includes(id))).toEqual([]);
		for (const id of second) states[id] = { ...states[id], status: 'weak', attemptCount: 1 };
		expect(placementQueue(states)).toEqual([]);
	});
});
