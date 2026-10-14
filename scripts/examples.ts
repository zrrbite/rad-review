// Writes three examples per skill and level to docs/examples.md, so a person
// can proofread the Danish. Run with: npm run examples

import { writeFileSync } from 'node:fs';
import { SKILL_NAMES, TOPICS } from '../src/lib/skills/curriculum';
import { generateProblem, registeredSkills } from '../src/lib/skills/registry';
import { LEVELS } from '../src/lib/skills/types';

const registered = new Set(registeredSkills());
const lines: string[] = [
	'# Eksempler på opgaver',
	'',
	'Genereret af `npm run examples`: tre eksempler pr. færdighed og niveau, til korrekturlæsning.',
	''
];

for (const topic of TOPICS) {
	lines.push(`## ${topic.name}`, '');
	for (const skill of topic.skills) {
		if (!registered.has(skill)) continue;
		lines.push(`### ${SKILL_NAMES[skill]} (\`${skill}\`)`, '');
		for (const level of LEVELS) {
			lines.push(`**Niveau ${level}**`, '');
			for (const seed of [1, 2, 3]) {
				const p = generateProblem(skill, level, seed);
				lines.push(`- ${p.prompt}`);
				if (p.table) lines.push(`  - Tabel: ${p.table.map((row) => row.join(' | ')).join(' / ')}`);
				lines.push(`  - Hjælp: ${p.inputHint}`);
				lines.push(`  - Løsning: ${p.solution.join(' → ')}`);
			}
			lines.push('');
		}
	}
}

writeFileSync('docs/examples.md', lines.join('\n'));
console.log(`Wrote docs/examples.md (${registered.size} skills)`);
