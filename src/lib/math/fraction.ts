// Exact rational numbers as plain data, so they survive JSON round trips:
// problems and their answers are stored as JSON in the database.

export interface Frac {
	readonly n: number;
	readonly d: number;
}

export function gcd(a: number, b: number): number {
	a = Math.abs(a);
	b = Math.abs(b);
	while (b) [a, b] = [b, a % b];
	return a;
}

export function lcm(a: number, b: number): number {
	return Math.abs(a * b) / gcd(a, b);
}

/** Always reduced, denominator positive, and never -0. */
export function frac(n: number, d = 1): Frac {
	if (!Number.isSafeInteger(n) || !Number.isSafeInteger(d)) {
		throw new Error(`not integers: ${n}/${d}`);
	}
	if (d === 0) throw new Error('denominator is zero');
	const g = gcd(n, d) || 1;
	const sign = d < 0 ? -1 : 1;
	return { n: (sign * n) / g + 0, d: (sign * d) / g };
}

export const int = (n: number): Frac => frac(n, 1);

export const add = (a: Frac, b: Frac): Frac => frac(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Frac, b: Frac): Frac => frac(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Frac, b: Frac): Frac => frac(a.n * b.n, a.d * b.d);
export const neg = (a: Frac): Frac => frac(-a.n, a.d);

export function div(a: Frac, b: Frac): Frac {
	if (b.n === 0) throw new Error('division by zero');
	return frac(a.n * b.d, a.d * b.n);
}

export function pow(a: Frac, e: number): Frac {
	let result = int(1);
	for (let i = 0; i < e; i++) result = mul(result, a);
	return result;
}

export const eq = (a: Frac, b: Frac): boolean => a.n === b.n && a.d === b.d;
export const cmp = (a: Frac, b: Frac): -1 | 0 | 1 =>
	Math.sign(a.n * b.d - b.n * a.d) as -1 | 0 | 1;
export const isInt = (a: Frac): boolean => a.d === 1;
export const toNum = (a: Frac): number => a.n / a.d;

/** True when the value has a finite decimal form (the denominator has only 2s and 5s). */
export function isTerminating(a: Frac): boolean {
	let d = a.d;
	while (d % 2 === 0) d /= 2;
	while (d % 5 === 0) d /= 5;
	return d === 1;
}

/** "12,05" split into "12" and "05". */
export function fromDecimalParts(intDigits: string, fracDigits: string, negative: boolean): Frac {
	const d = 10 ** fracDigits.length;
	const n = Number(intDigits || '0') * d + Number(fracDigits || '0');
	return frac(negative ? -n : n, d);
}

/** From a JS number that has at most `decimals` decimals, e.g. 2.5 or 0.1 + 0.2. */
export function fromNumber(x: number, decimals = 6): Frac {
	const d = 10 ** decimals;
	return frac(Math.round(x * d), d);
}

export function fracToString(a: Frac): string {
	return a.d === 1 ? `${a.n}` : `${a.n}/${a.d}`;
}
