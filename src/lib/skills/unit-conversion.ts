// Enhedsomregning: længde, areal og rumfang.

import { frac, int, mul } from '../math/fraction';
import { fmtValue } from '../math/format';
import type { Rng } from '../rng';
import { byLevel, withAnswer, type GeneratedProblem, type SkillGenerator } from './types';

interface Conversion {
	from: string;
	to: string;
	factor: number;
	/** true: multiply by factor (to a smaller unit); false: divide. */
	multiply: boolean;
}

const LENGTH: Conversion[] = [
	{ from: 'm', to: 'cm', factor: 100, multiply: true },
	{ from: 'cm', to: 'm', factor: 100, multiply: false },
	{ from: 'cm', to: 'mm', factor: 10, multiply: true },
	{ from: 'mm', to: 'cm', factor: 10, multiply: false },
	{ from: 'km', to: 'm', factor: 1000, multiply: true },
	{ from: 'm', to: 'km', factor: 1000, multiply: false }
];

const AREA: Conversion[] = [
	{ from: 'm²', to: 'cm²', factor: 10000, multiply: true },
	{ from: 'cm²', to: 'm²', factor: 10000, multiply: false },
	{ from: 'm²', to: 'dm²', factor: 100, multiply: true },
	{ from: 'dm²', to: 'cm²', factor: 100, multiply: true },
	{ from: 'cm²', to: 'dm²', factor: 100, multiply: false }
];

const VOLUME: Conversion[] = [
	{ from: 'liter', to: 'cm³', factor: 1000, multiply: true },
	{ from: 'cm³', to: 'liter', factor: 1000, multiply: false },
	{ from: 'm³', to: 'liter', factor: 1000, multiply: true },
	{ from: 'liter', to: 'm³', factor: 1000, multiply: false },
	{ from: 'dm³', to: 'cm³', factor: 1000, multiply: true }
];

function convert(rng: Rng, c: Conversion): GeneratedProblem {
	const k = rng.int(1, 99);
	// Multiplying: 0,1 to 9,9 of the big unit. Dividing: a whole number that gives 0,1 to 9,9.
	const value = c.multiply ? frac(k, 10) : int((k * c.factor) / 10);
	const result = c.multiply ? mul(value, int(c.factor)) : frac(k, 10);
	const answerText = `${fmtValue(result)} ${c.to}`;
	const steps = c.multiply
		? [`1 ${c.from} = ${c.factor} ${c.to}`, `${fmtValue(value)} · ${c.factor} = ${fmtValue(result)} ${c.to}`]
		: [`1 ${c.to} = ${c.factor} ${c.from}`, `${fmtValue(value)} : ${c.factor} = ${fmtValue(result)} ${c.to}`];
	return {
		prompt: `Hvor mange ${c.to} er ${fmtValue(value)} ${c.from}?`,
		answer: { kind: 'number', value: result },
		answerText,
		inputHint: `Svar i ${c.to}.`,
		solution: withAnswer(steps, answerText)
	};
}

export const unitConversion: SkillGenerator = {
	id: 'unit-conversion',
	generate: (level, rng) =>
		byLevel(level, rng, [
			(r) => convert(r, r.pick(LENGTH)),
			(r) => convert(r, r.pick(AREA)),
			(r) => convert(r, r.pick(VOLUME))
		])
};
