import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

export default defineConfig({
	testDir: 'e2e',
	timeout: 30_000,
	workers: 1,
	use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'rm -rf .e2e-data && npm run build && node build',
		url: `http://localhost:${PORT}/health`,
		reuseExistingServer: false,
		timeout: 180_000,
		env: {
			PORT: String(PORT),
			ORIGIN: `http://localhost:${PORT}`,
			DATABASE_PATH: '.e2e-data/app.db',
			STUDENT_PASSWORD: 'elev-test',
			PARENT_PASSWORD: 'voksen-test',
			SESSION_SECRET: 'e2e-secret-0123456789abcdef0123456789',
			TUTOR_FAKE: '1'
		}
	}
});
