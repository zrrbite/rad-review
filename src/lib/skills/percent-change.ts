// Procentvis ændring: rabat, moms og stigning, og find ændringen i procent.

import { int } from '../math/fraction';
import { texNum } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const ITEMS = ['en jakke', 'et par sko', 'en cykel', 'et computerspil', 'en rygsæk', 'et par hovedtelefoner'];
const capitalize = (s: string) => s[0].toUpperCase() + s.slice(1);

function money(prompt: string, value: number, steps: string[]): GeneratedProblem {
	const answerText = `${value} kr.`;
	return {
		prompt,
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: 'Svar i kr.',
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	const item = rng.pick(ITEMS);
	const price = 20 * rng.int(5, 50);
	const percent = rng.pick([10, 20, 25, 50]);
	const discount = (price * percent) / 100;
	return money(
		`${capitalize(item)} koster ${price} kr. Prisen sættes ned med ${percent} %. Hvad er den nye pris?`,
		price - discount,
		[
			`Rabatten er ${percent} % af ${price} kr.: ${price} : 100 · ${percent} = ${discount} kr.`,
			`Ny pris: ${price} − ${discount} = ${price - discount} kr.`
		]
	);
}

function level2(rng: Rng): GeneratedProblem {
	const price = 20 * rng.int(5, 50);
	if (rng.chance(0.5)) {
		const vat = price / 4;
		return money(
			`En vare koster ${price} kr. uden moms. Der lægges 25 % moms oveni. Hvad koster varen med moms?`,
			price + vat,
			[`Momsen er 25 % af ${price} kr. = ${vat} kr.`, `Pris med moms: ${price} + ${vat} = ${price + vat} kr.`]
		);
	}
	const item = rng.pick(ITEMS);
	const percent = rng.pick([5, 10, 15, 20, 30]);
	const increase = (price * percent) / 100;
	return money(
		`Prisen på ${item} er ${price} kr. Prisen stiger med ${percent} %. Hvad er den nye pris?`,
		price + increase,
		[
			`Stigningen er ${percent} % af ${price} kr.: ${price} : 100 · ${percent} = ${increase} kr.`,
			`Ny pris: ${price} + ${increase} = ${price + increase} kr.`
		]
	);
}

function level3(rng: Rng): GeneratedProblem {
	const item = rng.pick(ITEMS);
	const before = 20 * rng.int(2, 30);
	const percent = rng.pick([5, 10, 15, 20, 25, 30, 40, 50]);
	const change = (before * percent) / 100;
	const up = rng.chance(0.5);
	const after = up ? before + change : before - change;
	const verb = up ? 'steg' : 'faldt';
	const answerText = `${percent} %`;
	return {
		prompt: `Prisen på ${item} ${verb} fra ${before} kr. til ${after} kr. Hvor mange procent ${verb} prisen?`,
		answer: { kind: 'percent', value: int(percent) },
		answerText,
		inputHint: 'Svar i procent.',
		solution: withAnswer(
			[
				`Prisen ændrede sig med ${change} kr.`,
				`Del med den gamle pris: $${change} : ${before} = ${texNum(change / before)}$`,
				`Gang med 100: ${percent} %.`
			],
			answerText
		)
	};
}

export const percentChange: SkillGenerator = {
	id: 'percent-change',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
