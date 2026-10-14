// Every registered generator, every level, 500 seeds: the answer it gives is
// accepted by the checker, the solution ends with that answer, the text has no
// template leftovers, and the same seed gives the same problem.

import { describe, expect, it } from 'vitest';
import { checkAnswer } from '../math/check';
import { generateProblem, registeredSkills } from './registry';
import { LEVELS } from './types';

const SEEDS = Array.from({ length: 500 }, (_, i) => i * 7919 + 1);

it('has a registry', () => {
	expect(Array.isArray(registeredSkills())).toBe(true);
});

describe.each(registeredSkills())('%s', (skillId) => {
	it.each(LEVELS)('level %i: 500 problems are well formed', (level) => {
		const variants = new Set<string>();
		for (const seed of SEEDS) {
			const p = generateProblem(skillId, level, seed);
			const where = `${skillId} L${level} seed ${seed}: ${p.prompt}`;
			variants.add(p.prompt + JSON.stringify(p.table ?? null));

			expect(checkAnswer(p.answer, p.answerText).result, where).toBe('right');
			expect(p.solution.at(-1), where).toBe(`Svar: ${p.answerText}`);
			expect(p.solution.length, where).toBeGreaterThanOrEqual(2);
			expect(p.inputHint, where).toMatch(/\.$/);
			for (const text of [p.prompt, p.inputHint, ...p.solution, ...(p.table ?? []).flat()]) {
				// Template leftovers, and double signs like "5 - -3" or "+ −2".
				expect(text, where).not.toMatch(/undefined|NaN|Infinity|\{\{|\[object|--|[-−+] [-−]\d/);
				expect((text.match(/\$/g) ?? []).length % 2, where).toBe(0);
			}
			expect(generateProblem(skillId, level, seed), where).toEqual(p);
		}
		expect(variants.size, `${skillId} L${level} variety`).toBeGreaterThanOrEqual(5);
	});
});
