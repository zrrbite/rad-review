// Shapes that pages and components share with the server code.

import type { DisplayStatus } from './adaptive/state';

export interface RenderedProblem {
	number: number;
	total: number;
	isRetry: boolean;
	skillName: string;
	promptHtml: string;
	tableHtml: string[][] | null;
	hintHtml: string;
}

export interface SkillMapSkill {
	id: string;
	name: string;
	status: DisplayStatus;
	label: string;
	/** Strength, level and last practised; only on the parent's map. */
	detail: string | null;
}

export interface SkillMapTopic {
	id: string;
	name: string;
	skills: SkillMapSkill[];
}
