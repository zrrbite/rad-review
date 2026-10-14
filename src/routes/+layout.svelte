<script lang="ts">
	import 'katex/dist/katex.min.css';
	import '../app.css';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();
</script>

<header class="top">
	<a class="brand" href={data.role === 'parent' ? '/foraelder' : '/'}>Matematiktræning</a>
	{#if data.role}
		<form method="POST" action="/logout">
			<button class="link" type="submit">Log ud</button>
		</form>
	{/if}
</header>

{@render children()}
