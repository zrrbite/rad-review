// Indsæt tal i et udtryk eller en formel.

import { int } from '../math/fraction';
import { fmtNum, texNum } from '../math/format';
import type { Rng } from '../rng';
import { paren } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

/** `unit`, when given, ends with a period ("kr.") so the hint is a sentence. */
function problem(prompt: string, value: number, steps: string[], unit = ''): GeneratedProblem {
	const answerText = unit ? `${fmtNum(value)} ${unit}` : fmtNum(value);
	return {
		prompt,
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: unit ? `Svar i ${unit}` : 'Skriv et tal.',
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const v = rng.pick(['x', 'a', 'n']);
	const a = rng.int(2, 9);
	const b = rng.int(1, 15);
	const x = rng.int(1, 10);
	const minus = rng.chance(0.4) && a * x > b;
	const op = minus ? '-' : '+';
	const value = minus ? a * x - b : a * x + b;
	return problem(`Udregn $${a}${v} ${op} ${b}$, når $${v} = ${x}$.`, value, [
		`Sæt ${x} ind i stedet for ${v}: $${a} \\cdot ${x} ${op} ${b}$`,
		`$= ${a * x} ${op} ${b} = ${value}$`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const c1 = rng.int(2, 5);
	const c2 = rng.int(2, 5);
	let a = rng.int(-6, 8);
	if (a === 0) a = 2;
	let b = rng.int(-8, 8);
	if (b === 0) b = -3;
	if (a > 0 && b > 0) b = -b;
	const value = c1 * a - c2 * b;
	return problem(`Udregn $${c1}a - ${c2}b$, når $a = ${a}$ og $b = ${b}$.`, value, [
		`Sæt tallene ind: $${c1} \\cdot ${paren(a)} - ${c2} \\cdot ${paren(b)}$`,
		`$= ${c1 * a} - ${paren(c2 * b)} = ${value}$`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const variant = rng.int(0, 2);
	if (variant === 0) {
		const rate = rng.int(8, 15);
		const start = 5 * rng.int(6, 12);
		const km = rng.int(3, 25);
		const value = rate * km + start;
		return problem(
			`En taxatur koster $P = ${rate} \\cdot k + ${start}$ kroner, hvor $k$ er antal kilometer. Hvad koster en tur på ${km} km?`,
			value,
			[`Sæt $k = ${km}$ ind: $P = ${rate} \\cdot ${km} + ${start}$`, `$= ${rate * km} + ${start} = ${value}$`],
			'kr.'
		);
	}
	if (variant === 1) {
		const h = rng.int(2, 10);
		const a = rng.int(3, 12);
		let b = rng.int(a + 1, 15);
		if ((h * (a + b)) % 2 === 1) b += 1;
		const value = (h * (a + b)) / 2;
		return problem(
			`Arealet af et trapez er $A = \\frac{h \\cdot (a + b)}{2}$. Udregn $A$, når $h = ${h}$, $a = ${a}$ og $b = ${b}$.`,
			value,
			[
				`Sæt ind: $A = \\frac{${h} \\cdot (${a} + ${b})}{2}$`,
				`$= \\frac{${h} \\cdot ${a + b}}{2} = \\frac{${h * (a + b)}}{2} = ${value}$`
			]
		);
	}
	const c = 5 * rng.int(-4, 8);
	const product = Math.round(1.8 * c);
	const value = product + 32;
	return problem(
		`Man kan regne grader celsius om til fahrenheit med formlen $F = 1{,}8 \\cdot C + 32$. Hvad er $F$, når $C = ${c}$?`,
		value,
		[`Sæt ind: $F = 1{,}8 \\cdot ${paren(c)} + 32$`, `$= ${texNum(product)} + 32 = ${value}$`]
	);
}

export const formulaSubstitution: SkillGenerator = {
	id: 'formula-substitution',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
