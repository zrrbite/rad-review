// Hældning og skæring for en ret linje, ud fra en tabel eller to punkter.

import { int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { paren } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function nonZero(rng: Rng, min: number, max: number): number {
	let v = 0;
	while (v === 0) v = rng.int(min, max);
	return v;
}

function problem(
	prompt: string,
	value: number,
	steps: string[],
	table?: string[][]
): GeneratedProblem {
	const answerText = fmtNum(value);
	return {
		prompt,
		...(table ? { table } : {}),
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(steps, answerText)
	};
}

function table(xs: number[], a: number, b: number): string[][] {
	return [
		['x', ...xs.map((x) => fmtNum(x))],
		['y', ...xs.map((x) => fmtNum(a * x + b))]
	];
}

const LINE = 'Tabellen viser punkter på en ret linje $y = ax + b$.';

function level1(rng: Rng): GeneratedProblem {
	const a = nonZero(rng, -5, 5);
	const b = rng.int(-8, 8);
	return problem(
		`${LINE} Hvad er $b$, altså skæringen med y-aksen?`,
		b,
		['Skæringen med y-aksen er y-værdien, når $x = 0$.', `I tabellen er $y = ${b}$, når $x = 0$.`],
		table([0, 1, 2, 3], a, b)
	);
}

function level2(rng: Rng): GeneratedProblem {
	const a = nonZero(rng, -5, 5);
	const b = rng.int(-8, 8);
	const start = rng.int(1, 5);
	const xs = [start, start + 1, start + 2, start + 3];
	const [y0, y1] = [a * start + b, a * (start + 1) + b];
	return problem(
		`${LINE} Hvad er hældningen $a$?`,
		a,
		[
			`Når x vokser med 1, ændrer y sig fra ${fmtNum(y0)} til ${fmtNum(y1)}.`,
			`Hældningen er $${y1} - ${paren(y0)} = ${a}$`
		],
		table(xs, a, b)
	);
}

function level3(rng: Rng): GeneratedProblem {
	const a = nonZero(rng, -5, 5);
	const b = rng.int(-8, 8);
	const x1 = rng.int(-3, 4);
	const dx = rng.int(1, 4);
	const x2 = x1 + dx;
	const [y1, y2] = [a * x1 + b, a * x2 + b];
	const points = `$(${x1}, ${y1})$ og $(${x2}, ${y2})$`;
	const slope = `$a = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{${y2} - ${paren(y1)}}{${x2} - ${paren(x1)}} = \\frac{${y2 - y1}}{${dx}} = ${a}$`;
	if (rng.chance(0.5)) {
		return problem(`En ret linje går gennem punkterne ${points}. Hvad er hældningen?`, a, [slope]);
	}
	return problem(`En ret linje går gennem punkterne ${points}. Hvad er $b$ i $y = ax + b$?`, b, [
		slope,
		`$b = y_1 - a \\cdot x_1 = ${y1} - ${paren(a)} \\cdot ${paren(x1)} = ${b}$`
	]);
}

export const slopeIntercept: SkillGenerator = {
	id: 'slope-intercept',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
