import { describe, expect, it } from 'vitest';
import { registeredSkills } from './registry';
import { interleavedOrder, SKILL_IDS, SKILL_NAMES, TOPICS, topicOf } from './curriculum';

describe('curriculum', () => {
	it('has the 24 skills from spec section 3, each named once', () => {
		expect(SKILL_IDS).toHaveLength(24);
		expect(new Set(SKILL_IDS).size).toBe(24);
		for (const id of SKILL_IDS) expect(SKILL_NAMES[id]).toBeTruthy();
	});

	it('knows which topic a skill is in', () => {
		expect(topicOf('circle').name).toBe('Geometri og måling');
		expect(topicOf('percent-of').id).toBe('percent');
	});

	it('interleaves topics so neighbours differ', () => {
		const order = interleavedOrder();
		expect([...order].sort()).toEqual([...SKILL_IDS].sort());
		for (let i = 1; i < order.length; i++) {
			expect(topicOf(order[i]).id, `${order[i - 1]} → ${order[i]}`).not.toBe(topicOf(order[i - 1]).id);
		}
		expect(order.slice(0, TOPICS.length)).toEqual(TOPICS.map((t) => t.skills[0]));
	});

	it('has a generator for every skill', () => {
		expect([...registeredSkills()].sort()).toEqual([...SKILL_IDS].sort());
	});
});
