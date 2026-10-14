import { describe, expect, it } from 'vitest';
import { fracToString } from './fraction';
import { parseAnswer } from './parse';

function value(input: string): string {
	const p = parseAnswer(input);
	if (p.kind !== 'number') throw new Error(`${input} parsed as ${p.kind}`);
	return fracToString(p.value);
}

describe('numbers', () => {
	it.each([
		['12', '12'],
		['-3', '-3'],
		['−3', '-3'],
		['- 3', '-3'],
		['+4', '4'],
		['2,5', '5/2'],
		['2.5', '5/2'],
		['2,500', '5/2'],
		['0.125', '1/8'],
		['12.50', '25/2'],
		['3/4', '3/4'],
		[' 3 / 4 ', '3/4'],
		['-3/4', '-3/4'],
		['6/8', '3/4'],
		['1 2/3', '5/3'],
		['−2 1/2', '-5/2'],
		['25 %', '25'],
		['25%', '25'],
		['25 procent', '25'],
		['48 cm²', '48'],
		['48cm2', '48'],
		['12kr', '12'],
		['300 kr.', '300'],
		['3,5 m', '7/2'],
		['2 L', '2'],
		['90°', '90'],
		['20 000', '20000'],
		['1.000.000', '1000000'],
		['1:50', '50'],
		['1 : 200', '200'],
		['x = 5', '5'],
		['X = -2', '-2'],
		['x=5cm', '5']
	])('%j reads as %s', (input, expected) => {
		expect(value(input)).toBe(expected);
	});

	it('records how the number was written', () => {
		expect(parseAnswer('6/8')).toMatchObject({ form: 'fraction', reduced: false });
		expect(parseAnswer('3/4')).toMatchObject({ form: 'fraction', reduced: true });
		expect(parseAnswer('3/1')).toMatchObject({ form: 'fraction', reduced: false });
		expect(parseAnswer('1 2/3')).toMatchObject({ form: 'mixed', reduced: true });
		expect(parseAnswer('1 4/6')).toMatchObject({ form: 'mixed', reduced: false });
		expect(parseAnswer('1 5/3')).toMatchObject({ form: 'mixed', reduced: false });
		expect(parseAnswer('0,25')).toMatchObject({ form: 'decimal', percent: false });
		expect(parseAnswer('7')).toMatchObject({ form: 'integer', reduced: true });
		expect(parseAnswer('25 %')).toMatchObject({ percent: true });
		expect(parseAnswer('x = 5')).toMatchObject({ variable: 'x' });
		expect(parseAnswer('5')).toMatchObject({ variable: null });
	});
});

describe('ambiguous periods', () => {
	it.each([
		['2.500', ['2,5', '2500']],
		['20.000', ['20', '20000']],
		['-1.250', ['-1,25', '-1250']]
	])('%j asks which one was meant', (input, readings) => {
		expect(parseAnswer(input)).toEqual({ kind: 'ambiguous', readings });
	});
});

describe('expressions', () => {
	function expr(input: string) {
		const p = parseAnswer(input);
		if (p.kind !== 'expression') throw new Error(`${input} parsed as ${p.kind}`);
		return { v: p.variable, c: fracToString(p.coeff), k: fracToString(p.constant), reduced: p.reduced };
	}

	it.each([
		['5x + 3', { v: 'x', c: '5', k: '3', reduced: true }],
		['3 + 5x', { v: 'x', c: '5', k: '3', reduced: true }],
		['5 x+3', { v: 'x', c: '5', k: '3', reduced: true }],
		['5x − 3', { v: 'x', c: '5', k: '-3', reduced: true }],
		['-x', { v: 'x', c: '-1', k: '0', reduced: true }],
		['x', { v: 'x', c: '1', k: '0', reduced: true }],
		['2*x+1', { v: 'x', c: '2', k: '1', reduced: true }],
		['1/2x', { v: 'x', c: '1/2', k: '0', reduced: true }],
		['2,5a', { v: 'a', c: '5/2', k: '0', reduced: true }],
		['2x + 3x', { v: 'x', c: '5', k: '0', reduced: false }],
		['4x + 3 - 1', { v: 'x', c: '4', k: '2', reduced: false }],
		['0x + 3', { v: 'x', c: '0', k: '3', reduced: false }]
	])('%j', (input, expected) => {
		expect(expr(input)).toEqual(expected);
	});
});

describe('unreadable', () => {
	it.each([
		'',
		'   ',
		'abc',
		'3/0',
		'1 2/0',
		',5',
		'5x = 3',
		'x = y',
		'3(x + 2)',
		'2x + 3y',
		'x2',
		'25 % x',
		'procent',
		'1234567890123456'
	])('%j', (input) => {
		expect(parseAnswer(input)).toEqual({ kind: 'unreadable' });
	});
});
