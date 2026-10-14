// Shared by the generator tests: a batch of seeded problems and their numeric answers.

import { toNum } from '../math/fraction';
import type { SkillId } from './curriculum';
import { generateProblem } from './registry';
import type { Level, Problem } from './types';

export function problems(skill: SkillId, level: Level, count = 300): Problem[] {
	return Array.from({ length: count }, (_, i) => generateProblem(skill, level, i + 1));
}

export function answerNumber(p: Problem): number {
	switch (p.answer.kind) {
		case 'rounded':
			return p.answer.exact;
		case 'expression':
			throw new Error(`${p.skillId} has an expression answer`);
		default:
			return toNum(p.answer.value);
	}
}
