<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>{data.name} · Forælder</title></svelte:head>

<main>
	<p><a href="/foraelder">← Overblik</a></p>
	<h1>{data.name}</h1>
	{#if data.history.length === 0}
		<p class="muted">Ingen svar endnu.</p>
	{:else}
		<div class="history">
			<ul>
				{#each data.history as h (h.id)}
					<li>
						<p class="muted small">{h.when} · niveau {h.level}{h.isRetry ? ' · prøv en lignende' : ''}</p>
						<p>{@html h.promptHtml}</p>
						<p>
							{h.correct ? '✓' : '✗'} Svarede <strong>{h.given}</strong>{#if !h.correct}. Rigtigt: {h.answerText}{/if}
							{#if h.conversationId}· <a href="/foraelder/samtaler/{h.conversationId}">Samtale</a>{/if}
						</p>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</main>
