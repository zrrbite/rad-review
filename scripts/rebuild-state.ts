// Recomputes skill_state from the stored attempts, after a rule change in
// src/lib/adaptive/state.ts. Uses DATABASE_PATH from .env or the environment.
// Run with: npm run rebuild-state

import { replay } from '../src/lib/adaptive/state';
import { getConfig } from '../src/lib/server/config';
import { openDb } from '../src/lib/server/db';
import { attemptsForSkill, saveSkillState, toRecord } from '../src/lib/server/repo';
import { SKILL_IDS } from '../src/lib/skills/curriculum';

const { databasePath } = getConfig();
const db = openDb(databasePath);
db.transaction(() => {
	for (const skillId of SKILL_IDS) {
		saveSkillState(db, replay(skillId, attemptsForSkill(db, skillId).map(toRecord)));
	}
})();
console.log(`Rebuilt skill_state for ${SKILL_IDS.length} skills in ${databasePath}`);
