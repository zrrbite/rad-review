// The model behind the tutor: the real Anthropic API, or a canned fake for
// tests and the e2e run (TUTOR_FAKE=1).

import Anthropic from '@anthropic-ai/sdk';
import type { Config } from './config';
import { FLAG_TOOL, MAX_REPLY_TOKENS, SYSTEM_PROMPT } from './tutor-prompt';

/** One call to the model: the reply text as it streams, then the whole message. */
export interface ModelTurn {
	deltas: AsyncIterable<string>;
	final(): Promise<Anthropic.Message>;
}

export interface TutorModel {
	run(messages: Anthropic.MessageParam[]): ModelTurn;
}

export function anthropicModel(apiKey: string, model: string): TutorModel {
	const client = new Anthropic({ apiKey, maxRetries: 2, timeout: 60_000 });
	return {
		run(messages) {
			const stream = client.messages.stream({
				model,
				max_tokens: MAX_REPLY_TOKENS,
				system: SYSTEM_PROMPT,
				tools: [FLAG_TOOL],
				output_config: { effort: 'low' },
				cache_control: { type: 'ephemeral' },
				messages
			});
			async function* deltas() {
				for await (const event of stream) {
					if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
						yield event.delta.text;
					}
				}
			}
			return { deltas: deltas(), final: () => stream.finalMessage() };
		}
	};
}

export const FAKE_REPLY =
	'Prøvetutor: Det ser ud til, at du har regnet i en anden rækkefølge. Husk at gange før du lægger sammen.';

export interface FakeStep {
	text: string;
	flag?: string;
	stopReason?: Anthropic.StopReason;
	fail?: boolean;
}

/** Plays the steps in order, repeating the last one; records every call. */
export function fakeModel(
	steps: FakeStep[] = [{ text: FAKE_REPLY }]
): TutorModel & { calls: Anthropic.MessageParam[][] } {
	const calls: Anthropic.MessageParam[][] = [];
	let index = 0;
	return {
		calls,
		run(messages) {
			calls.push(structuredClone(messages));
			const step = steps[Math.min(index, steps.length - 1)];
			index++;
			const content: unknown[] = [];
			if (step.text) content.push({ type: 'text', text: step.text, citations: null });
			if (step.flag) {
				content.push({ type: 'tool_use', id: `toolu_fake_${index}`, name: 'flag_for_parent', input: { reason: step.flag } });
			}
			const message = {
				id: `msg_fake_${index}`,
				type: 'message',
				role: 'assistant',
				model: 'fake',
				content,
				stop_reason: step.stopReason ?? (step.flag ? 'tool_use' : 'end_turn'),
				stop_sequence: null,
				usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 }
			} as unknown as Anthropic.Message;
			async function* deltas() {
				if (step.fail) throw new Error('fake model failure');
				for (const word of step.text.split(/(?<= )/)) if (word) yield word;
			}
			return {
				deltas: deltas(),
				final: async () => {
					if (step.fail) throw new Error('fake model failure');
					return message;
				}
			};
		}
	};
}

let cached: TutorModel | null | undefined;

/** The model this process uses: the fake, the real API, or none (no key). */
export function tutorModel(config: Config): TutorModel | null {
	if (cached === undefined) {
		cached = config.tutorFake
			? fakeModel()
			: config.anthropicApiKey
				? anthropicModel(config.anthropicApiKey, config.tutorModel)
				: null;
	}
	return cached;
}
