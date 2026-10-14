import { describe, expect, it } from 'vitest';
import { renderMath, renderProblem } from './render';

describe('renderMath', () => {
	it('escapes plain text', () => {
		expect(renderMath('Hvad er 25 % af 80?')).toBe('Hvad er 25 % af 80?');
		expect(renderMath('<script>alert(1)</script> & "x"')).toBe(
			'&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;x&quot;'
		);
	});

	it('renders $…$ with KaTeX and keeps the text around it', () => {
		const html = renderMath('Udregn $\\frac{1}{3} + \\frac{1}{4}$. Forkort.');
		expect(html.startsWith('Udregn <span class="katex"')).toBe(true);
		expect(html.endsWith('. Forkort.')).toBe(true);
	});

	it('leaves a lone dollar sign as text', () => {
		expect(renderMath('Det koster 5 $')).toBe('Det koster 5 $');
	});
});

describe('renderProblem', () => {
	it('renders prompt, table and hint', () => {
		const r = renderProblem({
			number: 2,
			total: 10,
			isRetry: false,
			skillName: 'Hældning og skæring',
			prompt: 'Linjen $y = ax + b$.',
			table: [['x', '0', '1'], ['y', '−2', '1']],
			inputHint: 'Skriv et tal.'
		});
		expect(r).toMatchObject({ number: 2, total: 10, isRetry: false, skillName: 'Hældning og skæring', hintHtml: 'Skriv et tal.' });
		expect(r.promptHtml).toContain('katex');
		expect(r.tableHtml).toEqual([['x', '0', '1'], ['y', '−2', '1']]);
	});
});
