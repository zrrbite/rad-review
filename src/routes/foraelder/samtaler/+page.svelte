<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Samtaler · Forælder</title></svelte:head>

<main>
	<p><a href="/foraelder">← Overblik</a></p>
	<h1>Samtaler med tutoren</h1>
	{#if data.conversations.length === 0}
		<p class="muted">Ingen samtaler endnu.</p>
	{:else}
		<div class="conversations">
			<ul>
				{#each data.conversations as c (c.id)}
					<li>
						<a href="/foraelder/samtaler/{c.id}">{c.skill} · {c.when}</a>
						{#if c.flagged}<p class="flag">Markeret: {c.flagReason}</p>{/if}
						<p class="muted small">{c.preview}</p>
					</li>
				{/each}
			</ul>
		</div>
	{/if}
</main>
