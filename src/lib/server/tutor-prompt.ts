// What Claude is told, and what it costs (spec section 6).

import type Anthropic from '@anthropic-ai/sdk';
import { SKILL_NAMES } from '../skills/curriculum';
import type { Problem } from '../skills/types';

export const MAX_STUDENT_MESSAGES = 6;
export const MAX_MESSAGE_CHARS = 500;
/** Thinking counts toward this, so it is higher than the ~100 words a reply should be. */
export const MAX_REPLY_TOKENS = 1024;

export const SYSTEM_PROMPT = `You are the math tutor inside a practice app used by a 13-year-old student in 7th grade at a Danish public school (folkeskole). The student has just answered a problem wrong, and you help them understand why.

How you write:
- Always write in Danish, warmly and plainly, the way a good teacher talks to a 13-year-old. Address the student as "du".
- Keep each reply short: about 100 words, never more than 150.
- Write math as plain text, for example 3/4, 2,5 and 4 · 5, with the Danish decimal comma. Don't use LaTeX, Markdown, headings, lists or bold text.

How you teach:
- The first message describes the problem, the correct answer, a worked solution, and the student's answer. The correct answer and the worked solution are correct. Never contradict them, and don't recompute them a different way.
- In your first reply, start from the most likely misunderstanding behind the student's answer (for example adding both numerators and denominators, a sign error, or taking the percent of the wrong number). Then show the right method using this problem's numbers. If earlier wrong answers on the same skill show the same pattern, say so kindly.
- Answer follow-up questions about this problem and this topic.
- Explain methods. If the student asks for the answer to a different problem, such as homework, don't give the answer; show how to get started instead.

Boundaries:
- Talk only about math, mostly about this topic. If the student brings up something else, steer back kindly in one sentence.
- Never ask for personal information such as name, school, address or age. Don't include links.
- If the student writes something that suggests distress, being hurt or unsafe, or harming themselves or someone else (for example "jeg er så dum, jeg hader mig selv"), respond kindly, say it can help to talk to a parent or another adult they trust, and call the flag_for_parent tool with a short reason in English. You can still help with the math if they want.`;

export const FLAG_TOOL: Anthropic.Tool = {
	name: 'flag_for_parent',
	description:
		"Marks this conversation so the student's parent sees it first. Call it when the student writes something that suggests distress, being hurt or unsafe, or harming themselves or others. Do not call it for ordinary frustration with math, such as 'det her er svært'.",
	input_schema: {
		type: 'object',
		properties: {
			reason: { type: 'string', description: 'One short sentence in English on why.' }
		},
		required: ['reason'],
		additionalProperties: false
	},
	strict: true
};

/** The TeX in problems and solutions as plain text: \frac{1}{3} → 1/3. */
export function texToPlain(text: string): string {
	const simple = /^[\w,.]+$/;
	return text
		.replace(/\$/g, '')
		.replace(/(\d)\\frac/g, '$1 \\frac')
		.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, (_, top: string, bottom: string) => {
			const wrap = (s: string) => (simple.test(s.replace(/\{,\}/g, ',')) ? s : `(${s})`);
			return `${wrap(top)}/${wrap(bottom)}`;
		})
		.replace(/\\cdot/g, '·')
		.replace(/\{,\}/g, ',')
		.replace(/\^\{(\w+)\}/g, '^$1')
		.replace(/_\{?(\w)\}?/g, '$1')
		.replace(/\\%/g, '%')
		.replace(/[ \t]+/g, ' ')
		.trim();
}

export interface TutorContext {
	problem: Problem;
	givenAnswer: string;
	earlier: { problem: Problem; givenAnswer: string }[];
}

/** The first message of a conversation. Claude sees it; the student doesn't. */
export function buildContextMessage(ctx: TutorContext): string {
	const p = ctx.problem;
	const lines = [
		`Færdighed: ${SKILL_NAMES[p.skillId]} (niveau ${p.level} af 3)`,
		`Opgave: ${texToPlain(p.prompt)}`
	];
	if (p.table) lines.push(`Tabel: ${p.table.map((row) => row.join(' | ')).join(' / ')}`);
	lines.push(
		`Rigtigt svar: ${p.answerText}`,
		'Løsning trin for trin:',
		...p.solution.map((step, i) => `${i + 1}. ${texToPlain(step)}`),
		`Elevens svar: ${ctx.givenAnswer}`
	);
	if (ctx.earlier.length > 0) {
		lines.push('', 'Tidligere forkerte svar i samme færdighed:');
		for (const e of ctx.earlier) {
			lines.push(`- ${texToPlain(e.problem.prompt)} Elevens svar: ${e.givenAnswer}. Rigtigt svar: ${e.problem.answerText}.`);
		}
	}
	lines.push('', 'Forklar eleven, hvad der sandsynligvis gik galt, og hvordan man løser opgaven.');
	return lines.join('\n');
}

export interface Usage {
	inputTokens: number;
	outputTokens: number;
	cacheWriteTokens: number;
	cacheReadTokens: number;
}

export const ZERO_USAGE: Usage = { inputTokens: 0, outputTokens: 0, cacheWriteTokens: 0, cacheReadTokens: 0 };

export function usageFrom(u: Anthropic.Usage): Usage {
	return {
		inputTokens: u.input_tokens,
		outputTokens: u.output_tokens,
		cacheWriteTokens: u.cache_creation_input_tokens ?? 0,
		cacheReadTokens: u.cache_read_input_tokens ?? 0
	};
}

export function addUsage(a: Usage, b: Usage): Usage {
	return {
		inputTokens: a.inputTokens + b.inputTokens,
		outputTokens: a.outputTokens + b.outputTokens,
		cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
		cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens
	};
}

/** Cache writes cost 1.25× input and cache reads 0.1× input (5-minute cache). */
export function costUsd(u: Usage, prices: { inputPerMTok: number; outputPerMTok: number }): number {
	const input =
		u.inputTokens * prices.inputPerMTok +
		u.cacheWriteTokens * prices.inputPerMTok * 1.25 +
		u.cacheReadTokens * prices.inputPerMTok * 0.1;
	return (input + u.outputTokens * prices.outputPerMTok) / 1_000_000;
}
