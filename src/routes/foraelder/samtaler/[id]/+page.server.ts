import { error } from '@sveltejs/kit';
import { renderMath } from '$lib/render';
import { getDb } from '$lib/server/instance';
import { getAttempt, getConversation, listMessages } from '$lib/server/repo';
import { SKILL_NAMES } from '$lib/skills/curriculum';
import { formatDanishDateTime } from '$lib/time';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	const db = getDb();
	const conversation = getConversation(db, Number(params.id));
	const attempt = conversation && getAttempt(db, conversation.attemptId);
	if (!conversation || !attempt) error(404, 'Samtalen findes ikke.');
	return {
		skill: SKILL_NAMES[attempt.skillId],
		when: formatDanishDateTime(conversation.createdAt),
		promptHtml: renderMath(attempt.problem.prompt),
		given: attempt.givenAnswer,
		answerText: attempt.problem.answerText,
		flagReason: conversation.flagged ? conversation.flagReason : null,
		messages: listMessages(db, conversation.id).map((m) => ({ id: m.id, role: m.role, text: m.content }))
	};
};
