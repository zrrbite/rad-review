import { expect, test, type Page } from '@playwright/test';
import Database from 'better-sqlite3';

/** The answer to the problem on screen, read from the session row (the page never shows it). */
function currentAnswer(sessionId: number): string {
	const db = new Database('.e2e-data/app.db', { readonly: true });
	try {
		const row = db.prepare('SELECT current_json FROM sessions WHERE id = ?').get(sessionId) as {
			current_json: string;
		};
		return JSON.parse(row.current_json).problem.answerText;
	} finally {
		db.close();
	}
}

async function logIn(page: Page, password: string) {
	await page.goto('/login');
	await page.getByLabel('Kodeord').fill(password);
	await page.getByRole('button', { name: 'Log ind' }).click();
}

test('the student practises and asks the tutor; the parent reads the conversation', async ({ page }) => {
	await page.goto('/');
	await expect(page).toHaveURL(/\/login$/);

	await logIn(page, 'elev-test');
	await expect(page.getByRole('button', { name: 'Start kortlægning' })).toBeVisible();

	await page.getByRole('link', { name: 'Øv selv' }).click();
	await page.getByRole('button', { name: 'Regnehierarki' }).click();
	await expect(page).toHaveURL(/\/traen\/\d+$/);
	const sessionId = Number(new URL(page.url()).pathname.split('/').pop());

	// A reload shows the same problem. (innerText both times: KaTeX's hidden MathML
	// makes innerText and textContent differ.)
	const prompt = await page.locator('.prompt').innerText();
	await page.reload();
	await expect(page.locator('.prompt')).toBeVisible();
	expect(await page.locator('.prompt').innerText()).toBe(prompt);

	await page.getByLabel('Dit svar').fill(currentAnswer(sessionId));
	await page.getByRole('button', { name: 'Svar' }).click();
	await expect(page.getByText('Rigtigt!')).toBeVisible();
	await page.getByRole('button', { name: 'Næste' }).click();

	await page.getByLabel('Dit svar').fill('abc');
	await page.getByRole('button', { name: 'Svar' }).click();
	await expect(page.getByText('Det forstod jeg ikke')).toBeVisible();

	await page.getByLabel('Dit svar').fill('999999');
	await page.getByRole('button', { name: 'Svar' }).click();
	await expect(page.getByText('Ikke helt.')).toBeVisible();

	await page.getByRole('button', { name: 'Hvorfor?' }).click();
	await expect(page.getByText(/^Prøvetutor:/)).toHaveCount(1);
	await page.getByLabel('Dit spørgsmål').fill('Hvorfor gange først?');
	await page.getByRole('button', { name: 'Send' }).click();
	await expect(page.getByText('Hvorfor gange først?')).toBeVisible();
	await expect(page.getByText(/^Prøvetutor:/)).toHaveCount(2);
	await expect(page.getByText('Du kan stille 5 spørgsmål mere.')).toBeVisible();

	await page.getByRole('button', { name: 'Prøv en lignende' }).click();
	await expect(page.locator('.progress')).toContainText('Prøv en lignende');

	await page.getByRole('button', { name: 'Log ud' }).click();
	await expect(page).toHaveURL(/\/login$/);
	await logIn(page, 'voksen-test');
	await expect(page).toHaveURL(/\/foraelder$/);
	await expect(page.getByRole('heading', { name: 'Overblik' })).toBeVisible();

	await page.getByRole('link', { name: /Samtaler med tutoren/ }).click();
	await page.getByRole('link', { name: /Regnehierarki/ }).first().click();
	await expect(page.getByText('Hvorfor gange først?')).toBeVisible();
});

test('the student cannot open the parent pages', async ({ page }) => {
	await logIn(page, 'elev-test');
	await page.goto('/foraelder');
	await expect(page).not.toHaveURL(/foraelder/);
	await expect(page.getByRole('heading', { name: 'Overblik' })).toHaveCount(0);

	// Nor with a percent-encoded letter: SvelteKit routes on the decoded path.
	for (const path of ['/f%6Fraelder', '/f%6Fraelder/samtaler']) {
		const response = await page.request.get(path, { maxRedirects: 0 });
		expect(response.status(), path).toBe(303);
	}
});

test('a quick second Enter does not skip the feedback', async ({ page }) => {
	await logIn(page, 'elev-test');
	await page.getByRole('link', { name: 'Øv selv' }).click();
	await page.getByRole('button', { name: 'Regnehierarki' }).click();
	await expect(page).toHaveURL(/\/traen\/\d+$/);

	await page.getByLabel('Dit svar').fill('999999');
	await page.getByLabel('Dit svar').press('Enter');
	await expect(page.getByText('Ikke helt.')).toBeVisible();

	// A double tap: the second Enter lands just after the feedback appears.
	await page.keyboard.press('Enter');
	await page.waitForTimeout(300);
	await expect(page.getByText('Ikke helt.')).toBeVisible();

	// A deliberate Enter a moment later moves on.
	await page.waitForTimeout(400);
	await page.keyboard.press('Enter');
	await expect(page.locator('.progress')).toContainText('Prøv en lignende');
});
