// Procent af et tal: find 1 %, gang med procenttallet.

import { int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function problem(prompt: string, percent: number, base: number): GeneratedProblem {
	const result = Math.round((base * percent) / 100);
	const onePercent = base / 100;
	const answerText = fmtNum(result);
	return {
		prompt,
		answer: { kind: 'number', value: int(result) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(
			[
				`1 % af ${base} er ${base} : 100 = ${fmtNum(onePercent)}.`,
				`${fmtNum(percent)} % er ${fmtNum(percent)} · ${fmtNum(onePercent)} = ${answerText}.`
			],
			answerText
		)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const percent = rng.pick([10, 20, 25, 50, 75]);
	const base = 20 * rng.int(1, 20);
	return problem(`Hvad er ${percent} % af ${base}?`, percent, base);
}

function level2(rng: Rng): GeneratedProblem {
	const percent = rng.pick([5, 15, 30, 35, 45, 60, 65, 85]);
	const base = 20 * rng.int(2, 30);
	const prompt = rng.chance(0.5)
		? `På en skole med ${base} elever cykler ${percent} % i skole. Hvor mange elever cykler i skole?`
		: `Hvad er ${percent} % af ${base}?`;
	return problem(prompt, percent, base);
}

function level3(rng: Rng): GeneratedProblem {
	const percent = rng.pick([2.5, 7.5, 12.5, 17.5, 22.5]);
	const base = 40 * rng.int(1, 15);
	return problem(`Hvad er ${fmtNum(percent)} % af ${base}?`, percent, base);
}

export const percentOf: SkillGenerator = {
	id: 'percent-of',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
