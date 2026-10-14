// Skill id → generator. Each generator task adds its import and one entry.

import { createRng } from '../rng';
import { negativeNumbers } from './negative-numbers';
import { orderOfOperations } from './order-of-operations';
import type { SkillId } from './curriculum';
import type { Level, Problem, SkillGenerator } from './types';

const GENERATORS: SkillGenerator[] = [
	orderOfOperations,
	negativeNumbers
];

const BY_ID = new Map<SkillId, SkillGenerator>(GENERATORS.map((g) => [g.id, g]));

export function registeredSkills(): SkillId[] {
	return [...BY_ID.keys()];
}

export function generateProblem(skillId: SkillId, level: Level, seed: number): Problem {
	const generator = BY_ID.get(skillId);
	if (!generator) throw new Error(`no generator for ${skillId}`);
	return { ...generator.generate(level, createRng(seed)), skillId, level, seed };
}
