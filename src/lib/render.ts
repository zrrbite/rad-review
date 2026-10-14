// Text with $…$ math → HTML. Runs on the server, so pages ship KaTeX's CSS
// but not its JavaScript. Everything outside $…$ is escaped.

import katex from 'katex';
import type { ProblemView } from './server/practice';
import type { RenderedProblem } from './view-types';

const escapeHtml = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function renderMath(text: string): string {
	return text
		.split(/(\$[^$]+\$)/g)
		.map((part) =>
			/^\$[^$]+\$$/.test(part)
				? katex.renderToString(part.slice(1, -1), { throwOnError: false })
				: escapeHtml(part)
		)
		.join('');
}

export function renderProblem(p: ProblemView): RenderedProblem {
	return {
		number: p.number,
		total: p.total,
		isRetry: p.isRetry,
		skillName: p.skillName,
		promptHtml: renderMath(p.prompt),
		tableHtml: p.table ? p.table.map((row) => row.map(renderMath)) : null,
		hintHtml: renderMath(p.inputHint)
	};
}
