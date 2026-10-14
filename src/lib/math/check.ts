// Decides whether an answer is right, wrong, or doesn't count yet
// (unreadable or ambiguous input), for each answer kind in spec section 4.

import { eq, toNum, type Frac } from './fraction';
import { parseAnswer, type Parsed } from './parse';

export type Answer =
	| { kind: 'number'; value: Frac }
	| { kind: 'decimal'; value: Frac }
	| { kind: 'fraction-reduced'; value: Frac }
	| { kind: 'percent'; value: Frac }
	| { kind: 'rounded'; exact: number; decimals: number }
	| { kind: 'expression'; variable: string; coeff: Frac; constant: Frac }
	| { kind: 'solution'; variable: string; value: Frac };

export type CheckOutcome =
	| { result: 'right' }
	| { result: 'wrong' }
	| { result: 'unreadable'; message: string }
	| { result: 'ambiguous'; message: string };

export const UNREADABLE_MESSAGE = 'Det forstod jeg ikke – skriv fx 3/4 eller 2,5.';

type Readable = Exclude<Parsed, { kind: 'unreadable' } | { kind: 'ambiguous' }>;

function isRight(answer: Answer, p: Readable): boolean {
	switch (answer.kind) {
		case 'number':
			return p.kind === 'number' && eq(p.value, answer.value);
		case 'decimal':
			return (
				p.kind === 'number' &&
				!p.percent &&
				(p.form === 'integer' || p.form === 'decimal') &&
				eq(p.value, answer.value)
			);
		case 'fraction-reduced':
			return (
				p.kind === 'number' &&
				!p.percent &&
				p.form !== 'decimal' &&
				p.reduced &&
				eq(p.value, answer.value)
			);
		case 'percent':
			return p.kind === 'number' && p.variable === null && eq(p.value, answer.value);
		case 'rounded': {
			if (p.kind !== 'number' || p.percent) return false;
			const tolerance = Math.max(10 ** -answer.decimals, Math.abs(answer.exact) * 0.005);
			return Math.abs(toNum(p.value) - answer.exact) <= tolerance + 1e-9;
		}
		case 'expression':
			if (p.kind === 'expression') {
				return (
					p.reduced &&
					p.variable === answer.variable &&
					eq(p.coeff, answer.coeff) &&
					eq(p.constant, answer.constant)
				);
			}
			return answer.coeff.n === 0 && !p.percent && eq(p.value, answer.constant);
		case 'solution':
			return (
				p.kind === 'number' &&
				!p.percent &&
				(p.variable === null || p.variable === answer.variable) &&
				eq(p.value, answer.value)
			);
	}
}

export function checkAnswer(answer: Answer, input: string): CheckOutcome {
	const parsed = parseAnswer(input);
	if (parsed.kind === 'unreadable') return { result: 'unreadable', message: UNREADABLE_MESSAGE };
	if (parsed.kind === 'ambiguous') {
		const [a, b] = parsed.readings;
		return { result: 'ambiguous', message: `Mener du ${a} eller ${b}? Brug komma til decimaler.` };
	}
	return isRight(answer, parsed) ? { result: 'right' } : { result: 'wrong' };
}
