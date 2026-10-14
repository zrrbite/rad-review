// Negative tal: plus og minus på tallinjen, fortegnsregler for gange og dele,
// og blandede udtryk.

import { int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { paren, signedTerm } from './steps';
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

const signRule = (x: number, y: number) =>
	(x < 0) === (y < 0) ? 'To ens fortegn giver plus.' : 'To forskellige fortegn giver minus.';

function signed(rng: Rng, min: number, max: number): number {
	return rng.int(min, max) * (rng.chance(0.5) ? -1 : 1);
}

function level1(rng: Rng): GeneratedProblem {
	const variant = rng.int(0, 3);
	if (variant === 0) {
		const a = rng.int(-15, -1);
		const b = rng.int(1, 15);
		return problem(`${a} + ${b}`, a + b, [
			`Start ved ${fmtNum(a)} på tallinjen og gå ${b} til højre: $${a} + ${b} = ${a + b}$`
		]);
	}
	if (variant === 1) {
		const a = rng.int(0, 10);
		const b = rng.int(a + 1, a + 12);
		return problem(`${a} - ${b}`, a - b, [
			`Start ved ${a} på tallinjen og gå ${b} til venstre: $${a} - ${b} = ${a - b}$`
		]);
	}
	const a = rng.int(-10, 10);
	const b = rng.int(1, 10);
	if (variant === 2) {
		return problem(`${a} - (-${b})`, a + b, [
			`At trække et negativt tal fra er det samme som at lægge det til: $${a} - (-${b}) = ${a} + ${b}$`,
			`$${a} + ${b} = ${a + b}$`
		]);
	}
	return problem(`${a} + (-${b})`, a - b, [
		`At lægge et negativt tal til er det samme som at trække det fra: $${a} + (-${b}) = ${a} - ${b}$`,
		`$${a} - ${b} = ${a - b}$`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	let a = signed(rng, 2, 12);
	let b = signed(rng, 2, 12);
	if (a > 0 && b > 0) {
		if (rng.chance(0.5)) a = -a;
		else b = -b;
	}
	if (rng.chance(0.5)) {
		return problem(`${a} \\cdot ${paren(b)}`, a * b, [
			signRule(a, b),
			`$${Math.abs(a)} \\cdot ${Math.abs(b)} = ${Math.abs(a * b)}$, så $${a} \\cdot ${paren(b)} = ${a * b}$`
		]);
	}
	const dividend = a * b;
	return problem(`${dividend} : ${paren(b)}`, a, [
		signRule(dividend, b),
		`$${Math.abs(dividend)} : ${Math.abs(b)} = ${Math.abs(a)}$, så $${dividend} : ${paren(b)} = ${a}$`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const a = signed(rng, 2, 6);
	const b = rng.int(1, 11);
	const c = rng.int(b + 1, 12); // the parenthesis is always negative
	let d = rng.int(-10, 10);
	if (d === 0) d = 3;
	const inner = b - c;
	const product = a * inner;
	const value = product + d;
	return problem(`${a} \\cdot (${b} - ${c}) ${signedTerm(d)}`, value, [
		`Parentesen først: $${b} - ${c} = ${inner}$`,
		`Så gange: $${a} \\cdot ${paren(inner)} = ${product}$`,
		`Til sidst: $${product} ${signedTerm(d)} = ${value}$`
	]);
}

export const negativeNumbers: SkillGenerator = {
	id: 'negative-numbers',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
