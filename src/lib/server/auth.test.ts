import { describe, expect, it } from 'vitest';
import {
	COOKIE_MAX_AGE, createSessionToken, LoginLimiter, readSessionToken, requiredRole, roleForPassword
} from './auth';

const SECRET = '0123456789abcdef0123456789abcdef';
const NOW = Date.parse('2026-10-13T16:00:00Z');
const cfg = { studentPassword: 'elev-kode', parentPassword: 'voksen-kode' };

describe('roleForPassword', () => {
	it('knows both passwords and nothing else', () => {
		expect(roleForPassword('elev-kode', cfg)).toBe('student');
		expect(roleForPassword('voksen-kode', cfg)).toBe('parent');
		expect(roleForPassword('elev-kod', cfg)).toBeNull();
		expect(roleForPassword('', cfg)).toBeNull();
	});
});

describe('session tokens', () => {
	it('round-trips a role until it expires', () => {
		const token = createSessionToken('student', NOW, SECRET);
		expect(readSessionToken(token, NOW + 1000, SECRET)).toBe('student');
		expect(readSessionToken(token, NOW + COOKIE_MAX_AGE.student * 1000 + 1, SECRET)).toBeNull();
		const parent = createSessionToken('parent', NOW, SECRET);
		expect(readSessionToken(parent, NOW + 89 * 86_400_000, SECRET)).toBe('parent');
		expect(readSessionToken(parent, NOW + 91 * 86_400_000, SECRET)).toBeNull();
	});

	it('rejects tampering, other secrets and junk', () => {
		const token = createSessionToken('student', NOW, SECRET);
		const [, expires, mac] = token.split('.');
		expect(readSessionToken(`parent.${expires}.${mac}`, NOW, SECRET)).toBeNull();
		expect(readSessionToken(token, NOW, 'another-secret-that-is-long-enough!!')).toBeNull();
		expect(readSessionToken(undefined, NOW, SECRET)).toBeNull();
		expect(readSessionToken('nonsense', NOW, SECRET)).toBeNull();
		expect(readSessionToken('student.abc.def', NOW, SECRET)).toBeNull();
	});
});

describe('LoginLimiter', () => {
	it('blocks an address after 5 failures for 15 minutes', () => {
		const limiter = new LoginLimiter();
		for (let i = 0; i < 5; i++) {
			expect(limiter.isBlocked('1.2.3.4', NOW)).toBe(false);
			limiter.recordFailure('1.2.3.4', NOW + i);
		}
		expect(limiter.isBlocked('1.2.3.4', NOW + 10)).toBe(true);
		expect(limiter.isBlocked('5.6.7.8', NOW + 10)).toBe(false);
		expect(limiter.isBlocked('1.2.3.4', NOW + 15 * 60_000 + 10)).toBe(false);
	});

	it('forgets failures after a successful login', () => {
		const limiter = new LoginLimiter();
		for (let i = 0; i < 4; i++) limiter.recordFailure('1.2.3.4', NOW);
		limiter.reset('1.2.3.4');
		limiter.recordFailure('1.2.3.4', NOW);
		expect(limiter.isBlocked('1.2.3.4', NOW)).toBe(false);
	});
});

describe('requiredRole', () => {
	it('protects every page except login, logout and health', () => {
		expect(requiredRole('/login')).toBeNull();
		expect(requiredRole('/logout')).toBeNull();
		expect(requiredRole('/health')).toBeNull();
		expect(requiredRole('/')).toBe('student');
		expect(requiredRole('/traen/3')).toBe('student');
		expect(requiredRole('/api/tutor')).toBe('student');
		expect(requiredRole('/foraelder')).toBe('parent');
		expect(requiredRole('/foraelder/samtaler/2')).toBe('parent');
		expect(requiredRole('/foraelderX')).toBe('student');
	});
});
