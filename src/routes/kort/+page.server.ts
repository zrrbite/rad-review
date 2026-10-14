import { getDb } from '$lib/server/instance';
import { skillMap } from '$lib/server/progress';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({ topics: skillMap(getDb(), new Date()) });
