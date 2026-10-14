// Per-skill state, replayed from her attempts in order (spec section 5).
// State is never edited in place: change a rule, replay, and nothing is lost.

import type { SkillId } from '../skills/curriculum';
import type { Level } from '../skills/types';

export type Status = 'untried' | 'weak' | 'progressing' | 'solid';
export type DisplayStatus = Status | 'due';

export const STATUS_LABELS: Record<DisplayStatus, string> = {
	untried: 'Ikke prøvet',
	weak: 'Svag',
	progressing: 'På vej',
	solid: 'Sikker',
	due: 'Skal genopfriskes'
};

export interface AttemptRecord {
	correct: boolean;
	/** ISO timestamp. Records are passed oldest first. */
	at: string;
}

export interface SkillState {
	skillId: SkillId;
	strength: number;
	level: Level;
	status: Status;
	intervalIndex: number;
	nextReviewAt: string | null;
	attemptCount: number;
	lastAttemptAt: string | null;
}

export const STRENGTH_WINDOW = 8;
export const STRENGTH_DECAY = 0.8;
export const WEAK_BELOW = 0.6;
export const SOLID_FROM = 0.85;
export const REVIEW_INTERVAL_DAYS = [1, 3, 7, 21] as const;
const DAY_MS = 86_400_000;

export function untriedState(skillId: SkillId): SkillState {
	return {
		skillId,
		strength: 0,
		level: 2,
		status: 'untried',
		intervalIndex: 0,
		nextReviewAt: null,
		attemptCount: 0,
		lastAttemptAt: null
	};
}

/** Weighted share of right answers among the last 8; the newest weighs most. */
export function strengthOf(results: readonly boolean[]): number {
	const newestFirst = results.slice(-STRENGTH_WINDOW).reverse();
	let right = 0;
	let total = 0;
	newestFirst.forEach((ok, age) => {
		const weight = STRENGTH_DECAY ** age;
		total += weight;
		if (ok) right += weight;
	});
	return total === 0 ? 0 : right / total;
}

function statusOf(results: readonly boolean[], strength: number, level: Level): Status {
	if (results.length === 0) return 'untried';
	if (results.length < 3) return results[results.length - 1] ? 'progressing' : 'weak';
	if (strength < WEAK_BELOW) return 'weak';
	if (strength >= SOLID_FROM - 1e-9 && level === 3) return 'solid';
	return 'progressing';
}

const iso = (ms: number) => new Date(ms).toISOString();

export function replay(skillId: SkillId, attempts: readonly AttemptRecord[]): SkillState {
	let state = untriedState(skillId);
	const results: boolean[] = [];
	let runRight = 0;
	let runWrong = 0;

	attempts.forEach((attempt, i) => {
		results.push(attempt.correct);

		let level = state.level;
		if (i === 0) {
			level = attempt.correct ? 2 : 1;
			runRight = attempt.correct ? 1 : 0;
			runWrong = 0;
		} else if (attempt.correct) {
			runRight++;
			runWrong = 0;
			if (runRight >= 3 && level < 3) {
				level = (level + 1) as Level;
				runRight = 0;
			}
		} else {
			runWrong++;
			runRight = 0;
			if (runWrong >= 2 && level > 1) {
				level = (level - 1) as Level;
				runWrong = 0;
			}
		}

		const strength = strengthOf(results);
		const status = statusOf(results, strength, level);
		const now = Date.parse(attempt.at);
		let { intervalIndex, nextReviewAt } = state;

		if (!attempt.correct) intervalIndex = 0;
		if (status !== 'solid') {
			nextReviewAt = null;
		} else if (state.status !== 'solid') {
			intervalIndex = 0;
			nextReviewAt = iso(now + REVIEW_INTERVAL_DAYS[0] * DAY_MS);
		} else if (!attempt.correct) {
			nextReviewAt = iso(now + REVIEW_INTERVAL_DAYS[0] * DAY_MS);
		} else if (nextReviewAt !== null && now >= Date.parse(nextReviewAt)) {
			intervalIndex = Math.min(intervalIndex + 1, REVIEW_INTERVAL_DAYS.length - 1);
			nextReviewAt = iso(now + REVIEW_INTERVAL_DAYS[intervalIndex] * DAY_MS);
		}

		state = {
			skillId,
			strength,
			level,
			status,
			intervalIndex,
			nextReviewAt,
			attemptCount: results.length,
			lastAttemptAt: attempt.at
		};
	});
	return state;
}

export function isDue(state: SkillState, now: Date): boolean {
	return (
		state.status === 'solid' &&
		state.nextReviewAt !== null &&
		now.getTime() >= Date.parse(state.nextReviewAt)
	);
}

export function displayStatus(state: SkillState, now: Date): DisplayStatus {
	return isDue(state, now) ? 'due' : state.status;
}
