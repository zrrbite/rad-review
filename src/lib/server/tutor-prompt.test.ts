import { describe, expect, it } from 'vitest';
import { generateProblem } from '../skills/registry';
import { buildContextMessage, costUsd, texToPlain, usageFrom } from './tutor-prompt';

describe('texToPlain', () => {
	it('turns the TeX in problems into plain text Claude can read', () => {
		expect(texToPlain('Udregn $\\frac{1}{3} + \\frac{1}{4}$.')).toBe('Udregn 1/3 + 1/4.');
		expect(texToPlain('$2\\frac{1}{2} - 1\\frac{2}{3}$')).toBe('2 1/2 - 1 2/3');
		expect(texToPlain('$2{,}5 \\cdot 4^{2}$')).toBe('2,5 · 4^2');
		expect(texToPlain('$A = \\frac{h \\cdot (a + b)}{2}$')).toBe('A = (h · (a + b))/2');
		expect(texToPlain('$\\frac{y_2 - y_1}{x_2 - x_1}$')).toBe('(y2 - y1)/(x2 - x1)');
	});
});

describe('buildContextMessage', () => {
	it('gives the problem, the right answer, the solution and her answers', () => {
		const problem = generateProblem('fraction-add-sub', 2, 4);
		const earlier = generateProblem('fraction-add-sub', 2, 5);
		const text = buildContextMessage({
			problem,
			givenAnswer: '2/7',
			earlier: [{ problem: earlier, givenAnswer: '3/9' }]
		});
		expect(text).toContain('Færdighed: Plus og minus med brøker (niveau 2 af 3)');
		expect(text).toContain(`Rigtigt svar: ${problem.answerText}`);
		expect(text).toContain(`${problem.solution.length}. Svar: ${problem.answerText}`);
		expect(text).toContain('Elevens svar: 2/7');
		expect(text).toContain('Elevens svar: 3/9');
		expect(text).not.toContain('$');
		expect(text).not.toContain('\\frac');
	});

	it('includes a table when the problem has one', () => {
		const problem = generateProblem('slope-intercept', 1, 1);
		expect(buildContextMessage({ problem, givenAnswer: '3', earlier: [] })).toContain('Tabel: x | 0 | 1 | 2 | 3');
	});
});

describe('cost', () => {
	it('prices input, output and cache tokens', () => {
		const usage = usageFrom({
			input_tokens: 1_000_000,
			output_tokens: 100_000,
			cache_creation_input_tokens: 1_000_000,
			cache_read_input_tokens: 1_000_000
		} as Parameters<typeof usageFrom>[0]);
		expect(usage).toEqual({
			inputTokens: 1_000_000,
			outputTokens: 100_000,
			cacheWriteTokens: 1_000_000,
			cacheReadTokens: 1_000_000
		});
		// 2 + 1 (output) + 2.5 (write, 1.25×) + 0.2 (read, 0.1×)
		expect(costUsd(usage, { inputPerMTok: 2, outputPerMTok: 10 })).toBeCloseTo(5.7, 10);
	});
});
