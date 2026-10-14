// Danish formatting: decimal comma, "−" for minus, and no thousands
// separators, so generated text never contains "2.500" for her to misread.

import { frac, isTerminating, type Frac } from './fraction';

const MINUS = '−';

/** A JS number rounded to at most `maxDecimals` decimals: "2,5", "−3". */
export function fmtNum(x: number, maxDecimals = 6): string {
	const rounded = Number(x.toFixed(maxDecimals));
	const text = String(Math.abs(rounded)).replace('.', ',');
	return rounded < 0 ? MINUS + text : text;
}

/** The exact decimal for a fraction that has one: 1/8 → "0,125". */
export function fmtDecimal(f: Frac): string {
	if (!isTerminating(f)) throw new Error(`${f.n}/${f.d} has no finite decimal form`);
	let k = 0;
	while ((10 ** k) % f.d !== 0) k++;
	const digits = String(Math.abs(f.n) * (10 ** k / f.d)).padStart(k + 1, '0');
	const whole = digits.slice(0, digits.length - k);
	const decimals = digits.slice(digits.length - k).replace(/0+$/, '');
	return (f.n < 0 ? MINUS : '') + whole + (decimals ? ',' + decimals : '');
}

export function fmtFrac(f: Frac): string {
	const body = f.d === 1 ? `${Math.abs(f.n)}` : `${Math.abs(f.n)}/${f.d}`;
	return f.n < 0 ? MINUS + body : body;
}

export function fmtMixed(f: Frac): string {
	const sign = f.n < 0 ? MINUS : '';
	const whole = Math.trunc(Math.abs(f.n) / f.d);
	const rest = Math.abs(f.n) % f.d;
	if (rest === 0) return `${sign}${whole}`;
	if (whole === 0) return `${sign}${rest}/${f.d}`;
	return `${sign}${whole} ${rest}/${f.d}`;
}

/** An integer, else the exact decimal, else a fraction. */
export function fmtValue(f: Frac): string {
	if (f.d === 1) return fmtFrac(f);
	return isTerminating(f) ? fmtDecimal(f) : fmtFrac(f);
}

function linear(
	coeff: Frac,
	constant: Frac,
	variable: string,
	num: (f: Frac) => string,
	minus: string
): string {
	const parts: string[] = [];
	if (coeff.n !== 0) {
		const abs = frac(Math.abs(coeff.n), coeff.d);
		const shown = abs.n === 1 && abs.d === 1 ? '' : num(abs);
		parts.push(`${coeff.n < 0 ? minus : ''}${shown}${variable}`);
	}
	if (constant.n !== 0 || parts.length === 0) {
		const abs = num(frac(Math.abs(constant.n), constant.d));
		if (parts.length === 0) parts.push(`${constant.n < 0 ? minus : ''}${abs}`);
		else parts.push(`${constant.n < 0 ? minus : '+'} ${abs}`);
	}
	return parts.join(' ');
}

/** "5x + 3", "−x − 2", "4", "1/3x". */
export function fmtLinear(coeff: Frac, constant: Frac, variable = 'x'): string {
	return linear(coeff, constant, variable, fmtValue, MINUS);
}

/** For inside $…$. KaTeX adds space after a bare comma, so it is wrapped. */
export function texNum(x: number): string {
	return fmtNum(x).replace(MINUS, '-').replace(',', '{,}');
}

export function texFrac(f: Frac): string {
	const body = f.d === 1 ? `${Math.abs(f.n)}` : `\\frac{${Math.abs(f.n)}}{${f.d}}`;
	return f.n < 0 ? `-${body}` : body;
}

export function texMixed(f: Frac): string {
	const sign = f.n < 0 ? '-' : '';
	const whole = Math.trunc(Math.abs(f.n) / f.d);
	const rest = Math.abs(f.n) % f.d;
	if (rest === 0) return `${sign}${whole}`;
	if (whole === 0) return texFrac(f);
	return `${sign}${whole}\\frac{${rest}}{${f.d}}`;
}

export function texLinear(coeff: Frac, constant: Frac, variable = 'x'): string {
	return linear(coeff, constant, variable, texFrac, '-');
}
