import { describe, expect, it } from 'vitest';
import { readConfig } from './config';

const base = {
	STUDENT_PASSWORD: 'elev',
	PARENT_PASSWORD: 'voksen',
	SESSION_SECRET: '0123456789abcdef0123456789abcdef'
};

describe('readConfig', () => {
	it('fills in defaults', () => {
		expect(readConfig(base)).toEqual({
			studentPassword: 'elev',
			parentPassword: 'voksen',
			sessionSecret: base.SESSION_SECRET,
			anthropicApiKey: null,
			tutorModel: 'claude-sonnet-5-5',
			tutorMonthlyCapUsd: 10,
			priceInputPerMTok: 2,
			priceOutputPerMTok: 10,
			databasePath: './data/dev.db',
			tutorFake: false
		});
	});

	it('reads every setting', () => {
		const config = readConfig({
			...base,
			ANTHROPIC_API_KEY: 'sk-test',
			TUTOR_MODEL: 'claude-haiku-5-5',
			TUTOR_MONTHLY_CAP_USD: '3.5',
			TUTOR_PRICE_INPUT_PER_MTOK: '0.1',
			TUTOR_PRICE_OUTPUT_PER_MTOK: '0.5',
			DATABASE_PATH: '/data/x.db',
			TUTOR_FAKE: '1'
		});
		expect(config).toMatchObject({
			anthropicApiKey: 'sk-test',
			tutorModel: 'claude-haiku-5-5',
			tutorMonthlyCapUsd: 3.5,
			priceInputPerMTok: 0.1,
			priceOutputPerMTok: 0.5,
			databasePath: '/data/x.db',
			tutorFake: true
		});
	});

	it('refuses missing or unsafe settings', () => {
		expect(() => readConfig({ ...base, STUDENT_PASSWORD: '' })).toThrow(/STUDENT_PASSWORD/);
		expect(() => readConfig({ ...base, PARENT_PASSWORD: 'elev' })).toThrow(/differ/);
		expect(() => readConfig({ ...base, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
		expect(() => readConfig({ ...base, TUTOR_MONTHLY_CAP_USD: 'ten' })).toThrow(/TUTOR_MONTHLY_CAP_USD/);
	});
});
