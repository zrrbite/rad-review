// Simpel sandsynlighed: gunstige udfald : mulige udfald.

import { frac, gcd } from '../math/fraction';
import { fmtFrac, texFrac } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const HINT = 'Skriv sandsynligheden som en brøk, fx 1/6.';

const DIE_EVENTS = [
	{ text: 'en sekser', count: 1 },
	{ text: 'et lige tal', count: 3 },
	{ text: 'et ulige tal', count: 3 },
	{ text: 'et tal større end 4', count: 2 },
	{ text: 'et tal mindre end 3', count: 2 },
	{ text: 'mindst 3', count: 4 },
	{ text: 'en etter eller en sekser', count: 2 }
];

function problem(prompt: string, favourable: number, total: number, steps: string[]): GeneratedProblem {
	const value = frac(favourable, total);
	const answerText = fmtFrac(value);
	const reduced = gcd(favourable, total) > 1 ? ` = ${texFrac(value)}` : '';
	return {
		prompt,
		answer: { kind: 'number', value },
		answerText,
		inputHint: HINT,
		solution: withAnswer([...steps, `Sandsynligheden er $\\frac{${favourable}}{${total}}${reduced}$`], answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	if (rng.chance(0.15)) {
		return problem('Du slår plat og krone med en mønt. Hvad er sandsynligheden for at få krone?', 1, 2, [
			'Der er 2 mulige udfald, og 1 af dem er krone.'
		]);
	}
	const event = rng.pick(DIE_EVENTS);
	return problem(
		`Du kaster en almindelig terning. Hvad er sandsynligheden for at få ${event.text}?`,
		event.count,
		6,
		[`Der er 6 mulige udfald, og ${event.count} af dem er gunstige.`]
	);
}

function level2(rng: Rng): GeneratedProblem {
	// At least 2 of each colour that's there: "1 grønne kugler" isn't Danish.
	const green = rng.int(0, 6);
	const colours = [
		{ word: 'rød', plural: 'røde', count: rng.int(2, 8) },
		{ word: 'blå', plural: 'blå', count: rng.int(2, 8) },
		{ word: 'grøn', plural: 'grønne', count: green === 1 ? 2 : green }
	].filter((c) => c.count > 0);
	const total = colours.reduce((sum, c) => sum + c.count, 0);
	const target = rng.pick(colours);
	const parts = colours.map((c) => `${c.count} ${c.plural}`);
	const list = `${parts.slice(0, -1).join(', ')} og ${parts.at(-1)}`;
	return problem(
		`I en pose er der ${list} kugler. Du trækker en kugle uden at kigge. Hvad er sandsynligheden for, at den er ${target.word}?`,
		target.count,
		total,
		[`Der er ${total} kugler i alt, og ${target.count} af dem er ${target.plural}.`]
	);
}

function level3(rng: Rng): GeneratedProblem {
	const sum = rng.int(2, 12);
	const pairs: [number, number][] = [];
	for (let a = 1; a <= 6; a++) if (sum - a >= 1 && sum - a <= 6) pairs.push([a, sum - a]);
	const ways = pairs.length;
	return problem(
		`Du kaster to terninger og lægger øjnene sammen. Hvad er sandsynligheden for at få ${sum}?`,
		ways,
		36,
		[
			'Der er 6 · 6 = 36 mulige udfald.',
			`Summen ${sum} kan fås på ${ways} ${ways === 1 ? 'måde' : 'måder'}: ${pairs.map(([a, b]) => `${a} og ${b}`).join(', ')}.`
		]
	);
}

export const probability: SkillGenerator = {
	id: 'probability',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
