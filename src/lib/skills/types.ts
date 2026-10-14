import type { Answer } from '../math/check';
import type { Rng } from '../rng';
import type { SkillId } from './curriculum';

export type Level = 1 | 2 | 3;
export const LEVELS: readonly Level[] = [1, 2, 3];

/** What a generator returns; the registry adds skill, level and seed. */
export interface GeneratedProblem {
	/** Danish text. Math inside $…$ is rendered by KaTeX. */
	prompt: string;
	/** Optional grid; the first cell of each row is its header. */
	table?: string[][];
	answer: Answer;
	/** The correct answer as she would type it, e.g. "7/20", "2,5", "x = 4", "42 m²". */
	answerText: string;
	/** One short sentence under the input box. */
	inputHint: string;
	/** Worked steps in Danish; the last is exactly `Svar: ${answerText}`. */
	solution: string[];
}

export interface Problem extends GeneratedProblem {
	skillId: SkillId;
	level: Level;
	seed: number;
}

export interface SkillGenerator {
	id: SkillId;
	generate(level: Level, rng: Rng): GeneratedProblem;
}

export type Maker = (rng: Rng) => GeneratedProblem;

/** The solution steps plus the answer line every problem ends with. */
export function withAnswer(steps: string[], answerText: string): string[] {
	return [...steps, `Svar: ${answerText}`];
}

export function byLevel(level: Level, rng: Rng, makers: readonly [Maker, Maker, Maker]): GeneratedProblem {
	return makers[level - 1](rng);
}
