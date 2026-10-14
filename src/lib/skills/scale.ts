// Målestok: fra tegning til virkelighed, tilbage igen, og find målestokken.

import { fromNumber, int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function level1(rng: Rng): GeneratedProblem {
	const s = rng.pick([50, 100, 200, 500, 1000]);
	const cm = rng.int(2, 15);
	const realCm = cm * s;
	const metres = realCm / 100;
	const answerText = `${fmtNum(metres)} m`;
	return {
		prompt: `En tegning er lavet i målestok 1:${s}. En væg er ${cm} cm lang på tegningen. Hvor lang er væggen i virkeligheden?`,
		answer: { kind: 'number', value: fromNumber(metres) },
		answerText,
		inputHint: 'Svar i meter.',
		solution: withAnswer(
			[`1 cm på tegningen er ${s} cm i virkeligheden.`, `${cm} · ${s} = ${realCm} cm`, `${realCm} cm = ${fmtNum(metres)} m`],
			answerText
		)
	};
}

function level2(rng: Rng): GeneratedProblem {
	const s = rng.pick([50, 100, 200, 500]);
	const drawing = rng.int(2, 20);
	const metres = (drawing * s) / 100;
	const answerText = `${drawing} cm`;
	return {
		prompt: `En bygning er ${fmtNum(metres)} m lang. Hvor lang bliver bygningen på en tegning i målestok 1:${s}?`,
		answer: { kind: 'number', value: int(drawing) },
		answerText,
		inputHint: 'Svar i cm.',
		solution: withAnswer(
			[`${fmtNum(metres)} m = ${drawing * s} cm`, `${drawing * s} : ${s} = ${drawing} cm`],
			answerText
		)
	};
}

function level3(rng: Rng): GeneratedProblem {
	const cm = rng.int(2, 10);
	const s = rng.pick([10, 20, 25, 50, 100, 200, 250, 500]);
	const realCm = cm * s;
	const answerText = `1:${s}`;
	return {
		prompt: `På en tegning er en ${cm} cm lang streg ${fmtNum(realCm / 100)} m i virkeligheden. Hvad er målestokken?`,
		answer: { kind: 'number', value: int(s) },
		answerText,
		inputHint: 'Skriv målestokken, fx 1:50.',
		solution: withAnswer(
			[
				`${fmtNum(realCm / 100)} m = ${realCm} cm`,
				`${realCm} : ${cm} = ${s}`,
				`1 cm på tegningen er ${s} cm i virkeligheden.`
			],
			answerText
		)
	};
}

export const scale: SkillGenerator = {
	id: 'scale',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
