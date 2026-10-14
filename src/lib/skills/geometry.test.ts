import { describe, expect, it } from 'vitest';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

describe('triangle-angles', () => {
	it('gives a whole angle between 10° and 170°', () => {
		for (const level of LEVELS) {
			for (const p of problems('triangle-angles', level)) {
				const v = answerNumber(p);
				expect(Number.isInteger(v), p.prompt).toBe(true);
				expect(v, p.prompt).toBeGreaterThanOrEqual(10);
				expect(v, p.prompt).toBeLessThanOrEqual(170);
				expect(p.answerText).toMatch(/°$/);
			}
		}
	});
});

describe('perimeter-area', () => {
	it('gives positive whole answers with a unit', () => {
		for (const level of LEVELS) {
			for (const p of problems('perimeter-area', level)) {
				expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
				expect(answerNumber(p)).toBeGreaterThan(0);
				expect(p.answerText).toMatch(/ (cm|m)²?$/);
			}
		}
	});
});

describe('circle', () => {
	it('asks for one decimal and accepts π ≈ 3,14', () => {
		for (const level of LEVELS) {
			for (const p of problems('circle', level)) {
				expect(p.answer.kind).toBe('rounded');
				expect(p.inputHint).toContain('én decimal');
			}
		}
	});

	it('level 3 radii come out close to whole numbers', () => {
		for (const p of problems('circle', 3)) {
			const r = answerNumber(p);
			expect(Math.abs(r - Math.round(r)), p.prompt).toBeLessThan(0.05);
		}
	});
});
