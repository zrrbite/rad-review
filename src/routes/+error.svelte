<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head><title>Fejl · Matematiktræning</title></svelte:head>

<main class="narrow">
	<h1>{page.status === 404 ? 'Siden findes ikke' : 'Noget gik galt'}</h1>
	<p>{page.error?.message ?? ''}</p>
	<p><a href="/">Til forsiden</a></p>
</main>
