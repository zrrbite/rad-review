// Plus og minus med brøker: samme nævner, forskellige nævnere, blandede tal.

import { add, eq, frac, lcm, sub, toNum, type Frac } from '../math/fraction';
import { fmtFrac, fmtMixed, texFrac, texMixed } from '../math/format';
import type { Rng } from '../rng';
import { COPRIME_PROPER, reduceSteps } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const HINT = 'Skriv svaret som en brøk, forkortet mest muligt, fx 3/4.';
const SUFFIX = 'Forkort svaret mest muligt.';

function result(prompt: string, value: Frac, steps: string[], mixed = false): GeneratedProblem {
	const answerText = mixed ? fmtMixed(value) : fmtFrac(value);
	return {
		prompt,
		answer: { kind: 'fraction-reduced', value },
		answerText,
		inputHint: mixed ? 'Skriv svaret som en brøk eller et blandet tal, fx 1 2/3.' : HINT,
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const n = rng.int(3, 12);
	let a = rng.int(1, n - 1);
	let b = rng.int(1, n - 1);
	const plus = rng.chance(0.5) || a === b;
	if (!plus && a < b) [a, b] = [b, a];
	const top = plus ? a + b : a - b;
	const op = plus ? '+' : '-';
	return result(
		`Udregn $\\frac{${a}}{${n}} ${op} \\frac{${b}}{${n}}$. ${SUFFIX}`,
		frac(top, n),
		[
			`Brøkerne har samme nævner, så ${plus ? 'læg tællerne sammen' : 'træk tællerne fra hinanden'}: $\\frac{${a} ${op} ${b}}{${n}} = \\frac{${top}}{${n}}$`,
			...reduceSteps(top, n)
		]
	);
}

function level2(rng: Rng): GeneratedProblem {
	const m = rng.int(2, 10);
	let n = rng.int(2, 10);
	if (n === m) n = m === 10 ? 2 : m + 1;
	let [a, x] = [rng.int(1, m - 1), m];
	let [b, y] = [rng.int(1, n - 1), n];
	let plus = rng.chance(0.5);
	if (a / x === b / y) plus = true;
	if (!plus && a / x < b / y) [a, x, b, y] = [b, y, a, x];
	const common = lcm(x, y);
	const [first, second] = [(a * common) / x, (b * common) / y];
	const top = plus ? first + second : first - second;
	const op = plus ? '+' : '-';
	return result(
		`Udregn $\\frac{${a}}{${x}} ${op} \\frac{${b}}{${y}}$. ${SUFFIX}`,
		frac(top, common),
		[
			`Find en fællesnævner: ${common}.`,
			`$\\frac{${a}}{${x}} = \\frac{${first}}{${common}}$ og $\\frac{${b}}{${y}} = \\frac{${second}}{${common}}$`,
			`$\\frac{${first}}{${common}} ${op} \\frac{${second}}{${common}} = \\frac{${top}}{${common}}$`,
			...reduceSteps(top, common)
		]
	);
}

function level3(rng: Rng): GeneratedProblem {
	const small = COPRIME_PROPER.filter(([, d]) => d <= 8);
	const [a, m] = rng.pick(small);
	const [b, n] = rng.pick(small);
	let x = add(frac(rng.int(1, 4)), frac(a, m));
	let y = add(frac(rng.int(1, 3)), frac(b, n));
	let plus = rng.chance(0.5);
	if (eq(x, y)) plus = true;
	if (!plus && toNum(x) < toNum(y)) [x, y] = [y, x];
	const value = plus ? add(x, y) : sub(x, y);
	const common = lcm(x.d, y.d);
	const [first, second] = [(x.n * common) / x.d, (y.n * common) / y.d];
	const top = plus ? first + second : first - second;
	const op = plus ? '+' : '-';
	return result(
		`Udregn $${texMixed(x)} ${op} ${texMixed(y)}$. ${SUFFIX}`,
		value,
		[
			`Lav de blandede tal om til brøker: $${texMixed(x)} = ${texFrac(x)}$ og $${texMixed(y)} = ${texFrac(y)}$`,
			`Fællesnævner ${common}: $${texFrac(x)} = \\frac{${first}}{${common}}$ og $${texFrac(y)} = \\frac{${second}}{${common}}$`,
			`$\\frac{${first}}{${common}} ${op} \\frac{${second}}{${common}} = \\frac{${top}}{${common}}$`,
			...reduceSteps(top, common),
			...(value.n > value.d && value.d !== 1 ? [`Som blandet tal: $${texMixed(value)}$`] : [])
		],
		true
	);
}

export const fractionAddSub: SkillGenerator = {
	id: 'fraction-add-sub',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
