import { error, fail, redirect } from '@sveltejs/kit';
import { renderProblem } from '$lib/render';
import { randomSeed } from '$lib/rng';
import { getDb } from '$lib/server/instance';
import { advance, submitAnswer, viewSession } from '$lib/server/practice';
import type { Actions, PageServerLoad } from './$types';

function sessionId(raw: string): number {
	const id = Number(raw);
	if (!Number.isSafeInteger(id) || id <= 0) error(404, 'Træningen findes ikke.');
	return id;
}

export const load: PageServerLoad = ({ params }) => {
	const view = viewSession(getDb(), sessionId(params.id), new Date(), randomSeed);
	if (!view) error(404, 'Træningen findes ikke.');
	if (view.state === 'done') return { view };
	return { view: { ...view, problem: renderProblem(view.problem) } };
};

export const actions: Actions = {
	answer: async ({ params, request }) => {
		const input = String((await request.formData()).get('answer') ?? '');
		const result = submitAnswer(getDb(), sessionId(params.id), input, new Date());
		if (!result.ok) return fail(400, { message: result.message, input });
	},
	next: ({ params }) => {
		advance(getDb(), sessionId(params.id), new Date());
		redirect(303, `/traen/${params.id}`);
	}
};
