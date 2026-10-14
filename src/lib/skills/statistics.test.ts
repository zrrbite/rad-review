import { describe, expect, it } from 'vitest';
import { answerNumber, problems } from './test-helpers';
import { LEVELS } from './types';

const listIn = (prompt: string) =>
	(prompt.match(/: ([\d, ]+)\./)?.[1] ?? '').split(', ').map(Number);

describe('descriptive-stats', () => {
	it('has a single most common value when asking for typetallet', () => {
		for (const p of problems('descriptive-stats', 1).filter((q) => q.prompt.includes('typetallet'))) {
			const counts = new Map<number, number>();
			for (const v of listIn(p.prompt)) counts.set(v, (counts.get(v) ?? 0) + 1);
			const top = Math.max(...counts.values());
			expect([...counts.values()].filter((c) => c === top), p.prompt).toHaveLength(1);
			expect(counts.get(answerNumber(p))).toBe(top);
		}
	});

	it('has whole means at level 2 and at most two decimals at level 3', () => {
		for (const p of problems('descriptive-stats', 2)) expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
		for (const p of problems('descriptive-stats', 3)) {
			expect((String(answerNumber(p)).split('.')[1] ?? '').length, p.prompt).toBeLessThanOrEqual(2);
		}
	});
});

describe('frequency', () => {
	it('shows a table at level 2 and asks for percent', () => {
		for (const p of problems('frequency', 2)) {
			expect(p.table).toHaveLength(2);
			expect(p.answer.kind).toBe('percent');
		}
	});

	it('has whole answers', () => {
		for (const level of LEVELS) {
			for (const p of problems('frequency', level)) expect(Number.isInteger(answerNumber(p)), p.prompt).toBe(true);
		}
	});
});

describe('probability', () => {
	it('stays strictly between 0 and 1', () => {
		for (const level of LEVELS) {
			for (const p of problems('probability', level)) {
				expect(answerNumber(p), p.prompt).toBeGreaterThan(0);
				expect(answerNumber(p), p.prompt).toBeLessThan(1);
			}
		}
	});

	it('uses two dice at level 3', () => {
		for (const p of problems('probability', 3)) {
			expect(p.prompt).toContain('to terninger');
			expect(answerNumber(p) * 36).toBeCloseTo(Math.round(answerNumber(p) * 36));
		}
	});
});

describe('counting', () => {
	it('has whole answers of at least 4', () => {
		for (const level of LEVELS) {
			for (const p of problems('counting', level)) {
				expect(Number.isInteger(answerNumber(p))).toBe(true);
				expect(answerNumber(p)).toBeGreaterThanOrEqual(4);
			}
		}
	});
});
