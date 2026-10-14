// What the skill map and the parent pages show.

import { displayStatus, STATUS_LABELS } from '../adaptive/state';
import { SKILL_NAMES, TOPICS } from '../skills/curriculum';
import { formatDanishDay } from '../time';
import type { SkillMapTopic } from '../view-types';
import type { DB } from './db';
import * as repo from './repo';

export function skillMap(db: DB, now: Date, withDetail = false): SkillMapTopic[] {
	const states = repo.loadSkillStates(db);
	return TOPICS.map((topic) => ({
		id: topic.id,
		name: topic.name,
		skills: topic.skills.map((id) => {
			const state = states[id];
			const status = displayStatus(state, now);
			const detail =
				withDetail && state.lastAttemptAt
					? `${Math.round(state.strength * 100)} % · niveau ${state.level} · ${formatDanishDay(state.lastAttemptAt)}`
					: null;
			return { id, name: SKILL_NAMES[id], status, label: STATUS_LABELS[status], detail };
		})
	}));
}
