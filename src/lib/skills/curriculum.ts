// The skills and topics from spec section 3. Matching her textbook later means
// editing the grouping and names here; the generators don't change.

export const TOPICS = [
	{
		id: 'numbers',
		name: 'Tal og regning',
		skills: [
			'order-of-operations',
			'negative-numbers',
			'fraction-simplify',
			'fraction-add-sub',
			'fraction-mul-div',
			'fraction-decimal-percent'
		]
	},
	{ id: 'percent', name: 'Procent', skills: ['percent-of', 'percent-what', 'percent-change'] },
	{
		id: 'algebra',
		name: 'Algebra og ligninger',
		skills: ['formula-substitution', 'simplify-expression', 'linear-equations']
	},
	{ id: 'functions', name: 'Funktioner', skills: ['linear-evaluate', 'slope-intercept'] },
	{
		id: 'geometry',
		name: 'Geometri og måling',
		skills: ['triangle-angles', 'perimeter-area', 'circle', 'box-volume', 'scale', 'unit-conversion']
	},
	{
		id: 'statistics',
		name: 'Statistik og sandsynlighed',
		skills: ['descriptive-stats', 'frequency', 'probability', 'counting']
	}
] as const;

export type TopicId = (typeof TOPICS)[number]['id'];
export type SkillId = (typeof TOPICS)[number]['skills'][number];

export const SKILL_NAMES: Record<SkillId, string> = {
	'order-of-operations': 'Regnehierarki',
	'negative-numbers': 'Negative tal',
	'fraction-simplify': 'Forkort og forlæng brøker',
	'fraction-add-sub': 'Plus og minus med brøker',
	'fraction-mul-div': 'Gange og dele med brøker',
	'fraction-decimal-percent': 'Brøk, decimaltal og procent',
	'percent-of': 'Procent af et tal',
	'percent-what': 'Hvor mange procent',
	'percent-change': 'Procentvis ændring',
	'formula-substitution': 'Indsæt i formel',
	'simplify-expression': 'Reducér udtryk',
	'linear-equations': 'Løs ligninger',
	'linear-evaluate': 'Udregn y ud fra y = ax + b',
	'slope-intercept': 'Hældning og skæring',
	'triangle-angles': 'Vinkelsum i trekant',
	'perimeter-area': 'Omkreds og areal',
	circle: 'Cirkel',
	'box-volume': 'Rumfang af kasse',
	scale: 'Målestok',
	'unit-conversion': 'Enhedsomregning',
	'descriptive-stats': 'Middeltal, median, typetal og variationsbredde',
	frequency: 'Hyppighed og frekvens',
	probability: 'Simpel sandsynlighed',
	counting: 'Tælleprincippet'
};

export const SKILL_IDS: readonly SkillId[] = TOPICS.flatMap((t) => [...t.skills]);

export function topicOf(skill: SkillId): (typeof TOPICS)[number] {
	const topic = TOPICS.find((t) => (t.skills as readonly string[]).includes(skill));
	if (!topic) throw new Error(`unknown skill ${skill}`);
	return topic;
}

/** Every skill, round-robin over the topics, so neighbours come from different topics. */
export function interleavedOrder(): SkillId[] {
	const out: SkillId[] = [];
	const longest = Math.max(...TOPICS.map((t) => t.skills.length));
	for (let i = 0; i < longest; i++) {
		for (const topic of TOPICS) {
			if (i < topic.skills.length) out.push(topic.skills[i]);
		}
	}
	return out;
}
