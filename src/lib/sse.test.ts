import { describe, expect, it } from 'vitest';
import { decodeEvents, encodeEvent, type ClientTutorEvent } from './sse';

describe('tutor stream events', () => {
	it('decodes what it encodes, even when chunks split an event', () => {
		const events: ClientTutorEvent[] = [
			{ type: 'text', text: 'Hej\nmed linjeskift' },
			{ type: 'done', remaining: 5 }
		];
		const wire = events.map(encodeEvent).join('');
		const cut = 7;
		const first = decodeEvents(wire.slice(0, cut));
		expect(first.events).toEqual([]);
		const second = decodeEvents(first.rest + wire.slice(cut));
		expect(second.events).toEqual(events);
		expect(second.rest).toBe('');
	});
});
