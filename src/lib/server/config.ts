// Settings come from the environment: `fly secrets` in production, a .env
// file locally (see .env.example).

import { existsSync } from 'node:fs';

export interface Config {
	studentPassword: string;
	parentPassword: string;
	sessionSecret: string;
	anthropicApiKey: string | null;
	tutorModel: string;
	tutorMonthlyCapUsd: number;
	priceInputPerMTok: number;
	priceOutputPerMTok: number;
	databasePath: string;
	tutorFake: boolean;
}

type Env = Record<string, string | undefined>;

export function readConfig(env: Env): Config {
	const required = (name: string): string => {
		const value = env[name];
		if (!value) throw new Error(`Missing environment variable ${name}`);
		return value;
	};
	const number = (name: string, fallback: number): number => {
		const raw = env[name];
		if (raw === undefined || raw === '') return fallback;
		const value = Number(raw);
		if (!Number.isFinite(value)) throw new Error(`${name} must be a number, got "${raw}"`);
		return value;
	};

	const studentPassword = required('STUDENT_PASSWORD');
	const parentPassword = required('PARENT_PASSWORD');
	if (studentPassword === parentPassword) {
		throw new Error('STUDENT_PASSWORD and PARENT_PASSWORD must differ');
	}
	const sessionSecret = required('SESSION_SECRET');
	if (sessionSecret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');

	return {
		studentPassword,
		parentPassword,
		sessionSecret,
		anthropicApiKey: env.ANTHROPIC_API_KEY || null,
		tutorModel: env.TUTOR_MODEL || 'claude-sonnet-5-5',
		tutorMonthlyCapUsd: number('TUTOR_MONTHLY_CAP_USD', 10),
		priceInputPerMTok: number('TUTOR_PRICE_INPUT_PER_MTOK', 2),
		priceOutputPerMTok: number('TUTOR_PRICE_OUTPUT_PER_MTOK', 10),
		databasePath: env.DATABASE_PATH || './data/dev.db',
		tutorFake: env.TUTOR_FAKE === '1'
	};
}

/** Loads a .env file into process.env without overriding what is already set. */
export function loadDotEnv(file = '.env'): void {
	if (existsSync(file)) process.loadEnvFile(file);
}

let cached: Config | null = null;

export function getConfig(): Config {
	if (!cached) {
		loadDotEnv();
		cached = readConfig(process.env);
	}
	return cached;
}
