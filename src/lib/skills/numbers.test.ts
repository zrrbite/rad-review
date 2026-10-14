import { describe, expect, it } from 'vitest';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

describe('order-of-operations', () => {
	it('has whole answers from 0 to 200', () => {
		for (const level of LEVELS) {
			for (const p of problems('order-of-operations', level)) {
				const v = answerNumber(p);
				expect(Number.isInteger(v), p.prompt).toBe(true);
				expect(v, p.prompt).toBeGreaterThanOrEqual(0);
				expect(v, p.prompt).toBeLessThanOrEqual(200);
			}
		}
	});

	it('adds parentheses at level 2 and powers at level 3', () => {
		for (const p of problems('order-of-operations', 1)) expect(p.prompt).not.toContain('(');
		for (const p of problems('order-of-operations', 2)) expect(p.prompt).toContain('(');
		for (const p of problems('order-of-operations', 3)) expect(p.prompt).toContain('^');
	});
});

describe('negative-numbers', () => {
	it('always works with a negative number somewhere', () => {
		for (const level of LEVELS) {
			for (const p of problems('negative-numbers', level)) {
				expect(/[-−]\d/.test(p.prompt + p.solution.join(' ')), p.prompt).toBe(true);
			}
		}
	});

	it('has whole answers, including for division', () => {
		for (const level of LEVELS) {
			for (const p of problems('negative-numbers', level)) {
				expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
			}
		}
	});

	it('multiplies or divides at level 2', () => {
		for (const p of problems('negative-numbers', 2)) expect(p.prompt).toMatch(/\\cdot|:/);
	});
});
