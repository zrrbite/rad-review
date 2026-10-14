<script lang="ts">
	import SkillMap from '$lib/components/SkillMap.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head><title>Mit kort · Matematiktræning</title></svelte:head>

<main>
	<h1>Mit kort</h1>
	<p class="muted">Farven viser, hvor sikker du er i hver færdighed.</p>
	<SkillMap topics={data.topics} />
	<p><a href="/">Til forsiden</a></p>
</main>
