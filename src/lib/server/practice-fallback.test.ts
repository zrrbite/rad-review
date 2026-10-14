import { describe, expect, it, vi } from 'vitest';
import { openDb } from './db';
import { startSession, viewSession } from './practice';
import * as repo from './repo';

// Regnehierarki's generator is broken in this file only.
vi.mock('../skills/registry', async (importOriginal) => {
	const actual = await importOriginal<typeof import('../skills/registry')>();
	return {
		...actual,
		generateProblem: (...args: Parameters<typeof actual.generateProblem>) => {
			if (args[0] === 'order-of-operations') throw new Error('broken generator');
			return actual.generateProblem(...args);
		}
	};
});

const NOW = new Date('2026-10-13T16:00:00Z');

describe('a generator that throws', () => {
	it('is logged and replaced by another skill', () => {
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
		const db = openDb(':memory:');
		let seed = 0;
		for (const kind of ['practice', 'adaptive'] as const) {
			const id = startSession(db, kind, kind === 'practice' ? 'order-of-operations' : null, NOW);
			expect(viewSession(db, id, NOW, () => ++seed)?.state).toBe('question');
			expect(repo.getSession(db, id)?.current?.problem.skillId).not.toBe('order-of-operations');
		}
		expect(logged).toHaveBeenCalled();
		logged.mockRestore();
	});
});
