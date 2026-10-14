import { describe, expect, it } from 'vitest';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

const decimals = (x: number) => (String(x).split('.')[1] ?? '').length;

describe('fraction-decimal-percent', () => {
	it('uses the answer kind that fits the question', () => {
		for (const p of problems('fraction-decimal-percent', 1)) expect(p.answer.kind).toBe('decimal');
		for (const p of problems('fraction-decimal-percent', 2)) expect(p.answer.kind).toBe('percent');
		for (const p of problems('fraction-decimal-percent', 3)) expect(p.answer.kind).toBe('fraction-reduced');
	});

	it('keeps level 1 decimals to at most two places', () => {
		for (const p of problems('fraction-decimal-percent', 1)) expect(decimals(answerNumber(p))).toBeLessThanOrEqual(2);
	});
});

describe('percent-of', () => {
	it('always has a whole-number answer', () => {
		for (const level of LEVELS) {
			for (const p of problems('percent-of', level)) expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
		}
	});

	it('uses half percents at level 3', () => {
		for (const p of problems('percent-of', 3)) expect(p.prompt).toMatch(/\d,5 %/);
	});
});

describe('percent-what', () => {
	it('gives whole percents at levels 1–2 and at most one decimal at level 3', () => {
		for (const level of [1, 2] as const) {
			for (const p of problems('percent-what', level)) expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
		}
		for (const p of problems('percent-what', 3)) expect(decimals(answerNumber(p))).toBeLessThanOrEqual(1);
	});

	it('stays between 0 and 100 percent', () => {
		for (const level of LEVELS) {
			for (const p of problems('percent-what', level)) {
				expect(answerNumber(p)).toBeGreaterThan(0);
				expect(answerNumber(p)).toBeLessThan(100);
			}
		}
	});
});

describe('percent-change', () => {
	it('lowers prices at level 1, raises them at level 2, asks for the percent at level 3', () => {
		for (const p of problems('percent-change', 1)) {
			const price = Number(p.prompt.match(/koster (\d+) kr/)?.[1]);
			expect(answerNumber(p), p.prompt).toBeLessThan(price);
		}
		for (const p of problems('percent-change', 2)) {
			const price = Number(p.prompt.match(/(\d+) kr/)?.[1]);
			expect(answerNumber(p), p.prompt).toBeGreaterThan(price);
		}
		for (const p of problems('percent-change', 3)) expect(p.answer.kind).toBe('percent');
	});
});
