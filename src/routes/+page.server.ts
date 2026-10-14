import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/instance';
import { homeInfo, startSession } from '$lib/server/practice';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => homeInfo(getDb(), new Date());

export const actions: Actions = {
	start: () => {
		const db = getDb();
		const now = new Date();
		const kind = homeInfo(db, now).untriedCount > 0 ? 'placement' : 'adaptive';
		redirect(303, `/traen/${startSession(db, kind, null, now)}`);
	}
};
