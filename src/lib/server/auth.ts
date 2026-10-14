// Two passwords, one signed cookie (spec section 8). No accounts.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export type Role = 'student' | 'parent';

export const SESSION_COOKIE = 'session';
export const COOKIE_MAX_AGE: Record<Role, number> = {
	student: 365 * 24 * 60 * 60,
	parent: 90 * 24 * 60 * 60
};

const digest = (s: string) => createHash('sha256').update(s).digest();
const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

export function roleForPassword(
	password: string,
	cfg: { studentPassword: string; parentPassword: string }
): Role | null {
	// Compare against both, so the answer takes the same time either way.
	const student = same(password, cfg.studentPassword);
	const parent = same(password, cfg.parentPassword);
	if (student) return 'student';
	if (parent) return 'parent';
	return null;
}

const sign = (payload: string, secret: string) =>
	createHmac('sha256', secret).update(payload).digest('base64url');

export function createSessionToken(role: Role, nowMs: number, secret: string): string {
	const payload = `${role}.${nowMs + COOKIE_MAX_AGE[role] * 1000}`;
	return `${payload}.${sign(payload, secret)}`;
}

export function readSessionToken(token: string | undefined, nowMs: number, secret: string): Role | null {
	if (!token) return null;
	const parts = token.split('.');
	if (parts.length !== 3) return null;
	const [role, expires, mac] = parts;
	if (role !== 'student' && role !== 'parent') return null;
	const expected = Buffer.from(sign(`${role}.${expires}`, secret));
	const given = Buffer.from(mac);
	if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
	if (!(Number(expires) > nowMs)) return null;
	return role;
}

/** In memory, which is enough for a single machine. */
export class LoginLimiter {
	private readonly failures = new Map<string, number[]>();
	private readonly max: number;
	private readonly windowMs: number;

	constructor(max = 5, windowMs = 15 * 60_000) {
		this.max = max;
		this.windowMs = windowMs;
	}

	private recent(ip: string, nowMs: number): number[] {
		const list = (this.failures.get(ip) ?? []).filter((t) => nowMs - t < this.windowMs);
		this.failures.set(ip, list);
		return list;
	}

	isBlocked(ip: string, nowMs: number): boolean {
		return this.recent(ip, nowMs).length >= this.max;
	}

	recordFailure(ip: string, nowMs: number): void {
		this.recent(ip, nowMs).push(nowMs);
	}

	reset(ip: string): void {
		this.failures.delete(ip);
	}
}

/** Which role a path needs; null for pages anyone may open. */
export function requiredRole(pathname: string): Role | null {
	if (pathname === '/login' || pathname === '/logout' || pathname === '/health') return null;
	if (pathname === '/foraelder' || pathname.startsWith('/foraelder/')) return 'parent';
	return 'student';
}
