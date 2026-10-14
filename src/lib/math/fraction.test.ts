import { describe, expect, it } from 'vitest';
import {
	add, cmp, div, eq, frac, fracToString, fromDecimalParts, fromNumber, gcd, int,
	isInt, isTerminating, lcm, mul, neg, pow, sub, toNum
} from './fraction';

const s = fracToString;

describe('frac', () => {
	it('reduces and keeps the sign in the numerator', () => {
		expect(frac(6, 8)).toEqual({ n: 3, d: 4 });
		expect(frac(3, -6)).toEqual({ n: -1, d: 2 });
		expect(frac(-4, -8)).toEqual({ n: 1, d: 2 });
		expect(frac(0, 5)).toEqual({ n: 0, d: 1 });
		expect(Object.is(frac(0, -3).n, 0)).toBe(true);
	});

	it('rejects a zero denominator and non-integers', () => {
		expect(() => frac(1, 0)).toThrow();
		expect(() => frac(1.5, 2)).toThrow();
	});

	it('survives a JSON round trip', () => {
		expect(JSON.parse(JSON.stringify(frac(3, 4)))).toEqual(frac(3, 4));
	});
});

describe('arithmetic', () => {
	it('adds, subtracts, multiplies and divides', () => {
		expect(s(add(frac(1, 3), frac(1, 4)))).toBe('7/12');
		expect(s(sub(frac(1, 2), frac(3, 4)))).toBe('-1/4');
		expect(s(mul(frac(2, 3), frac(3, 4)))).toBe('1/2');
		expect(s(div(frac(3, 4), frac(2, 5)))).toBe('15/8');
		expect(s(neg(frac(2, 5)))).toBe('-2/5');
		expect(s(pow(frac(2, 3), 2))).toBe('4/9');
		expect(s(pow(int(5), 0))).toBe('1');
	});

	it('refuses to divide by zero', () => {
		expect(() => div(int(1), int(0))).toThrow();
	});

	it('compares', () => {
		expect(eq(frac(2, 4), frac(1, 2))).toBe(true);
		expect(cmp(frac(3, 5), frac(5, 8))).toBe(-1);
		expect(cmp(frac(5, 8), frac(3, 5))).toBe(1);
		expect(cmp(frac(1, 2), frac(2, 4))).toBe(0);
		expect(isInt(frac(6, 3))).toBe(true);
		expect(toNum(frac(1, 4))).toBe(0.25);
	});

	it('knows which fractions have a finite decimal form', () => {
		expect(isTerminating(frac(1, 8))).toBe(true);
		expect(isTerminating(frac(7, 20))).toBe(true);
		expect(isTerminating(frac(1, 3))).toBe(false);
		expect(isTerminating(frac(1, 6))).toBe(false);
	});

	it('has gcd and lcm', () => {
		expect(gcd(12, 18)).toBe(6);
		expect(gcd(-4, 6)).toBe(2);
		expect(lcm(4, 6)).toBe(12);
	});
});

describe('conversions', () => {
	it('builds fractions from decimal digits', () => {
		expect(s(fromDecimalParts('2', '5', false))).toBe('5/2');
		expect(s(fromDecimalParts('0', '125', true))).toBe('-1/8');
		expect(s(fromDecimalParts('12', '05', false))).toBe('241/20');
		expect(s(fromDecimalParts('7', '', false))).toBe('7');
	});

	it('builds fractions from JS numbers without float noise', () => {
		expect(s(fromNumber(2.5))).toBe('5/2');
		expect(s(fromNumber(0.1 + 0.2))).toBe('3/10');
		expect(s(fromNumber(-0.75))).toBe('-3/4');
	});
});
