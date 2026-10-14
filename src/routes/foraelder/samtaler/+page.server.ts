import { getDb } from '$lib/server/instance';
import { listConversations } from '$lib/server/repo';
import { SKILL_NAMES } from '$lib/skills/curriculum';
import { formatDanishDateTime } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	conversations: listConversations(getDb()).map((c) => ({
		id: c.id,
		when: formatDanishDateTime(c.createdAt),
		skill: SKILL_NAMES[c.skillId],
		flagged: c.flagged,
		flagReason: c.flagReason,
		preview: (c.firstReply ?? '').slice(0, 140)
	}))
});
