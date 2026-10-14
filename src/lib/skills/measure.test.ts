import { describe, expect, it } from 'vitest';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

const decimals = (x: number) => (String(x).split('.')[1] ?? '').length;

describe('box-volume', () => {
	it('uses half centimetres at level 2 and finds a whole side at level 3', () => {
		for (const p of problems('box-volume', 2)) expect(p.prompt).toMatch(/\d,5 cm/);
		for (const p of problems('box-volume', 3)) expect(Number.isInteger(answerNumber(p))).toBe(true);
	});
});

describe('scale', () => {
	it('asks for the scale as 1:n at level 3', () => {
		for (const p of problems('scale', 3)) {
			expect(p.answerText).toMatch(/^1:\d+$/);
			expect([10, 20, 25, 50, 100, 200, 250, 500]).toContain(answerNumber(p));
		}
	});

	it('gives answers with at most one decimal', () => {
		for (const level of LEVELS) {
			for (const p of problems('scale', level)) expect(decimals(answerNumber(p)), p.prompt).toBeLessThanOrEqual(1);
		}
	});
});

describe('unit-conversion', () => {
	it('converts length, then area, then volume', () => {
		for (const p of problems('unit-conversion', 1)) expect(p.prompt).not.toMatch(/[²³]|liter/);
		for (const p of problems('unit-conversion', 2)) expect(p.prompt).toContain('²');
		for (const p of problems('unit-conversion', 3)) expect(p.prompt).toMatch(/³|liter/);
	});

	it('gives positive answers with at most two decimals', () => {
		for (const level of LEVELS) {
			for (const p of problems('unit-conversion', level)) {
				expect(answerNumber(p)).toBeGreaterThan(0);
				expect(decimals(answerNumber(p)), p.prompt).toBeLessThanOrEqual(2);
			}
		}
	});
});
