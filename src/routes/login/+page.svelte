<script lang="ts">
	import type { PageProps } from './$types';

	let { form }: PageProps = $props();
</script>

<svelte:head><title>Log ind · Matematiktræning</title></svelte:head>

<main class="narrow">
	<h1>Matematiktræning</h1>
	<form method="POST" class="stack">
		<label for="password">Kodeord</label>
		<input id="password" name="password" type="password" autocomplete="current-password" required />
		{#if form?.message}<p class="notice" role="alert">{form.message}</p>{/if}
		<button class="primary" type="submit">Log ind</button>
	</form>
</main>
