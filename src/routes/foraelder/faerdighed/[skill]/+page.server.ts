import { error } from '@sveltejs/kit';
import { getDb } from '$lib/server/instance';
import { skillHistory } from '$lib/server/progress';
import { SKILL_IDS, SKILL_NAMES, type SkillId } from '$lib/skills/curriculum';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = ({ params }) => {
	if (!(SKILL_IDS as readonly string[]).includes(params.skill)) error(404, 'Færdigheden findes ikke.');
	const skill = params.skill as SkillId;
	return { name: SKILL_NAMES[skill], history: skillHistory(getDb(), skill) };
};
