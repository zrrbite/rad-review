// Rumfang af en kasse: længde · bredde · højde, og en manglende side.

import { frac, int, mul, type Frac } from '../math/fraction';
import { fmtValue } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function problem(prompt: string, value: Frac, unit: string, steps: string[]): GeneratedProblem {
	const answerText = `${fmtValue(value)} ${unit}`;
	return {
		prompt,
		answer: { kind: 'number', value },
		answerText,
		inputHint: `Svar i ${unit}.`,
		solution: withAnswer(steps, answerText)
	};
}

const FORMULA = 'Rumfang = længde · bredde · højde';

function level1(rng: Rng): GeneratedProblem {
	const [l, w, h] = [rng.int(2, 12), rng.int(2, 12), rng.int(2, 12)];
	const v = l * w * h;
	return problem(`En kasse er ${l} cm lang, ${w} cm bred og ${h} cm høj. Hvad er rumfanget?`, int(v), 'cm³', [
		FORMULA,
		`${l} · ${w} · ${h} = ${v} cm³`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	const l = frac(2 * rng.int(2, 12) + 1, 2);
	const w = rng.chance(0.3) ? frac(2 * rng.int(2, 8) + 1, 2) : int(rng.int(2, 10));
	const h = int(rng.int(2, 10));
	const v = mul(mul(l, w), h);
	const [ls, ws, hs] = [fmtValue(l), fmtValue(w), fmtValue(h)];
	return problem(`En kasse er ${ls} cm lang, ${ws} cm bred og ${hs} cm høj. Hvad er rumfanget?`, v, 'cm³', [
		FORMULA,
		`${ls} · ${ws} · ${hs} = ${fmtValue(v)} cm³`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	const [l, w, h] = [rng.int(2, 12), rng.int(2, 12), rng.int(2, 15)];
	const v = l * w * h;
	return problem(
		`En kasse har rumfanget ${v} cm³. Den er ${l} cm lang og ${w} cm bred. Hvor høj er kassen?`,
		int(h),
		'cm',
		[
			'Rumfang = længde · bredde · højde, så højde = rumfang : (længde · bredde)',
			`${v} : (${l} · ${w}) = ${v} : ${l * w} = ${h} cm`
		]
	);
}

export const boxVolume: SkillGenerator = {
	id: 'box-volume',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
