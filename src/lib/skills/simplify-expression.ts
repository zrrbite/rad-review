// Reducér udtryk: saml led, og gang ind i parenteser.

import { int } from '../math/fraction';
import { fmtLinear, texLinear } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const HINT = 'Skriv udtrykket så kort som muligt, fx 5x + 3.';

/** "x", "-x" or "3x", for TeX. */
const term = (c: number) => (c === 1 ? 'x' : c === -1 ? '-x' : `${c}x`);

function problem(tex: string, coeff: number, constant: number, steps: string[]): GeneratedProblem {
	const answerText = fmtLinear(int(coeff), int(constant));
	return {
		prompt: `Reducér $${tex}$.`,
		answer: { kind: 'expression', variable: 'x', coeff: int(coeff), constant: int(constant) },
		answerText,
		inputHint: HINT,
		solution: withAnswer([...steps, `Altså $${texLinear(int(coeff), int(constant))}$`], answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const a = rng.int(1, 9);
	const b = rng.int(1, 9);
	const c = rng.int(1, a + b - 1);
	const k = a + b - c;
	return problem(`${term(a)} + ${term(b)} - ${term(c)}`, k, 0, [
		`Alle led indeholder x, så regn med tallene foran: $${a} + ${b} - ${c} = ${k}$`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const a = rng.int(1, 9);
	const c = rng.int(1, 9);
	const b = rng.int(1, 15);
	const d = rng.int(1, 15);
	return problem(`${term(a)} + ${b} + ${term(c)} - ${d}`, a + c, b - d, [
		`Saml x-leddene: $${term(a)} + ${term(c)} = ${term(a + c)}$`,
		`Saml tallene: $${b} - ${d} = ${b - d}$`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const variant = rng.int(0, 2);
	if (variant === 0) {
		const a = rng.int(2, 6);
		const b = rng.int(1, 9);
		let c = rng.int(1, 9);
		if (c === a) c = a + 1;
		return problem(`${a}(x + ${b}) - ${term(c)}`, a - c, a * b, [
			`Gang ind i parentesen: $${a}(x + ${b}) = ${a}x + ${a * b}$`,
			`Saml x-leddene: $${a}x - ${term(c)} = ${term(a - c)}$`
		]);
	}
	if (variant === 1) {
		const a = rng.int(2, 6);
		const b = rng.int(1, 9);
		const c = rng.int(1, 9);
		return problem(`${a}(x - ${b}) + ${term(c)}`, a + c, -a * b, [
			`Gang ind i parentesen: $${a}(x - ${b}) = ${a}x - ${a * b}$`,
			`Saml x-leddene: $${a}x + ${term(c)} = ${term(a + c)}$`
		]);
	}
	const a = rng.int(2, 5);
	const b = rng.int(2, 5);
	const c = rng.int(1, 9);
	const d = rng.int(1, 20);
	return problem(`${a}(${b}x + ${c}) - ${d}`, a * b, a * c - d, [
		`Gang ind i parentesen: $${a}(${b}x + ${c}) = ${a * b}x + ${a * c}$`,
		`Saml tallene: $${a * c} - ${d} = ${a * c - d}$`
	]);
}

export const simplifyExpression: SkillGenerator = {
	id: 'simplify-expression',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
