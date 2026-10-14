<script lang="ts">
	import { enhance } from '$app/forms';
	import { ignoreHastyEnter } from '$lib/actions';
	import ProblemCard from '$lib/components/ProblemCard.svelte';
	import TutorPanel from '$lib/components/TutorPanel.svelte';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();
	const view = $derived(data.view);
</script>

<svelte:head><title>Træning · Matematiktræning</title></svelte:head>

<main>
	{#if view.state === 'done'}
		<h1>{view.kind === 'placement' ? 'Kortlægning færdig' : 'Godt arbejde!'}</h1>
		<p>Du svarede rigtigt på {view.summary.correct} af {view.summary.answered} opgaver.</p>
		{#if view.kind !== 'placement' && view.summary.strongerSkills.length > 0}
			<p>
				{view.summary.strongerSkills.length}
				{view.summary.strongerSkills.length === 1 ? 'færdighed blev' : 'færdigheder blev'} stærkere i dag:
			</p>
			<ul>
				{#each view.summary.strongerSkills as name (name)}<li>{name}</li>{/each}
			</ul>
		{/if}
		<!-- autofocus, not a focus() call: SvelteKit refocuses [autofocus] after each
		     navigation, which is how Enter keeps the session moving. -->
		<!-- svelte-ignore a11y_autofocus -->
		<a class="button primary" href="/" autofocus>Til forsiden</a>
	{:else}
		<p class="progress">
			{view.problem.isRetry ? 'Prøv en lignende' : `Opgave ${view.problem.number} af ${view.problem.total}`}
			· {view.problem.skillName}
		</p>
		<ProblemCard problem={view.problem} />

		{#if view.state === 'question'}
			<form method="POST" action="?/answer" class="answer" use:enhance>
				<label for="answer" class="visually-hidden">Dit svar</label>
				<!-- svelte-ignore a11y_autofocus -->
				<input id="answer" name="answer" autocomplete="off" value={form?.input ?? ''} autofocus />
				<button class="primary" type="submit">Svar</button>
			</form>
			{#if form?.message}<p class="notice" role="status">{form.message}</p>{/if}
		{:else}
			<div class="feedback {view.feedback.correct ? 'right' : 'wrong'}" role="status">
				{#if view.feedback.correct}
					<p><strong>Rigtigt!</strong> {view.feedback.given}</p>
				{:else}
					<p>
						<strong>Ikke helt.</strong> Du skrev {view.feedback.given}. Det rigtige svar er
						<strong>{view.feedback.answerText}</strong>.
					</p>
				{/if}
			</div>
			{#if view.feedback.tutorAllowed}
				{#key view.feedback.attemptId}
					<TutorPanel attemptId={view.feedback.attemptId} />
				{/key}
			{/if}
			<form method="POST" action="?/next" use:enhance>
				<!-- svelte-ignore a11y_autofocus -->
				<button class="primary" type="submit" autofocus use:ignoreHastyEnter>{view.feedback.nextLabel}</button>
			</form>
		{/if}
	{/if}
</main>
