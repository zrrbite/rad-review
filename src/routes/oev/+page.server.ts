import { error, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/instance';
import { startSession } from '$lib/server/practice';
import { skillMap } from '$lib/server/progress';
import { SKILL_IDS, type SkillId } from '$lib/skills/curriculum';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ topics: skillMap(getDb(), new Date()) });

export const actions: Actions = {
	start: async ({ request }) => {
		const skill = String((await request.formData()).get('skill') ?? '');
		if (!(SKILL_IDS as readonly string[]).includes(skill)) error(400, 'Ukendt færdighed.');
		const id = startSession(getDb(), 'practice', skill as SkillId, new Date());
		redirect(303, `/traen/${id}`);
	}
};
