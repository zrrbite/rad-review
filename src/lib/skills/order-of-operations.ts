// Regnehierarki: parenteser først, så potenser, så gange og dele, til sidst plus og minus.

import { int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function problem(tex: string, value: number, steps: string[]): GeneratedProblem {
	const answerText = fmtNum(value);
	return {
		prompt: `Udregn $${tex}$.`,
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const b = rng.int(2, 9);
	const c = rng.int(2, 9);
	if (rng.chance(0.5)) {
		const a = rng.int(2, 20);
		return problem(`${a} + ${b} \\cdot ${c}`, a + b * c, [
			`Gange før plus: $${b} \\cdot ${c} = ${b * c}$`,
			`$${a} + ${b * c} = ${a + b * c}$`
		]);
	}
	const a = b * c + rng.int(1, 20);
	return problem(`${a} - ${b} \\cdot ${c}`, a - b * c, [
		`Gange før minus: $${b} \\cdot ${c} = ${b * c}$`,
		`$${a} - ${b * c} = ${a - b * c}$`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const variant = rng.int(0, 2);
	if (variant === 0) {
		const b = rng.int(1, 9);
		const a = b + rng.int(1, 9);
		const c = rng.int(2, 9);
		const d = rng.int(1, 20);
		const inner = a - b;
		return problem(`(${a} - ${b}) \\cdot ${c} + ${d}`, inner * c + d, [
			`Parentesen først: $${a} - ${b} = ${inner}$`,
			`Så gange: $${inner} \\cdot ${c} = ${inner * c}$`,
			`Til sidst plus: $${inner * c} + ${d} = ${inner * c + d}$`
		]);
	}
	if (variant === 1) {
		const a = rng.int(2, 9);
		const b = rng.int(1, 9);
		const c = rng.int(1, 9);
		const product = a * (b + c);
		const d = rng.int(1, Math.min(20, product));
		return problem(`${a} \\cdot (${b} + ${c}) - ${d}`, product - d, [
			`Parentesen først: $${b} + ${c} = ${b + c}$`,
			`Så gange: $${a} \\cdot ${b + c} = ${product}$`,
			`Til sidst minus: $${product} - ${d} = ${product - d}$`
		]);
	}
	const c = rng.int(2, 9);
	const q = rng.int(2, 9);
	const a = rng.int(1, c * q - 1);
	const b = c * q - a;
	const d = rng.int(1, 20);
	return problem(`(${a} + ${b}) : ${c} + ${d}`, q + d, [
		`Parentesen først: $${a} + ${b} = ${c * q}$`,
		`Så dele: $${c * q} : ${c} = ${q}$`,
		`Til sidst plus: $${q} + ${d} = ${q + d}$`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const base = rng.int(2, 5);
		const exponent = base <= 3 ? rng.int(2, 3) : 2;
		const power = base ** exponent;
		const divisor = rng.int(2, 6);
		const d = rng.int(1, 9);
		const c = d + divisor;
		const q = rng.int(2, 9);
		const b = divisor * q;
		return problem(`${base}^{${exponent}} + ${b} : (${c} - ${d})`, power + q, [
			`Parentesen først: $${c} - ${d} = ${divisor}$`,
			`Så potensen: $${base}^{${exponent}} = ${power}$`,
			`Så dele: $${b} : ${divisor} = ${q}$`,
			`Til sidst plus: $${power} + ${q} = ${power + q}$`
		]);
	}
	const a = rng.int(2, 6);
	const b = rng.int(2, 5);
	const square = b * b;
	const c = rng.int(1, a * square);
	return problem(`${a} \\cdot ${b}^{2} - ${c}`, a * square - c, [
		`Potensen først: $${b}^{2} = ${square}$`,
		`Så gange: $${a} \\cdot ${square} = ${a * square}$`,
		`Til sidst minus: $${a * square} - ${c} = ${a * square - c}$`
	]);
}

export const orderOfOperations: SkillGenerator = {
	id: 'order-of-operations',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
