// Typetal, variationsbredde, middeltal og median.

import { frac, int, type Frac } from '../math/fraction';
import { fmtValue } from '../math/format';
import type { Rng } from '../rng';
import { NAMES } from './names';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

function context(rng: Rng, n: number): string {
	return rng.pick([
		`Et fodboldhold har scoret dette antal mål i ${n} kampe`,
		`En klasse har fået disse point i ${n} quizzer`,
		`En bus var så mange minutter forsinket på ${n} dage`,
		`${rng.pick(NAMES)} læste så mange sider på ${n} dage`
	]);
}

function problem(rng: Rng, values: number[], measure: string, value: Frac, steps: string[]): GeneratedProblem {
	const answerText = fmtValue(value);
	return {
		prompt: `${context(rng, values.length)}: ${values.join(', ')}. Hvad er ${measure}?`,
		answer: { kind: 'number', value },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(steps, answerText)
	};
}

const sorted = (values: number[]) => [...values].sort((a, b) => a - b);
const MEDIAN = 'Medianen er det midterste tal, når tallene står i rækkefølge.';
const MEAN = 'Middeltal = summen af tallene : antallet af tal';

function level1(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const n = rng.int(7, 9);
		const mode = rng.int(0, 10);
		const count = rng.int(3, 4);
		const values = Array<number>(count).fill(mode);
		const used = new Map<number, number>();
		while (values.length < n) {
			const v = rng.int(0, 10);
			if (v === mode || (used.get(v) ?? 0) >= count - 1) continue;
			used.set(v, (used.get(v) ?? 0) + 1);
			values.push(v);
		}
		return problem(rng, rng.shuffle(values), 'typetallet', int(mode), [
			'Typetallet er det tal, der forekommer flest gange.',
			`${mode} forekommer ${count} gange, flere gange end noget andet tal.`
		]);
	}
	const n = rng.int(6, 9);
	const values = Array.from({ length: n }, () => rng.int(0, 20));
	const [min, max] = [Math.min(...values), Math.max(...values)];
	return problem(rng, values, 'variationsbredden', int(max - min), [
		'Variationsbredde = største værdi − mindste værdi',
		`${max} − ${min} = ${max - min}`
	]);
}

function level2(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const n = rng.int(5, 8);
		const values = Array.from({ length: n - 1 }, () => rng.int(0, 15));
		const partial = values.reduce((a, b) => a + b, 0);
		const candidates = Array.from({ length: 16 }, (_, v) => v).filter((v) => (partial + v) % n === 0);
		values.push(rng.pick(candidates));
		const sum = partial + values[n - 1];
		return problem(rng, values, 'middeltallet', int(sum / n), [
			MEAN,
			`(${values.join(' + ')}) : ${n} = ${sum} : ${n} = ${sum / n}`
		]);
	}
	const n = rng.pick([5, 7, 9]);
	const values = Array.from({ length: n }, () => rng.int(0, 20));
	const s = sorted(values);
	const median = s[(n - 1) / 2];
	return problem(rng, values, 'medianen', int(median), [
		MEDIAN,
		`Sorteret: ${s.join(', ')}`,
		`Det midterste tal er ${median}.`
	]);
}

function level3(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const n = rng.pick([6, 8, 10]);
		const values = Array.from({ length: n }, () => rng.int(0, 20));
		const s = sorted(values);
		const [a, b] = [s[n / 2 - 1], s[n / 2]];
		const median = frac(a + b, 2);
		return problem(rng, values, 'medianen', median, [
			MEDIAN,
			`Sorteret: ${s.join(', ')}`,
			`De to midterste tal er ${a} og ${b}: (${a} + ${b}) : 2 = ${fmtValue(median)}`
		]);
	}
	const n = rng.pick([4, 5, 10]);
	const values = Array.from({ length: n }, () => rng.int(0, 20));
	const sum = values.reduce((x, y) => x + y, 0);
	const mean = frac(sum, n);
	return problem(rng, values, 'middeltallet', mean, [
		MEAN,
		`(${values.join(' + ')}) : ${n} = ${sum} : ${n} = ${fmtValue(mean)}`
	]);
}

export const descriptiveStats: SkillGenerator = {
	id: 'descriptive-stats',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
