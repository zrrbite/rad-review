<script lang="ts">
	import SkillMap from '$lib/components/SkillMap.svelte';
	import WeakTrend from '$lib/components/WeakTrend.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	const o = $derived(data.overview);
</script>

<svelte:head><title>Forælder · Matematiktræning</title></svelte:head>

<main>
	<h1>Overblik</h1>
	<p class="muted">
		{o.lastPractised ? `Sidst øvet ${o.lastPractised}.` : 'Der er ikke øvet endnu.'}
	</p>

	<div class="stats">
		<div class="stat"><strong>{o.daysThisWeek}</strong> dage i denne uge</div>
		<div class="stat"><strong>{o.minutesThisWeek}</strong> minutter i denne uge</div>
		{#each o.counts as c (c.status)}
			<div class="stat status-{c.status}"><strong>{c.count}</strong> {c.label.toLowerCase()}</div>
		{/each}
	</div>

	{#if o.trend.length > 1}
		<WeakTrend points={o.trend} />
	{/if}

	<p>
		<a href="/foraelder/samtaler">Samtaler med tutoren ({o.conversationCount})</a>
		{#if o.flaggedCount > 0}<span class="flag"> · {o.flaggedCount} markeret</span>{/if}
	</p>
	<p class="muted small">Tutoren har kostet {o.spend} $ denne måned. Grænsen er {o.cap} $.</p>

	<h2>Færdigheder</h2>
	<SkillMap topics={data.topics} linkTo={(id) => `/foraelder/faerdighed/${id}`} />
</main>
