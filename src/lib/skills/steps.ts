// Small pieces of solution text that several generators share.

import { frac, gcd } from '../math/fraction';
import { texFrac } from '../math/format';

/** One "Forkort" step, or nothing if n/d is already in lowest terms. */
export function reduceSteps(n: number, d: number): string[] {
	const g = gcd(n, d);
	if (g <= 1) return [];
	return [`Forkort med ${g}: $\\frac{${n}}{${d}} = ${texFrac(frac(n, d))}$`];
}

/** A number for TeX, in parentheses when negative: 3 → "3", −3 → "(-3)". */
export function paren(n: number): string {
	return n < 0 ? `(${n})` : `${n}`;
}

/** A trailing term for TeX: 5 → "+ 5", −5 → "- 5". */
export function signedTerm(n: number): string {
	return n < 0 ? `- ${-n}` : `+ ${n}`;
}

/** Proper fractions p/q in lowest terms with q from 2 to 12. */
export const COPRIME_PROPER: readonly [number, number][] = (() => {
	const pairs: [number, number][] = [];
	for (let q = 2; q <= 12; q++) {
		for (let p = 1; p < q; p++) if (gcd(p, q) === 1) pairs.push([p, q]);
	}
	return pairs;
})();
