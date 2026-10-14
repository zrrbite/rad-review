// Skill id → generator. Every skill in curriculum.ts has exactly one.

import { createRng } from '../rng';
import { boxVolume } from './box-volume';
import { circle } from './circle';
import { counting } from './counting';
import type { SkillId } from './curriculum';
import { descriptiveStats } from './descriptive-stats';
import { formulaSubstitution } from './formula-substitution';
import { fractionAddSub } from './fraction-add-sub';
import { fractionDecimalPercent } from './fraction-decimal-percent';
import { fractionMulDiv } from './fraction-mul-div';
import { fractionSimplify } from './fraction-simplify';
import { frequency } from './frequency';
import { linearEquations } from './linear-equations';
import { linearEvaluate } from './linear-evaluate';
import { negativeNumbers } from './negative-numbers';
import { orderOfOperations } from './order-of-operations';
import { percentChange } from './percent-change';
import { percentOf } from './percent-of';
import { percentWhat } from './percent-what';
import { perimeterArea } from './perimeter-area';
import { probability } from './probability';
import { scale } from './scale';
import { simplifyExpression } from './simplify-expression';
import { slopeIntercept } from './slope-intercept';
import { triangleAngles } from './triangle-angles';
import type { Level, Problem, SkillGenerator } from './types';
import { unitConversion } from './unit-conversion';

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
	slopeIntercept,
	triangleAngles,
	perimeterArea,
	circle,
	boxVolume,
	scale,
	unitConversion,
	descriptiveStats,
	frequency,
	probability,
	counting
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
