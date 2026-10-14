import { beforeEach, describe, expect, it } from 'vitest';
import { replay } from '../adaptive/state';
import { openDb, type DB } from './db';
import { skillMap } from './progress';
import * as repo from './repo';

const NOW = new Date('2026-10-13T16:00:00Z');
let db: DB;
beforeEach(() => {
	db = openDb(':memory:');
});

describe('skillMap', () => {
	it('lists every topic and skill, untried at first', () => {
		const map = skillMap(db, NOW);
		expect(map.map((t) => t.name)).toEqual([
			'Tal og regning', 'Procent', 'Algebra og ligninger', 'Funktioner',
			'Geometri og måling', 'Statistik og sandsynlighed'
		]);
		expect(map.flatMap((t) => t.skills)).toHaveLength(24);
		expect(map[0].skills[0]).toEqual({
			id: 'order-of-operations', name: 'Regnehierarki', status: 'untried', label: 'Ikke prøvet', detail: null
		});
	});

	it('shows due reviews and, for the parent, the details', () => {
		const days = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
		repo.saveSkillState(db, replay('circle', [true, true, true].map((correct) => ({ correct, at: days(3) }))));
		const circle = skillMap(db, NOW, true)[4].skills.find((s) => s.id === 'circle');
		expect(circle).toMatchObject({ status: 'due', label: 'Skal genopfriskes' });
		expect(circle?.detail).toMatch(/^100 % · niveau 3 · 10\.? okt/);
		expect(skillMap(db, NOW)[4].skills.find((s) => s.id === 'circle')?.detail).toBeNull();
	});
});
