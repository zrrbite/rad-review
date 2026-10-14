// The events the tutor endpoint streams, as server-sent events. Shared by
// the endpoint and the browser.

export type ClientTutorEvent =
	| { type: 'text'; text: string }
	| { type: 'fallback'; intro: string; stepsHtml: string[] }
	| { type: 'done'; remaining: number }
	| { type: 'error'; message: string };

export function encodeEvent(event: ClientTutorEvent): string {
	return `data: ${JSON.stringify(event)}\n\n`;
}

/** Splits a growing buffer into complete events and the unfinished rest. */
export function decodeEvents(buffer: string): { events: ClientTutorEvent[]; rest: string } {
	const parts = buffer.split('\n\n');
	const rest = parts.pop() ?? '';
	const events = parts
		.map((part) =>
			part
				.split('\n')
				.filter((line) => line.startsWith('data: '))
				.map((line) => line.slice(6))
				.join('\n')
		)
		.filter((data) => data !== '')
		.map((data) => JSON.parse(data) as ClientTutorEvent);
	return { events, rest };
}
