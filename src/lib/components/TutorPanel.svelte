<script lang="ts">
	import { onMount } from 'svelte';
	import { decodeEvents, type ClientTutorEvent } from '$lib/sse';

	let { attemptId }: { attemptId: number } = $props();

	type Line = { role: 'student' | 'tutor'; text: string };

	let lines = $state<Line[]>([]);
	let started = $state(false);
	let open = $state(true);
	let busy = $state(false);
	let remaining = $state(6);
	let question = $state('');
	let notice = $state('');
	let fallback = $state<{ intro: string; stepsHtml: string[] } | null>(null);

	onMount(async () => {
		const res = await fetch(`/api/tutor?attempt=${attemptId}`);
		if (!res.ok || started) return;
		const view = await res.json();
		started = view.started;
		open = view.open;
		remaining = view.remaining;
		lines = view.messages;
	});

	function handle(event: ClientTutorEvent, reply: number) {
		switch (event.type) {
			case 'text':
				lines[reply].text += event.text;
				break;
			case 'fallback':
				fallback = { intro: event.intro, stepsHtml: event.stepsHtml };
				open = false;
				break;
			case 'done':
				remaining = event.remaining;
				break;
			case 'error':
				notice = event.message;
				break;
		}
	}

	async function send(message?: string) {
		busy = true;
		notice = '';
		started = true;
		if (message) lines.push({ role: 'student', text: message });
		lines.push({ role: 'tutor', text: '' });
		const reply = lines.length - 1;
		try {
			const res = await fetch('/api/tutor', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(message ? { attemptId, message } : { attemptId })
			});
			if (!res.ok || !res.body) throw new Error(`status ${res.status}`);
			const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
			let buffer = '';
			for (;;) {
				const { value, done } = await reader.read();
				if (done) break;
				buffer += value;
				const { events, rest } = decodeEvents(buffer);
				buffer = rest;
				for (const event of events) handle(event, reply);
			}
		} catch {
			notice = 'Tutoren svarer ikke lige nu.';
		}
		if (lines[reply]?.text === '') lines.splice(reply, 1);
		busy = false;
	}

	function ask(event: SubmitEvent) {
		event.preventDefault();
		const text = question.trim();
		if (!text || busy) return;
		question = '';
		send(text);
	}
</script>

<section class="tutor" aria-live="polite">
	{#if !started}
		<button class="secondary" type="button" onclick={() => send()} disabled={busy}>Hvorfor?</button>
	{:else}
		{#each lines as line, i (i)}
			<p class="bubble {line.role}">{line.text || '…'}</p>
		{/each}
		{#if fallback}
			<div class="fallback">
				<p>{fallback.intro}</p>
				<ol>
					{#each fallback.stepsHtml as step, i (i)}<li>{@html step}</li>{/each}
				</ol>
			</div>
		{:else if open && remaining > 0}
			<form class="ask" onsubmit={ask}>
				<label for="tutor-question" class="visually-hidden">Dit spørgsmål</label>
				<input
					id="tutor-question"
					bind:value={question}
					maxlength="500"
					placeholder="Spørg tutoren om noget …"
					autocomplete="off"
					disabled={busy}
				/>
				<button type="submit" disabled={busy || !question.trim()}>Send</button>
			</form>
			<p class="muted small">Du kan stille {remaining} spørgsmål mere.</p>
		{/if}
	{/if}
	{#if notice}<p class="notice">{notice}</p>{/if}
	<p class="muted small">Dine samtaler med tutoren kan ses af dine forældre.</p>
</section>
