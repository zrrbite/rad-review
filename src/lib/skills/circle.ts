// Cirklens omkreds og areal, og radius ud fra omkredsen. Svar afrundes til én decimal.

import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const round1 = (x: number) => Math.round(x * 10) / 10;

function problem(prompt: string, exact: number, unit: string, steps: string[]): GeneratedProblem {
	const answerText = `${fmtNum(round1(exact))} ${unit}`;
	return {
		prompt,
		answer: { kind: 'rounded', exact, decimals: 1 },
		answerText,
		inputHint: 'Afrund til én decimal.',
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const r = rng.int(2, 20);
	const exact = 2 * Math.PI * r;
	if (rng.chance(0.5)) {
		return problem(`En cirkel har radius ${r} cm. Hvad er omkredsen?`, exact, 'cm', [
			'Omkreds = 2 · π · r',
			`2 · π · ${r} ≈ ${fmtNum(round1(exact))} cm`
		]);
	}
	return problem(`En cirkel har diameter ${2 * r} cm. Hvad er omkredsen?`, exact, 'cm', [
		'Omkreds = π · d',
		`π · ${2 * r} ≈ ${fmtNum(round1(exact))} cm`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const r = rng.int(2, 15);
	const exact = Math.PI * r * r;
	const area = [`Areal = π · r²`, `π · ${r}² = π · ${r * r} ≈ ${fmtNum(round1(exact))} cm²`];
	if (rng.chance(0.5)) {
		return problem(`En cirkel har radius ${r} cm. Hvad er arealet?`, exact, 'cm²', area);
	}
	return problem(`En cirkel har diameter ${2 * r} cm. Hvad er arealet?`, exact, 'cm²', [
		`Radius er halvdelen af diameteren: ${2 * r} : 2 = ${r} cm`,
		...area
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const r = rng.int(2, 20);
	const circumference = round1(2 * Math.PI * r);
	const exact = circumference / (2 * Math.PI);
	return problem(`En cirkel har omkredsen ${fmtNum(circumference)} cm. Hvad er radius?`, exact, 'cm', [
		'Omkreds = 2 · π · r, så r = omkreds : (2 · π)',
		`${fmtNum(circumference)} : (2 · π) ≈ ${fmtNum(round1(exact))} cm`
	]);
}

export const circle: SkillGenerator = {
	id: 'circle',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
