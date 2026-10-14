<script lang="ts">
	import type { TrendPoint } from '$lib/view-types';

	let { points }: { points: TrendPoint[] } = $props();

	const W = 320;
	const H = 120;
	const PAD = { top: 12, right: 30, bottom: 22, left: 6 };
	const plotWidth = W - PAD.left - PAD.right;

	const max = $derived(Math.max(1, ...points.map((p) => p.weak)));
	const x = (i: number) => PAD.left + (points.length <= 1 ? plotWidth : (i / (points.length - 1)) * plotWidth);
	const y = (v: number) => PAD.top + (1 - v / max) * (H - PAD.top - PAD.bottom);
	const path = $derived(
		points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.weak).toFixed(1)}`).join(' ')
	);

	let active = $state<number | null>(null);
	const shown = $derived(active ?? points.length - 1);

	function track(event: PointerEvent) {
		const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const svgX = ((event.clientX - box.left) / box.width) * W;
		const i = Math.round(((svgX - PAD.left) / plotWidth) * (points.length - 1));
		active = Math.min(points.length - 1, Math.max(0, i));
	}
</script>

<figure class="trend">
	<figcaption>Svage færdigheder pr. dag</figcaption>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="plot" onpointermove={track} onpointerdown={track} onpointerleave={() => (active = null)}>
		<svg viewBox="0 0 {W} {H}" role="img" aria-label="Antal svage færdigheder pr. dag. Tallene står i tabellen nedenfor.">
			<line class="baseline" x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} />
			<text class="axis" x={W - PAD.right + 6} y={y(max) + 4}>{max}</text>
			<text class="axis" x={W - PAD.right + 6} y={y(0) + 4}>0</text>
			<path class="line" d={path} />
			{#if active !== null}
				<line class="crosshair" x1={x(active)} x2={x(active)} y1={PAD.top} y2={y(0)} />
			{/if}
			<circle class="dot" cx={x(shown)} cy={y(points[shown].weak)} r="4" />
			<text class="axis" x={PAD.left} y={H - 4}>{points[0].label}</text>
			<text class="axis" x={W - PAD.right} y={H - 4} text-anchor="end">{points[points.length - 1].label}</text>
		</svg>
	</div>
	<p class="readout">{points[shown].label}: <strong>{points[shown].weak}</strong> svage</p>
	<details>
		<summary>Vis som tabel</summary>
		<table class="data">
			<thead><tr><th>Dag</th><th>Svage</th></tr></thead>
			<tbody>
				{#each points as p (p.date)}<tr><td>{p.label}</td><td>{p.weak}</td></tr>{/each}
			</tbody>
		</table>
	</details>
</figure>
