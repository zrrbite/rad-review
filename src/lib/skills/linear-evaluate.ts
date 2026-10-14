// Udregn y ud fra y = ax + b, og find x ud fra y.

import { int } from '../math/fraction';
import { fmtNum, texLinear } from '../math/format';
import type { Rng } from '../rng';
import { paren, signedTerm } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function nonZero(rng: Rng, min: number, max: number): number {
	let v = 0;
	while (v === 0) v = rng.int(min, max);
	return v;
}

function findY(a: number, b: number, x: number): GeneratedProblem {
	const y = a * x + b;
	const answerText = fmtNum(y);
	return {
		prompt: `Funktionen er $y = ${texLinear(int(a), int(b))}$. Hvad er $y$, når $x = ${x}$?`,
		answer: { kind: 'number', value: int(y) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(
			[
				`Sæt $x = ${x}$ ind: $y = ${a} \\cdot ${paren(x)} ${signedTerm(b)}$`,
				`$y = ${a * x} ${signedTerm(b)} = ${y}$`
			],
			answerText
		)
	};
}

function level1(rng: Rng): GeneratedProblem {
	return findY(rng.int(2, 6), rng.int(1, 10), rng.int(1, 10));
}

function level2(rng: Rng): GeneratedProblem {
	let a = nonZero(rng, -6, 6);
	let b = nonZero(rng, -10, 10);
	const x = nonZero(rng, -6, 6);
	if (a > 0 && b > 0 && x > 0) {
		if (rng.chance(0.5)) a = -a;
		else b = -b;
	}
	return findY(a, b, x);
}

function level3(rng: Rng): GeneratedProblem {
	const a = rng.int(2, 6);
	const b = nonZero(rng, -10, 10);
	const x = rng.int(-5, 10);
	const y = a * x + b;
	const answerText = `x = ${fmtNum(x)}`;
	const move = b > 0 ? `Træk ${b} fra på begge sider` : `Læg ${-b} til på begge sider`;
	return {
		prompt: `Funktionen er $y = ${texLinear(int(a), int(b))}$. Hvad er $x$, når $y = ${y}$?`,
		answer: { kind: 'solution', variable: 'x', value: int(x) },
		answerText,
		inputHint: 'Skriv fx x = 4.',
		solution: withAnswer(
			[
				`Sæt $y = ${y}$ ind: $${y} = ${a}x ${signedTerm(b)}$`,
				`${move}: $${y - b} = ${a}x$`,
				`Del med ${a}: $x = ${x}$`
			],
			answerText
		)
	};
}

export const linearEvaluate: SkillGenerator = {
	id: 'linear-evaluate',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
