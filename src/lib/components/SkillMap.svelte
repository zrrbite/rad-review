<script lang="ts">
	import type { SkillMapTopic } from '$lib/view-types';

	let {
		topics,
		linkTo = null
	}: { topics: SkillMapTopic[]; linkTo?: ((skillId: string) => string) | null } = $props();
</script>

<div class="skill-map">
	{#each topics as topic (topic.id)}
		<section>
			<h2>{topic.name}</h2>
			<ul>
				{#each topic.skills as skill (skill.id)}
					<li class="status-{skill.status}">
						{#if linkTo}
							<a href={linkTo(skill.id)}>{skill.name}</a>
						{:else}
							<span>{skill.name}</span>
						{/if}
						<span class="badge">{skill.label}</span>
						{#if skill.detail}<span class="detail">{skill.detail}</span>{/if}
					</li>
				{/each}
			</ul>
		</section>
	{/each}
</div>
