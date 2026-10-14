import { describe, expect, it } from 'vitest';
import {
	displayStatus, isDue, replay, STATUS_LABELS, strengthOf, untriedState, type AttemptRecord
} from './state';

const T0 = Date.parse('2026-10-05T16:00:00Z');
const DAY = 24 * 60;
const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString();

/** "RRW" → three attempts a minute apart from `start` minutes. */
function history(pattern: string, start = 0): AttemptRecord[] {
	return [...pattern].map((c, i) => ({ correct: c === 'R', at: at(start + i) }));
}

describe('strengthOf', () => {
	it('weights newer answers more', () => {
		expect(strengthOf([])).toBe(0);
		expect(strengthOf([true])).toBe(1);
		expect(strengthOf([true, false])).toBeCloseTo(0.8 / 1.8, 10);
		expect(strengthOf([false, true])).toBeCloseTo(1 / 1.8, 10);
	});

	it('only looks at the last 8 answers', () => {
		expect(strengthOf([false, ...Array(8).fill(true)])).toBe(1);
	});
});

describe('replay', () => {
	it('starts untried at level 2', () => {
		expect(replay('circle', [])).toEqual(untriedState('circle'));
		expect(untriedState('circle')).toMatchObject({ status: 'untried', level: 2, strength: 0 });
	});

	it('uses the first answer to place the level', () => {
		expect(replay('circle', history('R'))).toMatchObject({ status: 'progressing', level: 2, strength: 1 });
		expect(replay('circle', history('W'))).toMatchObject({ status: 'weak', level: 1, strength: 0 });
	});

	it('moves up after three right and down after two wrong', () => {
		expect(replay('circle', history('RRR')).level).toBe(3);
		expect(replay('circle', history('WRRR')).level).toBe(2);
		expect(replay('circle', history('RWW')).level).toBe(1);
		expect(replay('circle', history('RRRWW')).level).toBe(2);
		expect(replay('circle', history('RRRRRRR')).level).toBe(3);
	});

	it('resets the run when the level changes', () => {
		// R R R → level 3 (run reset), R R → still 3, W W → 2, R R → still 2, R → 3
		expect(replay('circle', history('RRRRRWWRR')).level).toBe(2);
		expect(replay('circle', history('RRRRRWWRRR')).level).toBe(3);
	});

	it('derives the status from strength and level', () => {
		expect(replay('circle', history('WRRR'))).toMatchObject({ status: 'progressing' });
		expect(replay('circle', history('WRRR')).strength).toBeCloseTo(2.44 / 2.952, 10);
		expect(replay('circle', history('RWW'))).toMatchObject({ status: 'weak' });
		expect(replay('circle', history('RRR'))).toMatchObject({ status: 'solid', attemptCount: 3 });
		expect(replay('circle', history('RRRW'))).toMatchObject({ status: 'progressing', level: 3 });
	});

	it('records the count and the last attempt time', () => {
		expect(replay('circle', history('RWR', 10))).toMatchObject({ attemptCount: 3, lastAttemptAt: at(12) });
	});
});

describe('review schedule', () => {
	it('schedules the first review a day after becoming solid', () => {
		const s = replay('circle', history('RRR'));
		expect(s.intervalIndex).toBe(0);
		expect(s.nextReviewAt).toBe(at(2 + DAY));
	});

	it('ignores right answers before the review is due', () => {
		const s = replay('circle', [...history('RRR'), { correct: true, at: at(30) }]);
		expect(s.nextReviewAt).toBe(at(2 + DAY));
		expect(s.intervalIndex).toBe(0);
	});

	it('stretches the interval 1 → 3 → 7 → 21 → 21 days on right answers when due', () => {
		const attempts = history('RRR');
		const due: number[] = [];
		let next = 2 + DAY;
		for (const days of [3, 7, 21, 21]) {
			const when = next + 5;
			attempts.push({ correct: true, at: at(when) });
			due.push(days);
			next = when + days * DAY;
			const s = replay('circle', attempts);
			expect(s.nextReviewAt, `after ${due.length} reviews`).toBe(at(next));
		}
		expect(replay('circle', attempts).intervalIndex).toBe(3);
	});

	it('drops the schedule when a wrong answer takes the skill out of solid', () => {
		const s = replay('circle', [...history('RRR'), { correct: false, at: at(2 + DAY + 5) }]);
		expect(s).toMatchObject({ status: 'progressing', nextReviewAt: null, intervalIndex: 0 });
	});

	it('restarts at one day when the skill becomes solid again', () => {
		// After the wrong answer, the third right one (minute DAY + 22) lifts strength
		// back over 0.85; the fourth comes before the review is due and changes nothing.
		const attempts = [...history('RRR'), { correct: false, at: at(DAY + 10) }, ...history('RRRR', DAY + 20)];
		const s = replay('circle', attempts);
		expect(s.status).toBe('solid');
		expect(s.intervalIndex).toBe(0);
		expect(s.nextReviewAt).toBe(at(DAY + 22 + DAY));
	});
});

describe('isDue and displayStatus', () => {
	it('shows a solid skill as due once its review time has passed', () => {
		const s = replay('circle', history('RRR'));
		const before = new Date(Date.parse(at(2 + DAY)) - 1);
		const after = new Date(at(2 + DAY));
		expect(isDue(s, before)).toBe(false);
		expect(displayStatus(s, before)).toBe('solid');
		expect(isDue(s, after)).toBe(true);
		expect(displayStatus(s, after)).toBe('due');
		expect(isDue(replay('circle', history('W')), after)).toBe(false);
	});

	it('has Danish labels', () => {
		expect(STATUS_LABELS).toEqual({
			untried: 'Ikke prøvet',
			weak: 'Svag',
			progressing: 'På vej',
			solid: 'Sikker',
			due: 'Skal genopfriskes'
		});
	});
});
