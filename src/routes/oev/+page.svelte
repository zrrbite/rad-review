<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Øv selv · Matematiktræning</title></svelte:head>

<main>
	<h1>Øv selv</h1>
	<p class="muted">Vælg en færdighed, og få 10 opgaver i den.</p>
	<form method="POST" action="?/start">
		{#each data.topics as topic (topic.id)}
			<h2>{topic.name}</h2>
			<div class="choices">
				{#each topic.skills as skill (skill.id)}
					<button class="status-{skill.status}" name="skill" value={skill.id} type="submit">{skill.name}</button>
				{/each}
			</div>
		{/each}
	</form>
	<p><a href="/">Til forsiden</a></p>
</main>
