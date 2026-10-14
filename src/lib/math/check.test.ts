import { describe, expect, it } from 'vitest';
import { checkAnswer, UNREADABLE_MESSAGE, type Answer } from './check';
import { frac, int } from './fraction';

const right = (a: Answer, input: string) => expect(checkAnswer(a, input).result, input).toBe('right');
const wrong = (a: Answer, input: string) => expect(checkAnswer(a, input).result, input).toBe('wrong');

describe('number', () => {
	const half: Answer = { kind: 'number', value: frac(1, 2) };
	it('accepts any equal value', () => ['1/2', '2/4', '0,5', '0.5', ' 1 / 2 '].forEach((i) => right(half, i)));
	it('rejects other values and expressions', () => ['1/3', '5', 'x + 1'].forEach((i) => wrong(half, i)));
	it('ignores units, a percent sign and "x ="', () => {
		right({ kind: 'number', value: int(42) }, '42 m²');
		right({ kind: 'number', value: int(20) }, '20 %');
		right({ kind: 'number', value: int(50) }, '1:50');
		right({ kind: 'number', value: int(4) }, 'x = 4');
	});
});

describe('decimal', () => {
	const a: Answer = { kind: 'decimal', value: frac(1, 4) };
	it('wants a decimal number', () => {
		right(a, '0,25');
		right(a, '0.25');
		wrong(a, '1/4');
		wrong(a, '25 %');
		right({ kind: 'decimal', value: int(3) }, '3');
	});
});

describe('fraction-reduced', () => {
	it('wants lowest terms', () => {
		const half: Answer = { kind: 'fraction-reduced', value: frac(1, 2) };
		right(half, '1/2');
		wrong(half, '2/4');
		wrong(half, '0,5');
		const sevenSixths: Answer = { kind: 'fraction-reduced', value: frac(7, 6) };
		right(sevenSixths, '7/6');
		right(sevenSixths, '1 1/6');
		wrong(sevenSixths, '1 2/12');
		const two: Answer = { kind: 'fraction-reduced', value: int(2) };
		right(two, '2');
		wrong(two, '6/3');
	});
});

describe('percent', () => {
	const a: Answer = { kind: 'percent', value: int(25) };
	it('takes the percent number with or without a sign', () => {
		['25', '25 %', '25%', '25 procent'].forEach((i) => right(a, i));
		['0,25', '1/4'].forEach((i) => wrong(a, i));
		right({ kind: 'percent', value: frac(25, 2) }, '12,5 %');
	});
});

describe('rounded', () => {
	const area: Answer = { kind: 'rounded', exact: 25 * Math.PI, decimals: 1 };
	it('allows rounding and π ≈ 3,14', () => {
		['78,5', '78.5', '78,54', '78,6', '78,2'].forEach((i) => right(area, i));
		['78', '80', '7,85'].forEach((i) => wrong(area, i));
	});
});

describe('expression', () => {
	const a: Answer = { kind: 'expression', variable: 'x', coeff: int(5), constant: int(3) };
	it('compares coefficients in reduced form', () => {
		['5x + 3', '3 + 5x', '5x+3', '5 x + 3'].forEach((i) => right(a, i));
		['5x + 2', '2x + 3x + 3', '8x', '5a + 3', '8'].forEach((i) => wrong(a, i));
	});
	it('accepts a plain number when the x terms cancel', () => {
		right({ kind: 'expression', variable: 'x', coeff: int(0), constant: int(6) }, '6');
	});
});

describe('solution', () => {
	const a: Answer = { kind: 'solution', variable: 'x', value: int(5) };
	it('takes 5 or x = 5', () => {
		['5', 'x = 5', 'X=5'].forEach((i) => right(a, i));
		['y = 5', '6'].forEach((i) => wrong(a, i));
	});
});

describe("input that doesn't count", () => {
	const a: Answer = { kind: 'number', value: int(3) };
	it('explains unreadable input', () => {
		expect(checkAnswer(a, 'abc')).toEqual({ result: 'unreadable', message: UNREADABLE_MESSAGE });
		expect(checkAnswer(a, '')).toEqual({ result: 'unreadable', message: UNREADABLE_MESSAGE });
	});
	it('asks about 2.500', () => {
		expect(checkAnswer(a, '2.500')).toEqual({
			result: 'ambiguous',
			message: 'Mener du 2,5 eller 2500? Brug komma til decimaler.'
		});
	});
});
