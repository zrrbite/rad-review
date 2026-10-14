// Forkort og forlæng brøker, og sammenlign to brøker via fællesnævner.

import { frac, int, lcm } from '../math/fraction';
import { fmtFrac, texFrac } from '../math/format';
import type { Rng } from '../rng';
import { COPRIME_PROPER } from './steps';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const FRACTION_HINT = 'Skriv svaret som en brøk, fx 3/4.';

function level1(rng: Rng): GeneratedProblem {
	const [p, q] = rng.pick(COPRIME_PROPER.filter(([, d]) => d <= 9));
	const k = rng.int(2, 6);
	const value = frac(p, q);
	const answerText = fmtFrac(value);
	return {
		prompt: `Forkort $\\frac{${p * k}}{${q * k}}$ mest muligt.`,
		answer: { kind: 'fraction-reduced', value },
		answerText,
		inputHint: FRACTION_HINT,
		solution: withAnswer(
			[
				`Det største tal, der går op i både ${p * k} og ${q * k}, er ${k}.`,
				`Del tæller og nævner med ${k}: $\\frac{${p * k} : ${k}}{${q * k} : ${k}} = ${texFrac(value)}$`
			],
			answerText
		)
	};
}

function level2(rng: Rng): GeneratedProblem {
	const [p, q] = rng.pick(COPRIME_PROPER.filter(([, d]) => d <= 10));
	const k = rng.int(2, 9);
	const answerText = `${p * k}`;
	return {
		prompt: `Forlæng brøken, så nævneren bliver ${q * k}: $\\frac{${p}}{${q}} = \\frac{?}{${q * k}}$. Hvilket tal skal stå i stedet for spørgsmålstegnet?`,
		answer: { kind: 'number', value: int(p * k) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(
			[
				`${q * k} : ${q} = ${k}, så der forlænges med ${k}.`,
				`Tælleren bliver $${p} \\cdot ${k} = ${p * k}$`
			],
			answerText
		)
	};
}

function level3(rng: Rng): GeneratedProblem {
	for (let attempt = 0; attempt < 1000; attempt++) {
		const [a, b] = rng.pick(COPRIME_PROPER);
		const [c, d] = rng.pick(COPRIME_PROPER);
		const diff = Math.abs(a / b - c / d);
		if (b === d || diff === 0 || diff > 0.15) continue;
		const common = lcm(b, d);
		const [first, second] = [(a * common) / b, (c * common) / d];
		const bigger = first > second ? frac(a, b) : frac(c, d);
		const answerText = fmtFrac(bigger);
		return {
			prompt: `Hvilken brøk er størst: $\\frac{${a}}{${b}}$ eller $\\frac{${c}}{${d}}$? Skriv den største brøk.`,
			answer: { kind: 'number', value: bigger },
			answerText,
			inputHint: FRACTION_HINT,
			solution: withAnswer(
				[
					`Find en fællesnævner: ${common}.`,
					`$\\frac{${a}}{${b}} = \\frac{${first}}{${common}}$ og $\\frac{${c}}{${d}} = \\frac{${second}}{${common}}$`,
					`${Math.max(first, second)} er større end ${Math.min(first, second)}, så $${texFrac(bigger)}$ er størst.`
				],
				answerText
			)
		};
	}
	throw new Error('fraction-simplify level 3: no pair found');
}

export const fractionSimplify: SkillGenerator = {
	id: 'fraction-simplify',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
