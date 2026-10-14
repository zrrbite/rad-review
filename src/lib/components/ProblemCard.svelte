<script lang="ts">
	import type { RenderedProblem } from '$lib/view-types';

	let { problem }: { problem: RenderedProblem } = $props();
</script>

<article class="problem">
	<p class="prompt">{@html problem.promptHtml}</p>
	{#if problem.tableHtml}
		<table class="data">
			<tbody>
				{#each problem.tableHtml as row, i (i)}
					<tr>
						<th scope="row">{@html row[0]}</th>
						{#each row.slice(1) as cell, j (j)}<td>{@html cell}</td>{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	{/if}
	<p class="hint">{@html problem.hintHtml}</p>
</article>
