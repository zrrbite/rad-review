import { fail, redirect } from '@sveltejs/kit';
import {
	COOKIE_MAX_AGE, createSessionToken, LoginLimiter, roleForPassword, SESSION_COOKIE
} from '$lib/server/auth';
import { getConfig } from '$lib/server/config';
import type { Actions, PageServerLoad } from './$types';

const limiter = new LoginLimiter();

export const load: PageServerLoad = ({ locals }) => {
	if (locals.role === 'student') redirect(303, '/');
	if (locals.role === 'parent') redirect(303, '/foraelder');
};

export const actions: Actions = {
	default: async ({ request, cookies, getClientAddress }) => {
		const ip = getClientAddress();
		const now = Date.now();
		if (limiter.isBlocked(ip, now)) {
			return fail(429, { message: 'For mange forsøg. Vent et kvarter, og prøv igen.' });
		}
		const password = String((await request.formData()).get('password') ?? '');
		const config = getConfig();
		const role = roleForPassword(password, config);
		if (!role) {
			limiter.recordFailure(ip, now);
			return fail(400, { message: 'Forkert kodeord.' });
		}
		limiter.reset(ip);
		cookies.set(SESSION_COOKIE, createSessionToken(role, now, config.sessionSecret), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: COOKIE_MAX_AGE[role]
		});
		redirect(303, role === 'parent' ? '/foraelder' : '/');
	}
};
