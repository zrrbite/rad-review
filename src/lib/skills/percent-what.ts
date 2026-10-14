// Hvor mange procent er en del af det hele.

import { fromNumber } from '../math/fraction';
import { fmtNum, texNum } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const ACTIVITIES = ['går til fodbold', 'har en kat', 'cykler i skole', 'spiller et instrument'];

function problem(prompt: string, part: number, whole: number, percent: number): GeneratedProblem {
	const answerText = `${fmtNum(percent)} %`;
	return {
		prompt,
		answer: { kind: 'percent', value: fromNumber(percent) },
		answerText,
		inputHint: 'Svar i procent.',
		solution: withAnswer(
			[
				`Del delen med det hele: $${part} : ${whole} = ${texNum(part / whole)}$`,
				`Gang med 100: ${fmtNum(percent)} %.`
			],
			answerText
		)
	};
}

function phrase(rng: Rng, part: number, whole: number): string {
	if (rng.chance(0.5)) return `Hvor mange procent er ${part} ud af ${whole}?`;
	if (whole <= 30) {
		const activity = rng.pick(ACTIVITIES);
		return `I en klasse er der ${whole} elever. ${part} af dem ${activity}. Hvor mange procent ${activity}?`;
	}
	return `${whole} elever har svaret på et spørgsmål. ${part} af dem svarede ja. Hvor mange procent svarede ja?`;
}

function level1(rng: Rng): GeneratedProblem {
	const whole = rng.pick([10, 20, 25, 50, 100]);
	const part = rng.int(1, whole - 1);
	const percent = (part * 100) / whole;
	return problem(phrase(rng, part, whole), part, whole, percent);
}

function level2(rng: Rng): GeneratedProblem {
	const whole = rng.pick([40, 60, 72, 80, 120, 150, 160, 200, 250, 400]);
	const options = Array.from({ length: 19 }, (_, i) => 5 * (i + 1)).filter((p) => (whole * p) % 100 === 0);
	const percent = rng.pick(options);
	const part = (whole * percent) / 100;
	return problem(phrase(rng, part, whole), part, whole, percent);
}

function level3(rng: Rng): GeneratedProblem {
	const whole = rng.pick([80, 120, 160, 200, 240, 320, 400]);
	const options = [2.5, 7.5, 12.5, 17.5, 22.5, 37.5, 62.5, 87.5].filter((p) => (whole * p * 10) % 1000 === 0);
	const percent = rng.pick(options);
	const part = (whole * percent) / 100;
	return problem(phrase(rng, part, whole), part, whole, percent);
}

export const percentWhat: SkillGenerator = {
	id: 'percent-what',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
