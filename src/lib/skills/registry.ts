// Skill id → generator. Each generator task adds its import and one entry.

import { createRng } from '../rng';
import { formulaSubstitution } from './formula-substitution';
import { fractionAddSub } from './fraction-add-sub';
import { fractionDecimalPercent } from './fraction-decimal-percent';
import { fractionMulDiv } from './fraction-mul-div';
import { fractionSimplify } from './fraction-simplify';
import { linearEquations } from './linear-equations';
import { linearEvaluate } from './linear-evaluate';
import { negativeNumbers } from './negative-numbers';
import { orderOfOperations } from './order-of-operations';
import { percentChange } from './percent-change';
import { percentOf } from './percent-of';
import { percentWhat } from './percent-what';
import { simplifyExpression } from './simplify-expression';
import { slopeIntercept } from './slope-intercept';
import type { SkillId } from './curriculum';
import type { Level, Problem, SkillGenerator } from './types';

const GENERATORS: SkillGenerator[] = [
	orderOfOperations,
	negativeNumbers,
	fractionSimplify,
	fractionAddSub,
	fractionMulDiv,
	fractionDecimalPercent,
	percentOf,
	percentWhat,
	percentChange,
	formulaSubstitution,
	simplifyExpression,
	linearEquations,
	linearEvaluate,
	slopeIntercept
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
