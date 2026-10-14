// Omregning mellem brøk, decimaltal og procent.

import { frac, fromNumber, gcd, int } from '../math/fraction';
import { fmtDecimal, fmtFrac, fmtNum, texNum } from '../math/format';
import type { Rng } from '../rng';
import { reduceSteps } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const DIVISORS_OF_100 = [2, 4, 5, 10, 20, 25, 50];
const PERCENTS = [5, 15, 20, 25, 35, 40, 45, 55, 60, 65, 75, 80, 12.5, 37.5, 62.5, 87.5];

/** A fraction in lowest terms whose denominator divides 100. */
function hundredthsFraction(rng: Rng): [number, number] {
	const d = rng.pick(DIVISORS_OF_100);
	let n = rng.int(1, d - 1);
	while (gcd(n, d) !== 1) n = rng.int(1, d - 1);
	return [n, d];
}

function level1(rng: Rng): GeneratedProblem {
	const [n, d] = hundredthsFraction(rng);
	const value = frac(n, d);
	const hundredths = (n * 100) / d;
	const answerText = fmtDecimal(value);
	return {
		prompt: `Skriv $\\frac{${n}}{${d}}$ som decimaltal.`,
		answer: { kind: 'decimal', value },
		answerText,
		inputHint: 'Skriv et decimaltal, fx 0,25.',
		solution: withAnswer(
			[
				`Forlæng til nævneren 100: $\\frac{${n}}{${d}} = \\frac{${hundredths}}{100}$`,
				`${hundredths} hundrededele er ${answerText}.`
			],
			answerText
		)
	};
}

function level2(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const [n, d] = hundredthsFraction(rng);
		const percent = (n * 100) / d;
		const answerText = `${percent} %`;
		return {
			prompt: `Skriv $\\frac{${n}}{${d}}$ som procent.`,
			answer: { kind: 'percent', value: int(percent) },
			answerText,
			inputHint: 'Svar i procent, fx 35 %.',
			solution: withAnswer(
				[
					`Forlæng til nævneren 100: $\\frac{${n}}{${d}} = \\frac{${percent}}{100}$`,
					`${percent} hundrededele er ${percent} %.`
				],
				answerText
			)
		};
	}
	let hundredths = rng.int(1, 150);
	if (hundredths === 100) hundredths = 125;
	const decimal = fmtDecimal(frac(hundredths, 100));
	const answerText = `${hundredths} %`;
	return {
		prompt: `Skriv ${decimal} som procent.`,
		answer: { kind: 'percent', value: int(hundredths) },
		answerText,
		inputHint: 'Svar i procent, fx 35 %.',
		solution: withAnswer(
			[`Gang med 100: $${texNum(hundredths / 100)} \\cdot 100 = ${hundredths}$`, `Altså ${hundredths} %.`],
			answerText
		)
	};
}

function level3(rng: Rng): GeneratedProblem {
	const percent = rng.pick(PERCENTS);
	const value = fromNumber(percent / 100);
	const answerText = fmtFrac(value);
	const whole = Number.isInteger(percent);
	const steps = whole
		? [`${percent} % betyder ${percent} hundrededele: $\\frac{${percent}}{100}$`, ...reduceSteps(percent, 100)]
		: [
				`${fmtNum(percent)} % betyder $\\frac{${texNum(percent)}}{100}$. Gang tæller og nævner med 10: $\\frac{${percent * 10}}{1000}$`,
				...reduceSteps(percent * 10, 1000)
			];
	return {
		prompt: `Skriv ${fmtNum(percent)} % som brøk. Forkort mest muligt.`,
		answer: { kind: 'fraction-reduced', value },
		answerText,
		inputHint: 'Skriv svaret som en brøk, fx 3/4.',
		solution: withAnswer(steps, answerText)
	};
}

export const fractionDecimalPercent: SkillGenerator = {
	id: 'fraction-decimal-percent',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
