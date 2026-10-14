// Løs ligninger med én ubekendt.

import { int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { signedTerm } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const term = (c: number) => (c === 1 ? 'x' : `${c}x`);

function problem(tex: string, x: number, steps: string[]): GeneratedProblem {
	const answerText = `x = ${fmtNum(x)}`;
	return {
		prompt: `Løs ligningen $${tex}$.`,
		answer: { kind: 'solution', variable: 'x', value: int(x) },
		answerText,
		inputHint: 'Skriv fx x = 4.',
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const variant = rng.int(0, 2);
	if (variant === 0) {
		const x = rng.int(1, 20);
		const a = rng.int(1, 20);
		return problem(`x + ${a} = ${x + a}`, x, [
			`Træk ${a} fra på begge sider: $x = ${x + a} - ${a}$`,
			`$x = ${x}$`
		]);
	}
	if (variant === 1) {
		const a = rng.int(2, 9);
		const x = rng.int(2, 12);
		return problem(`${a}x = ${a * x}`, x, [`Del med ${a} på begge sider: $x = ${a * x} : ${a}$`, `$x = ${x}$`]);
	}
	const x = rng.int(1, 20);
	const a = rng.int(1, 20);
	return problem(`x - ${a} = ${x - a}`, x, [`Læg ${a} til på begge sider: $x = ${x - a} + ${a}$`, `$x = ${x}$`]);
}

function level2(rng: Rng): GeneratedProblem {
	const a = rng.int(2, 9);
	const x = rng.int(1, 12);
	const b = rng.int(1, 20);
	if (rng.chance(0.5)) {
		const c = a * x + b;
		return problem(`${a}x + ${b} = ${c}`, x, [
			`Træk ${b} fra på begge sider: $${a}x = ${c} - ${b} = ${a * x}$`,
			`Del med ${a}: $x = ${x}$`
		]);
	}
	const c = a * x - b;
	return problem(`${a}x - ${b} = ${c}`, x, [
		`Læg ${b} til på begge sider: $${a}x = ${c} + ${b} = ${a * x}$`,
		`Del med ${a}: $x = ${x}$`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const c = rng.int(1, 5);
	const a = c + rng.int(1, 5);
	let x = rng.int(-6, 12);
	if (x === 0) x = 4;
	const b = rng.int(1, 20);
	let d = (a - c) * x + b;
	if (d === 0) d = (a - c) * (x + 1) + b; // keep "+ 0" out of the prompt
	const solved = (d - b) / (a - c);
	const steps = [
		`Træk ${term(c)} fra på begge sider: $${term(a - c)} + ${b} = ${d}$`,
		`Træk ${b} fra på begge sider: $${term(a - c)} = ${d - b}$`
	];
	if (a - c !== 1) steps.push(`Del med ${a - c}: $x = ${solved}$`);
	return problem(`${a}x + ${b} = ${term(c)} ${signedTerm(d)}`, solved, steps);
}

export const linearEquations: SkillGenerator = {
	id: 'linear-equations',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
