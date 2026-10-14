// Hyppighed og frekvens.

import { gcd, int } from '../math/fraction';
import { fmtNum } from '../math/format';
import type { Rng } from '../rng';
import { NAMES } from './names';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const FRUITS = ['Æble', 'Banan', 'Pære', 'Appelsin', 'Vindrue', 'Kiwi'];

function level1(rng: Rng): GeneratedProblem {
	const n = rng.int(12, 20);
	const rolls = Array.from({ length: n }, () => rng.int(1, 6));
	const value = rng.pick(rolls);
	const count = rolls.filter((r) => r === value).length;
	const answerText = `${count}`;
	return {
		prompt: `${rng.pick(NAMES)} kaster en terning ${n} gange og får: ${rolls.join(', ')}. Hvad er hyppigheden af ${value}?`,
		answer: { kind: 'number', value: int(count) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(
			['Hyppigheden er det antal gange, et udfald forekommer.', `${value} forekommer ${count} gange.`],
			answerText
		)
	};
}

function level2(rng: Rng): GeneratedProblem {
	const total = rng.pick([20, 25, 50]);
	const fruits = rng.shuffle(FRUITS).slice(0, 4);
	const cuts = new Set<number>();
	while (cuts.size < 3) cuts.add(rng.int(1, total - 1));
	const points = [0, ...[...cuts].sort((a, b) => a - b), total];
	const counts = fruits.map((_, i) => points[i + 1] - points[i]);
	const i = rng.int(0, 3);
	const percent = (counts[i] * 100) / total;
	const group = total <= 25 ? 'En klasse' : 'En årgang';
	const answerText = `${percent} %`;
	return {
		prompt: `${group} har stemt om deres yndlingsfrugt. Tabellen viser hyppighederne. Hvad er frekvensen for ${fruits[i].toLowerCase()}?`,
		table: [
			['Frugt', ...fruits],
			['Hyppighed', ...counts.map(String)]
		],
		answer: { kind: 'percent', value: int(percent) },
		answerText,
		inputHint: 'Svar i procent.',
		solution: withAnswer(
			[
				'Frekvens = hyppighed : antal i alt',
				`I alt: ${counts.join(' + ')} = ${total}`,
				`${counts[i]} : ${total} = ${fmtNum(counts[i] / total)} = ${percent} %`
			],
			answerText
		)
	};
}

function level3(rng: Rng): GeneratedProblem {
	const percent = rng.pick([5, 10, 15, 20, 25, 30, 40, 50, 60, 75]);
	const step = 100 / gcd(percent, 100);
	// At least 40 in total, so at least 2 answered yes ("1 elever" isn't Danish).
	const total = step * rng.int(Math.ceil(40 / step), Math.floor(200 / step));
	const count = (total * percent) / 100;
	const perPercent = count / percent;
	const answerText = `${total}`;
	return {
		prompt: `${count} elever svarede ja i en undersøgelse. Det er en frekvens på ${percent} %. Hvor mange elever deltog i alt?`,
		answer: { kind: 'number', value: int(total) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(
			[
				`${percent} % svarer til ${count} elever.`,
				`1 % svarer til ${count} : ${percent} = ${fmtNum(perPercent)} elever.`,
				`100 % svarer til ${fmtNum(perPercent)} · 100 = ${total} elever.`
			],
			answerText
		)
	};
}

export const frequency: SkillGenerator = {
	id: 'frequency',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
