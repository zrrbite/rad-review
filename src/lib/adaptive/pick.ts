// Which problem comes next (spec section 5): weak skills most, due reviews
// next, untried skills last, never the same skill three times in a row.

import type { Rng } from '../rng';
import { interleavedOrder, SKILL_IDS, type SkillId } from '../skills/curriculum';
import type { Level } from '../skills/types';
import { isDue, untriedState, type SkillState } from './state';

export type SkillStates = Record<SkillId, SkillState>;
export type Pool = 'train' | 'review' | 'new';

export const POOL_WEIGHTS: Record<Pool, number> = { train: 60, review: 25, new: 15 };
export const SESSION_LENGTH = 10;
export const PRACTICE_LENGTH = 10;
export const PLACEMENT_LENGTH = 12;

export interface Pick {
	skillId: SkillId;
	level: Level;
	pool: Pool | 'early-review';
}

export function fillStates(partial: Partial<SkillStates>): SkillStates {
	const states = {} as SkillStates;
	for (const id of SKILL_IDS) states[id] = partial[id] ?? untriedState(id);
	return states;
}

export function blocked(skill: SkillId, recent: readonly SkillId[]): boolean {
	return recent.length >= 2 && recent[recent.length - 1] === skill && recent[recent.length - 2] === skill;
}

const byNextReview = (states: SkillStates) => (a: SkillId, b: SkillId) =>
	(states[a].nextReviewAt ?? '').localeCompare(states[b].nextReviewAt ?? '');

function weightedPool(pools: Pool[], rng: Rng): Pool {
	const total = pools.reduce((sum, p) => sum + POOL_WEIGHTS[p], 0);
	let r = rng.next() * total;
	for (const p of pools) {
		r -= POOL_WEIGHTS[p];
		if (r < 0) return p;
	}
	return pools[pools.length - 1];
}

export function pickNext(states: SkillStates, recent: readonly SkillId[], now: Date, rng: Rng): Pick {
	const open = SKILL_IDS.filter((s) => !blocked(s, recent));
	const pools: Record<Pool, SkillId[]> = {
		train: open.filter((s) => states[s].status === 'weak' || states[s].status === 'progressing'),
		review: open.filter((s) => isDue(states[s], now)),
		new: interleavedOrder().filter((s) => !blocked(s, recent) && states[s].status === 'untried')
	};
	const available = (['train', 'review', 'new'] as const).filter((p) => pools[p].length > 0);

	if (available.length === 0) {
		const solid = open.filter((s) => states[s].status === 'solid').sort(byNextReview(states));
		const skillId = solid[0] ?? open[0];
		return { skillId, level: states[skillId].level, pool: 'early-review' };
	}

	const pool = weightedPool(available, rng);
	let skillId: SkillId;
	if (pool === 'train') {
		const weakest = [...pools.train]
			.sort(
				(a, b) =>
					states[a].strength - states[b].strength ||
					(states[a].lastAttemptAt ?? '').localeCompare(states[b].lastAttemptAt ?? '')
			)
			.slice(0, 3);
		skillId = rng.pick(weakest);
	} else if (pool === 'review') {
		skillId = [...pools.review].sort(byNextReview(states))[0];
	} else {
		skillId = pools.new[0];
	}
	return { skillId, level: states[skillId].level, pool };
}

/** Up to 12 untried skills for one placement sitting, topics alternating. */
export function placementQueue(states: SkillStates): SkillId[] {
	return interleavedOrder()
		.filter((s) => states[s].status === 'untried')
		.slice(0, PLACEMENT_LENGTH);
}
