// Seeded pseudo-random numbers (mulberry32). Every problem and every pick is
// made from a stored seed, so it can be reproduced exactly later.

export interface Rng {
	/** A float in [0, 1). */
	next(): number;
	/** An integer in [min, max], both ends included. */
	int(min: number, max: number): number;
	pick<T>(items: readonly T[]): T;
	shuffle<T>(items: readonly T[]): T[];
	chance(p: number): boolean;
}

export function createRng(seed: number): Rng {
	let state = seed >>> 0;

	function next(): number {
		state = (state + 0x6d2b79f5) >>> 0;
		let t = state;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	}

	function int(min: number, max: number): number {
		if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
			throw new Error(`bad range ${min}..${max}`);
		}
		return min + Math.floor(next() * (max - min + 1));
	}

	return {
		next,
		int,
		pick<T>(items: readonly T[]): T {
			if (items.length === 0) throw new Error('pick() from an empty list');
			return items[int(0, items.length - 1)];
		},
		shuffle<T>(items: readonly T[]): T[] {
			const out = [...items];
			for (let i = out.length - 1; i > 0; i--) {
				const j = int(0, i);
				[out[i], out[j]] = [out[j], out[i]];
			}
			return out;
		},
		chance(p: number): boolean {
			return next() < p;
		}
	};
}

/** A fresh unsigned 32-bit seed. Only code outside the pure libraries calls this. */
export function randomSeed(): number {
	return crypto.getRandomValues(new Uint32Array(1))[0];
}
