import { describe, expect, it } from 'vitest';
import { addDays, formatDanishDay, localDate, localMonth, weekStart } from './time';

describe('Copenhagen calendar', () => {
	it('puts late Sunday UTC on Monday in Copenhagen', () => {
		// 2026-10-11 is a Sunday; 22:30 UTC is 00:30 on Monday in summer time (UTC+2).
		expect(localDate('2026-10-11T22:30:00Z')).toBe('2026-10-12');
		expect(weekStart('2026-10-11T22:30:00Z')).toBe('2026-10-12');
		expect(weekStart('2026-10-11T21:30:00Z')).toBe('2026-10-05');
		expect(weekStart(new Date('2026-10-13T12:00:00Z'))).toBe('2026-10-12');
	});

	it('changes month at Copenhagen midnight after summer time ends', () => {
		// Summer time ends 2026-10-25, so on 31 October Copenhagen is UTC+1.
		expect(localMonth('2026-10-31T22:30:00Z')).toBe('2026-10');
		expect(localMonth('2026-10-31T23:30:00Z')).toBe('2026-11');
	});

	it('adds days across a month end', () => {
		expect(addDays('2026-10-30', 3)).toBe('2026-11-02');
		expect(addDays('2026-10-12', -6)).toBe('2026-10-06');
	});

	it('formats short Danish dates', () => {
		expect(formatDanishDay('2026-10-13T10:00:00Z')).toMatch(/13\.? okt/);
	});
});
