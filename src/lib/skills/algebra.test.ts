import { describe, expect, it } from 'vitest';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

describe('formula-substitution', () => {
	it('has whole-number answers', () => {
		for (const level of LEVELS) {
			for (const p of problems('formula-substitution', level)) {
				expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
			}
		}
	});
});

describe('simplify-expression', () => {
	it('answers with a reduced expression that still has an x', () => {
		for (const level of LEVELS) {
			for (const p of problems('simplify-expression', level)) {
				expect(p.answer.kind).toBe('expression');
				if (p.answer.kind === 'expression') expect(p.answer.coeff.n, p.prompt).not.toBe(0);
			}
		}
	});

	it('multiplies into a parenthesis at level 3', () => {
		for (const p of problems('simplify-expression', 3)) expect(p.prompt).toContain('(');
	});
});

describe('linear-equations', () => {
	it('has whole-number solutions', () => {
		for (const level of LEVELS) {
			for (const p of problems('linear-equations', level)) {
				expect(p.answer.kind).toBe('solution');
				expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
			}
		}
	});

	it('puts x on both sides at level 3', () => {
		for (const p of problems('linear-equations', 3)) {
			const [left, right] = p.prompt.split('=');
			expect(left, p.prompt).toContain('x');
			expect(right, p.prompt).toContain('x');
		}
	});
});

describe('linear-evaluate', () => {
	it('has a negative number in every level 2 problem', () => {
		for (const p of problems('linear-evaluate', 2)) expect(p.prompt).toMatch(/-\d|- \d|-x/);
	});

	it('asks for x at level 3', () => {
		for (const p of problems('linear-evaluate', 3)) {
			expect(p.prompt).toContain('Hvad er $x$');
			expect(p.answer.kind).toBe('solution');
		}
	});
});

describe('slope-intercept', () => {
	it('shows a four-point table at levels 1–2 and two points at level 3', () => {
		for (const level of [1, 2] as const) {
			for (const p of problems('slope-intercept', level)) {
				expect(p.table).toHaveLength(2);
				expect(p.table?.[0]).toHaveLength(5);
			}
		}
		for (const p of problems('slope-intercept', 3)) {
			expect(p.table).toBeUndefined();
			expect(p.prompt.match(/\(/g)).toHaveLength(2);
		}
	});

	it('has whole-number answers', () => {
		for (const level of LEVELS) {
			for (const p of problems('slope-intercept', level)) expect(Number.isInteger(answerNumber(p))).toBe(true);
		}
	});
});
