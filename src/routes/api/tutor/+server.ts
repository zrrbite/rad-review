import { error, json } from '@sveltejs/kit';
import { renderMath } from '$lib/render';
import { getConfig } from '$lib/server/config';
import { getDb } from '$lib/server/instance';
import { askTutor, conversationView, openTutor, type TutorDeps, type TutorEvent } from '$lib/server/tutor';
import { tutorModel } from '$lib/server/tutor-model';
import { encodeEvent, type ClientTutorEvent } from '$lib/sse';
import type { RequestHandler } from './$types';

function deps(): TutorDeps {
	const config = getConfig();
	return { db: getDb(), config, model: tutorModel(config), now: () => new Date() };
}

function toClient(event: TutorEvent): ClientTutorEvent {
	if (event.type !== 'fallback') return event;
	return { type: 'fallback', intro: event.intro, stepsHtml: event.steps.map(renderMath) };
}

export const GET: RequestHandler = ({ url }) => {
	const attemptId = Number(url.searchParams.get('attempt'));
	if (!Number.isSafeInteger(attemptId) || attemptId <= 0) error(400, 'attempt mangler');
	return json(conversationView(getDb(), attemptId));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = (await request.json().catch(() => null)) as { attemptId?: unknown; message?: unknown } | null;
	const attemptId = Number(body?.attemptId);
	if (!Number.isSafeInteger(attemptId) || attemptId <= 0) error(400, 'attemptId mangler');
	const events =
		typeof body?.message === 'string' ? askTutor(deps(), attemptId, body.message) : openTutor(deps(), attemptId);

	const encoder = new TextEncoder();
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			try {
				for await (const event of events) controller.enqueue(encoder.encode(encodeEvent(toClient(event))));
			} catch (err) {
				console.error('tutor stream failed', err);
				controller.enqueue(encoder.encode(encodeEvent({ type: 'error', message: 'Tutoren svarer ikke lige nu.' })));
			}
			controller.close();
		}
	});
	return new Response(stream, {
		headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' }
	});
};
