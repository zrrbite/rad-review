// Reads what she typed, the Danish way: decimal comma, mixed numbers, percent,
// trailing units, "x = 5", "1:50", and linear expressions like "5x + 3".
// Input it can't read, or that could mean two things, never counts as wrong.

import { add, frac, fromDecimalParts, gcd, int, neg, type Frac } from './fraction';

export type NumberForm = 'integer' | 'decimal' | 'fraction' | 'mixed';

export type Parsed =
	| {
			kind: 'number';
			value: Frac;
			form: NumberForm;
			reduced: boolean;
			percent: boolean;
			variable: string | null;
	  }
	| { kind: 'expression'; variable: string; coeff: Frac; constant: Frac; reduced: boolean }
	| { kind: 'unreadable' }
	| { kind: 'ambiguous'; readings: [string, string] };

const UNREADABLE: Parsed = { kind: 'unreadable' };

// Longest first within each prefix, so "cm²" wins over "cm" and "m".
const UNITS = [
	'cm²', 'cm2', 'cm^2', 'dm²', 'dm2', 'm²', 'm2', 'm^2',
	'cm³', 'cm3', 'dm³', 'dm3', 'm³', 'm3',
	'mm', 'cm', 'dm', 'km', 'm', 'liter', 'l', 'kr.', 'kr', 'grader', '°'
];
const escapeRe = (s: string) => s.replace(/[.^]/g, '\\$&');
const UNIT_RE = new RegExp(`^(.*\\d)\\s*(?:${UNITS.map(escapeRe).join('|')})$`);

function normalize(raw: string): string {
	return raw
		.trim()
		.toLowerCase()
		.replace(/[−–—]/g, '-')
		.replace(/\s+/g, ' ')
		.replace(/^- /, '-')
		.replace(/^\+ ?/, '');
}

function numberResult(value: Frac, form: NumberForm, reduced: boolean): Parsed {
	return { kind: 'number', value, form, reduced, percent: false, variable: null };
}

function parseNumber(s: string): Parsed | null {
	let m: RegExpMatchArray | null;

	if ((m = s.match(/^(-?)(\d+) (\d+) ?\/ ?(\d+)$/))) {
		const [whole, n, d] = [Number(m[2]), Number(m[3]), Number(m[4])];
		if (d === 0) return UNREADABLE;
		const value = add(int(whole), frac(n, d));
		const reduced = n > 0 && n < d && gcd(n, d) === 1;
		return numberResult(m[1] ? neg(value) : value, 'mixed', reduced);
	}
	if ((m = s.match(/^(-?) ?(\d+) ?\/ ?(\d+)$/))) {
		const [n, d] = [Number(m[2]), Number(m[3])];
		if (d === 0) return UNREADABLE;
		return numberResult(frac(m[1] ? -n : n, d), 'fraction', gcd(n, d) === 1 && d !== 1);
	}
	if ((m = s.match(/^(-?)(\d{1,3}(?: \d{3})+)$/))) {
		return numberResult(int(Number(m[1] + m[2].replace(/ /g, ''))), 'integer', true);
	}
	if ((m = s.match(/^(-?)(\d{1,3}(?:\.\d{3}){2,})$/))) {
		return numberResult(int(Number(m[1] + m[2].replace(/\./g, ''))), 'integer', true);
	}
	if ((m = s.match(/^(-?)([1-9]\d{0,2})\.(\d{3})$/))) {
		const [sign, whole, digits] = [m[1], m[2], m[3]];
		const decimals = digits.replace(/0+$/, '');
		return {
			kind: 'ambiguous',
			readings: [`${sign}${whole}${decimals ? ',' + decimals : ''}`, `${sign}${whole}${digits}`]
		};
	}
	if ((m = s.match(/^(-?)(\d+)[.,](\d+)$/))) {
		return numberResult(fromDecimalParts(m[2], m[3], m[1] === '-'), 'decimal', true);
	}
	if ((m = s.match(/^(-?)(\d+)$/))) {
		return numberResult(int(Number(m[1] + m[2])), 'integer', true);
	}
	return null;
}

function parseCoefficient(text: string): Frac | null {
	let m: RegExpMatchArray | null;
	if ((m = text.match(/^(\d+)\/(\d+)$/))) {
		return Number(m[2]) === 0 ? null : frac(Number(m[1]), Number(m[2]));
	}
	if ((m = text.match(/^(\d+)[.,](\d+)$/))) return fromDecimalParts(m[1], m[2], false);
	if (/^\d+$/.test(text)) return int(Number(text));
	return null;
}

function parseExpression(s: string): Parsed | null {
	const t = s.replace(/[ *]/g, '');
	if (!/[a-z]/.test(t) || /[^0-9a-z+\-.,/]/.test(t)) return null;
	const terms = t.match(/[+-]?[^+-]+/g);
	if (!terms || terms.join('') !== t) return null;

	let variable: string | null = null;
	let coeff = int(0);
	let constant = int(0);
	let variableTerms = 0;
	let constantTerms = 0;
	let zeroTerm = false;

	for (const term of terms) {
		const m = term.match(/^([+-]?)([0-9.,/]*)([a-z]?)$/);
		if (!m || (m[2] === '' && m[3] === '')) return null;
		let c = m[2] === '' ? int(1) : parseCoefficient(m[2]);
		if (!c) return null;
		if (m[1] === '-') c = neg(c);
		if (c.n === 0) zeroTerm = true;
		if (m[3]) {
			if (variable && variable !== m[3]) return null;
			variable = m[3];
			coeff = add(coeff, c);
			variableTerms++;
		} else {
			constant = add(constant, c);
			constantTerms++;
		}
	}
	if (!variable) return null;
	const reduced = variableTerms <= 1 && constantTerms <= 1 && !zeroTerm;
	return { kind: 'expression', variable, coeff, constant, reduced };
}

export function parseAnswer(raw: string): Parsed {
	let s = normalize(raw);
	if (s === '' || (s.match(/\d/g) ?? []).length > 15) return UNREADABLE;

	const unit = s.match(UNIT_RE);
	if (unit) s = unit[1].trim();

	let percent = false;
	const pct = s.match(/^(.*?) ?(?:%|procent)$/);
	if (pct) {
		percent = true;
		s = pct[1];
	}

	let m: RegExpMatchArray | null;
	if ((m = s.match(/^1 ?: ?(\d+)$/))) {
		return percent ? UNREADABLE : numberResult(int(Number(m[1])), 'integer', true);
	}
	if ((m = s.match(/^([a-z]) ?= ?(.+)$/))) {
		const rhs = parseNumber(m[2]);
		if (!rhs || percent) return UNREADABLE;
		return rhs.kind === 'number' ? { ...rhs, variable: m[1] } : rhs;
	}

	const number = parseNumber(s);
	if (number) return number.kind === 'number' ? { ...number, percent } : number;
	if (percent) return UNREADABLE;
	return parseExpression(s) ?? UNREADABLE;
}
