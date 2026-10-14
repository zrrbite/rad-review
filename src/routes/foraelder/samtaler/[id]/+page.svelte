<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Samtale · Forælder</title></svelte:head>

<main>
	<p><a href="/foraelder/samtaler">← Samtaler</a></p>
	<h1>{data.skill}</h1>
	<p class="muted small">{data.when}</p>
	{#if data.flagReason}<p class="flag">Markeret: {data.flagReason}</p>{/if}
	<article class="problem">
		<p>{@html data.promptHtml}</p>
		<p class="hint">Svaret var {data.given}. Rigtigt svar: {data.answerText}.</p>
	</article>
	{#each data.messages as m (m.id)}
		<p class="bubble {m.role}">{m.text}</p>
	{/each}
</main>
