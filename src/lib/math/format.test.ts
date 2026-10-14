import { describe, expect, it } from 'vitest';
import { frac, int } from './fraction';
import {
	fmtDecimal, fmtFrac, fmtLinear, fmtMixed, fmtNum, fmtValue,
	texFrac, texLinear, texMixed, texNum
} from './format';

describe('plain text', () => {
	it('formats JS numbers with a decimal comma and a real minus sign', () => {
		expect(fmtNum(2.5)).toBe('2,5');
		expect(fmtNum(-3)).toBe('−3');
		expect(fmtNum(0.1 + 0.2)).toBe('0,3');
		expect(fmtNum(20000)).toBe('20000');
		expect(fmtNum(78.53981, 1)).toBe('78,5');
		expect(fmtNum(-0)).toBe('0');
	});

	it('writes exact decimals', () => {
		expect(fmtDecimal(frac(1, 8))).toBe('0,125');
		expect(fmtDecimal(frac(-5, 2))).toBe('−2,5');
		expect(fmtDecimal(frac(7, 20))).toBe('0,35');
		expect(fmtDecimal(int(12))).toBe('12');
		expect(() => fmtDecimal(frac(1, 3))).toThrow();
	});

	it('writes fractions and mixed numbers', () => {
		expect(fmtFrac(frac(-3, 4))).toBe('−3/4');
		expect(fmtFrac(int(5))).toBe('5');
		expect(fmtMixed(frac(5, 3))).toBe('1 2/3');
		expect(fmtMixed(frac(-5, 2))).toBe('−2 1/2');
		expect(fmtMixed(frac(2, 3))).toBe('2/3');
		expect(fmtMixed(int(4))).toBe('4');
	});

	it('picks integer, then decimal, then fraction', () => {
		expect(fmtValue(int(7))).toBe('7');
		expect(fmtValue(frac(3, 4))).toBe('0,75');
		expect(fmtValue(frac(1, 3))).toBe('1/3');
	});

	it('writes linear expressions', () => {
		expect(fmtLinear(int(5), int(3))).toBe('5x + 3');
		expect(fmtLinear(int(1), int(0))).toBe('x');
		expect(fmtLinear(int(-1), int(-2))).toBe('−x − 2');
		expect(fmtLinear(int(0), int(4))).toBe('4');
		expect(fmtLinear(int(0), int(0))).toBe('0');
		expect(fmtLinear(int(4), int(-6), 'a')).toBe('4a − 6');
	});
});

describe('TeX', () => {
	it('protects the decimal comma from KaTeX spacing', () => {
		expect(texNum(2.5)).toBe('2{,}5');
		expect(texNum(-3)).toBe('-3');
	});

	it('writes fractions', () => {
		expect(texFrac(frac(3, 4))).toBe('\\frac{3}{4}');
		expect(texFrac(frac(-3, 4))).toBe('-\\frac{3}{4}');
		expect(texFrac(int(5))).toBe('5');
		expect(texMixed(frac(5, 2))).toBe('2\\frac{1}{2}');
		expect(texMixed(frac(1, 2))).toBe('\\frac{1}{2}');
	});

	it('writes linear expressions with an ASCII minus', () => {
		expect(texLinear(int(5), int(-3))).toBe('5x - 3');
		expect(texLinear(int(-1), int(2))).toBe('-x + 2');
	});
});
