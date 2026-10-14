import type { Handle } from '@sveltejs/kit';
import { readSessionToken, requiredRole, SESSION_COOKIE } from '$lib/server/auth';
import { getConfig } from '$lib/server/config';

function decode(path: string): string {
	try {
		return decodeURIComponent(path);
	} catch {
		return path;
	}
}

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// /forælder is what people type; the route is /foraelder.
	const typed = decode(path);
	if (typed === '/forælder' || typed.startsWith('/forælder/')) {
		const location = '/foraelder' + typed.slice('/forælder'.length);
		return new Response(null, { status: 308, headers: { location } });
	}

	const role = readSessionToken(event.cookies.get(SESSION_COOKIE), Date.now(), getConfig().sessionSecret);
	event.locals.role = role;

	// Guard the route SvelteKit will serve, not the raw path: it routes on the decoded
	// path, so /f%6Fraelder is /foraelder. No route matched means a 404 anyway.
	const routed = event.route.id ?? path;
	const needed = requiredRole(routed);
	if (needed && role !== needed) {
		if (routed.startsWith('/api/')) return new Response('Ikke logget ind', { status: 401 });
		return new Response(null, { status: 303, headers: { location: '/login' } });
	}
	return resolve(event);
};
