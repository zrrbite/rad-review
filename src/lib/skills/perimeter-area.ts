// Omkreds og areal af rektangel, trekant, parallelogram, trapez og sammensatte figurer.

import { int } from '../math/fraction';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function problem(prompt: string, value: number, unit: string, steps: string[]): GeneratedProblem {
	const answerText = `${value} ${unit}`;
	return {
		prompt,
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: `Svar i ${unit}.`,
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const u = rng.pick(['cm', 'm']);
	const l = rng.int(3, 20);
	const w = rng.int(2, l - 1);
	const shape = `Et rektangel er ${l} ${u} langt og ${w} ${u} bredt.`;
	if (rng.chance(0.5)) {
		return problem(`${shape} Hvad er arealet?`, l * w, `${u}²`, [
			'Areal = længde · bredde',
			`${l} · ${w} = ${l * w} ${u}²`
		]);
	}
	return problem(`${shape} Hvad er omkredsen?`, 2 * l + 2 * w, u, [
		'Omkreds = 2 · længde + 2 · bredde',
		`2 · ${l} + 2 · ${w} = ${2 * l + 2 * w} ${u}`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const u = rng.pick(['cm', 'm']);
	let g = rng.int(2, 20);
	const h = rng.int(2, 20);
	if (rng.chance(0.5)) {
		if ((g * h) % 2 === 1) g += 1;
		return problem(
			`En trekant har grundlinjen ${g} ${u} og højden ${h} ${u}. Hvad er arealet?`,
			(g * h) / 2,
			`${u}²`,
			['Areal = ½ · højde · grundlinje', `${h} · ${g} : 2 = ${(g * h) / 2} ${u}²`]
		);
	}
	return problem(
		`Et parallelogram har grundlinjen ${g} ${u} og højden ${h} ${u}. Hvad er arealet?`,
		g * h,
		`${u}²`,
		['Areal = højde · grundlinje', `${h} · ${g} = ${g * h} ${u}²`]
	);
}

function level3(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const u = rng.pick(['cm', 'm']);
		const a = rng.int(3, 12);
		const b = rng.int(a + 1, 16);
		let h = rng.int(2, 12);
		if ((h * (a + b)) % 2 === 1) h += 1;
		const area = (h * (a + b)) / 2;
		return problem(
			`Et trapez har de parallelle sider ${a} ${u} og ${b} ${u}, og højden er ${h} ${u}. Hvad er arealet?`,
			area,
			`${u}²`,
			['Areal = ½ · højde · (a + b)', `${h} · (${a} + ${b}) : 2 = ${h} · ${a + b} : 2 = ${area} ${u}²`]
		);
	}
	const length = rng.int(6, 15);
	const width = rng.int(5, 12);
	const cutL = rng.int(1, length - 2);
	const cutW = rng.int(1, width - 2);
	const area = length * width - cutL * cutW;
	return problem(
		`En figur er et rektangel på ${length} m gange ${width} m, hvor der er skåret et hjørne på ${cutL} m gange ${cutW} m væk. Hvad er arealet af figuren?`,
		area,
		'm²',
		[
			`Hele rektanglet: ${length} · ${width} = ${length * width} m²`,
			`Hjørnet: ${cutL} · ${cutW} = ${cutL * cutW} m²`,
			`${length * width} − ${cutL * cutW} = ${area} m²`
		]
	);
}

export const perimeterArea: SkillGenerator = {
	id: 'perimeter-area',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
