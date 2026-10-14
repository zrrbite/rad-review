<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const placement = $derived(data.untriedCount > 0);
	const firstTime = $derived(data.untriedCount === data.totalSkills);
	const buttonLabel = $derived(
		placement ? (firstTime ? 'Start kortlægning' : 'Fortsæt kortlægning') : 'Start træning'
	);
</script>

<svelte:head><title>Matematiktræning</title></svelte:head>

<main>
	<h1>Hej!</h1>
	{#if placement && firstTime}
		<p>Først finder vi ud af, hvad du allerede kan. Det tager to omgange med 12 opgaver.</p>
	{:else if placement}
		<p>Der er {data.untriedCount} færdigheder tilbage i kortlægningen.</p>
	{:else}
		<p>En træning er 10 opgaver og tager 10–15 minutter.</p>
	{/if}

	<form method="POST" action="?/start">
		<button class="primary big" type="submit">{buttonLabel}</button>
	</form>

	<nav class="tiles">
		<a href="/oev">Øv selv</a>
		<a href="/kort">Mit kort</a>
	</nav>

	<p class="muted">
		Du har øvet {data.daysThisWeek}
		{data.daysThisWeek === 1 ? 'dag' : 'dage'} i denne uge.
	</p>
</main>
