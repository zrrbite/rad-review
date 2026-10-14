import { getConfig } from '$lib/server/config';
import { getDb } from '$lib/server/instance';
import { overview, skillMap } from '$lib/server/progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	const db = getDb();
	const now = new Date();
	return { overview: overview(db, now, getConfig()), topics: skillMap(db, now, true) };
};
