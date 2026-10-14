import { describe, expect, it } from 'vitest';
import { gcd } from '../math/fraction';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

const fractionsIn = (tex: string) =>
	[...tex.matchAll(/\\frac\{(\d+)\}\{(\d+)\}/g)].map((m) => [Number(m[1]), Number(m[2])]);

describe('fraction-simplify', () => {
	it('level 1 shows a fraction that can be reduced', () => {
		for (const p of problems('fraction-simplify', 1)) {
			const [[n, d]] = fractionsIn(p.prompt);
			expect(gcd(n, d), p.prompt).toBeGreaterThan(1);
			expect(p.answer.kind).toBe('fraction-reduced');
		}
	});

	it('level 3 compares two close but different fractions', () => {
		for (const p of problems('fraction-simplify', 3)) {
			const [[a, b], [c, d]] = fractionsIn(p.prompt);
			const diff = Math.abs(a / b - c / d);
			expect(diff, p.prompt).toBeGreaterThan(0);
			expect(diff, p.prompt).toBeLessThanOrEqual(0.15);
			expect(answerNumber(p)).toBe(Math.max(a / b, c / d));
		}
	});
});

describe('fraction-add-sub', () => {
	it('never gives zero or a negative answer', () => {
		for (const level of LEVELS) {
			for (const p of problems('fraction-add-sub', level)) expect(answerNumber(p), p.prompt).toBeGreaterThan(0);
		}
	});

	it('uses different denominators from level 2 and mixed numbers at level 3', () => {
		for (const p of problems('fraction-add-sub', 2)) {
			const [[, b], [, d]] = fractionsIn(p.prompt);
			expect(b, p.prompt).not.toBe(d);
		}
		for (const p of problems('fraction-add-sub', 3)) expect(p.prompt).toMatch(/\d\\frac/);
	});
});

describe('fraction-mul-div', () => {
	it('multiplies at levels 1–2 and divides at level 3', () => {
		for (const p of problems('fraction-mul-div', 1)) expect(p.prompt).toContain('\\cdot');
		for (const p of problems('fraction-mul-div', 2)) expect(p.prompt).toContain('\\cdot');
		for (const p of problems('fraction-mul-div', 3)) expect(p.prompt).toContain(':');
	});

	it('asks for lowest terms', () => {
		for (const level of LEVELS) {
			for (const p of problems('fraction-mul-div', level)) expect(p.answer.kind).toBe('fraction-reduced');
		}
	});
});
