import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

describe('createRng', () => {
	it('repeats the same sequence for the same seed', () => {
		const a = createRng(42);
		const b = createRng(42);
		const xs = Array.from({ length: 5 }, () => a.next());
		const ys = Array.from({ length: 5 }, () => b.next());
		expect(xs).toEqual(ys);
	});

	it('gives different sequences for different seeds', () => {
		expect(createRng(1).next()).not.toEqual(createRng(2).next());
	});

	it('next() stays in [0, 1)', () => {
		const r = createRng(3);
		for (let i = 0; i < 1000; i++) {
			const v = r.next();
			expect(v).toBeGreaterThanOrEqual(0);
			expect(v).toBeLessThan(1);
		}
	});

	it('int() stays within inclusive bounds and reaches both ends', () => {
		const r = createRng(7);
		const seen = new Set<number>();
		for (let i = 0; i < 2000; i++) {
			const v = r.int(-2, 2);
			expect(v).toBeGreaterThanOrEqual(-2);
			expect(v).toBeLessThanOrEqual(2);
			seen.add(v);
		}
		expect(seen.size).toBe(5);
	});

	it('int() rejects an empty or non-integer range', () => {
		expect(() => createRng(1).int(3, 2)).toThrow();
		expect(() => createRng(1).int(0.5, 2)).toThrow();
	});

	it('pick() returns an element and rejects an empty list', () => {
		const r = createRng(9);
		expect(['a', 'b', 'c']).toContain(r.pick(['a', 'b', 'c']));
		expect(() => r.pick([])).toThrow();
	});

	it('shuffle() keeps every element and leaves the input alone', () => {
		const input = [1, 2, 3, 4, 5];
		const out = createRng(11).shuffle(input);
		expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
		expect(input).toEqual([1, 2, 3, 4, 5]);
	});

	it('chance(0) is never true and chance(1) always is', () => {
		const r = createRng(5);
		for (let i = 0; i < 100; i++) {
			expect(r.chance(0)).toBe(false);
			expect(r.chance(1)).toBe(true);
		}
	});
});
