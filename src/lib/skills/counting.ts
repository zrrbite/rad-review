// Tælleprincippet: gang antallet af muligheder for hvert valg.

import { int } from '../math/fraction';
import type { Rng } from '../rng';
import { NAMES } from './names';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

const PRINCIPLE = 'Tælleprincippet: gang antallet af muligheder for hvert valg.';

function problem(prompt: string, value: number, steps: string[]): GeneratedProblem {
	const answerText = `${value}`;
	return {
		prompt,
		answer: { kind: 'number', value: int(value) },
		answerText,
		inputHint: 'Skriv et tal.',
		solution: withAnswer(steps, answerText)
	};
}

function level1(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const name = rng.pick(NAMES);
		const [a, b] = [rng.int(2, 6), rng.int(2, 6)];
		return problem(
			`${name} har ${a} bluser og ${b} par bukser. Hvor mange forskellige sæt tøj med én bluse og ét par bukser kan ${name} lave?`,
			a * b,
			[PRINCIPLE, `${a} · ${b} = ${a * b}`]
		);
	}
	const [a, b] = [rng.int(3, 8), rng.int(2, 5)];
	return problem(
		`En isbod har ${a} slags is og ${b} slags drys. Hvor mange forskellige kombinationer af én is og ét drys kan man vælge?`,
		a * b,
		[PRINCIPLE, `${a} · ${b} = ${a * b}`]
	);
}

function level2(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const [a, b, c] = [rng.int(2, 5), rng.int(2, 5), rng.int(2, 5)];
		return problem(
			`En restaurant har ${a} forretter, ${b} hovedretter og ${c} desserter. Hvor mange forskellige menuer med én af hver kan man vælge?`,
			a * b * c,
			[PRINCIPLE, `${a} · ${b} · ${c} = ${a * b * c}`]
		);
	}
	const letters = ['A', 'B', 'C', 'D', 'E'].slice(0, rng.int(2, 5));
	const n = letters.length;
	return problem(
		`En kode består af et bogstav (${letters.join(', ')}) efterfulgt af to cifre fra 0 til 9. Hvor mange forskellige koder kan man lave?`,
		n * 100,
		[PRINCIPLE, `${n} · 10 · 10 = ${n * 100}`]
	);
}

function level3(rng: Rng): GeneratedProblem {
	if (rng.chance(0.5)) {
		const n = rng.int(3, 6);
		const factors = Array.from({ length: n }, (_, i) => n - i);
		const value = factors.reduce((a, b) => a * b, 1);
		return problem(`På hvor mange måder kan ${n} forskellige bøger stilles på en hylde?`, value, [
			`Der er ${n} muligheder for den første plads, ${n - 1} for den næste, og så videre.`,
			`${factors.join(' · ')} = ${value}`
		]);
	}
	const m = rng.int(4, 10);
	return problem(`${m} løbere deltager i et løb. På hvor mange måder kan 1.- og 2.-pladsen fordeles?`, m * (m - 1), [
		`Der er ${m} muligheder for 1.-pladsen og ${m - 1} for 2.-pladsen.`,
		`${m} · ${m - 1} = ${m * (m - 1)}`
	]);
}

export const counting: SkillGenerator = {
	id: 'counting',
	generate: (level, rng) => byLevel(level, rng, [level1, level2, level3])
};
