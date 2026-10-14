// Vinkelsummen i en trekant er 180°.

import { int } from '../math/fraction';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function problem(prompt: string, value: number, steps: string[]): GeneratedProblem {
	const answerText = `${value}°`;
	return {
		prompt,
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: 'Svar i grader.',
		solution: withAnswer(steps, answerText)
	};
}

const SUM = 'Vinklerne i en trekant er tilsammen 180°.';

function level1(rng: Rng): GeneratedProblem {
	const a = rng.int(20, 100);
	const b = rng.int(20, 160 - a);
	const c = 180 - a - b;
	return problem(`I en trekant er to af vinklerne ${a}° og ${b}°. Hvor stor er den tredje vinkel?`, c, [
		SUM,
		`180° − ${a}° − ${b}° = ${c}°`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const variant = rng.int(0, 2);
	if (variant === 0) {
		const top = 2 * rng.int(10, 70);
		const base = (180 - top) / 2;
		return problem(
			`En ligebenet trekant har en topvinkel på ${top}°. Hvor stor er hver af de to andre vinkler?`,
			base,
			['I en ligebenet trekant er de to vinkler ved grundlinjen lige store.', `(180° − ${top}°) : 2 = ${base}°`]
		);
	}
	if (variant === 1) {
		const base = rng.int(20, 80);
		const top = 180 - 2 * base;
		return problem(`En ligebenet trekant har to vinkler på ${base}° hver. Hvor stor er topvinklen?`, top, [
			SUM,
			`180° − 2 · ${base}° = ${top}°`
		]);
	}
	const a = rng.int(15, 75);
	return problem(`En retvinklet trekant har en vinkel på ${a}°. Hvor stor er den tredje vinkel?`, 90 - a, [
		'Den rette vinkel er 90°.',
		`180° − 90° − ${a}° = ${90 - a}°`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const a = rng.int(15, 50);
		const c = 180 - 3 * a;
		return problem(
			`I en trekant er vinkel B dobbelt så stor som vinkel A, og vinkel C er ${c}°. Hvor stor er vinkel A?`,
			a,
			[`A + 2A + ${c}° = 180°`, `3A = 180° − ${c}° = ${180 - c}°`, `A = ${180 - c}° : 3 = ${a}°`]
		);
	}
	const a = rng.int(20, 60);
	const d = 5 * rng.int(2, 8);
	const c = 180 - 2 * a - d;
	return problem(
		`I en trekant er vinkel B ${d}° større end vinkel A, og vinkel C er ${c}°. Hvor stor er vinkel A?`,
		a,
		[`A + (A + ${d}°) + ${c}° = 180°`, `2A = 180° − ${d}° − ${c}° = ${2 * a}°`, `A = ${2 * a}° : 2 = ${a}°`]
	);
}

export const triangleAngles: SkillGenerator = {
	id: 'triangle-angles',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
