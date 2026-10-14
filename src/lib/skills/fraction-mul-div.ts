// Gange og dele med brøker.

import { frac } from '../math/fraction';
import { fmtFrac } from '../math/format';
import type { Rng } from '../rng';
import { COPRIME_PROPER, reduceSteps } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const HINT = 'Skriv svaret som en brøk, forkortet mest muligt, fx 3/4.';
const SUFFIX = 'Forkort svaret mest muligt.';
const pairs = () => COPRIME_PROPER.filter(([, d]) => d <= 10);

function result(prompt: string, n: number, d: number, steps: string[]): GeneratedProblem {
	const value = frac(n, d);
	const answerText = fmtFrac(value);
	return {
		prompt,
		answer: { kind: 'fraction-reduced', value },
		answerText,
		inputHint: HINT,
		solution: withAnswer([...steps, ...reduceSteps(n, d)], answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const k = rng.int(2, 9);
	const [a, b] = rng.pick(pairs());
	return result(`Udregn $${k} \\cdot \\frac{${a}}{${b}}$. ${SUFFIX}`, k * a, b, [
		`Gang tælleren med ${k}: $\\frac{${k} \\cdot ${a}}{${b}} = \\frac{${k * a}}{${b}}$`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const [a, b] = rng.pick(pairs());
	const [c, d] = rng.pick(pairs());
	return result(`Udregn $\\frac{${a}}{${b}} \\cdot \\frac{${c}}{${d}}$. ${SUFFIX}`, a * c, b * d, [
		`Gang tæller med tæller og nævner med nævner: $\\frac{${a} \\cdot ${c}}{${b} \\cdot ${d}} = \\frac{${a * c}}{${b * d}}$`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const [a, b] = rng.pick(pairs());
	const [c, d] = rng.pick(pairs());
	return result(`Udregn $\\frac{${a}}{${b}} : \\frac{${c}}{${d}}$. ${SUFFIX}`, a * d, b * c, [
		`At dele med en brøk er det samme som at gange med den omvendte brøk: $\\frac{${a}}{${b}} \\cdot \\frac{${d}}{${c}}$`,
		`Gang tæller med tæller og nævner med nævner: $\\frac{${a * d}}{${b * c}}$`
	]);
}

export const fractionMulDiv: SkillGenerator = {
	id: 'fraction-mul-div',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
