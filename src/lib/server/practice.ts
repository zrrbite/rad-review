// The practice flow (spec section 5): which problem she sees, what happens
// when she answers, and the summary at the end. The problem in progress lives
// in the session row, so the browser never sees an answer early.

import { pickNext, placementQueue, PRACTICE_LENGTH, SESSION_LENGTH } from '../adaptive/pick';
import { replay } from '../adaptive/state';
import { checkAnswer } from '../math/check';
import { createRng } from '../rng';
import { SKILL_IDS, SKILL_NAMES, type SkillId } from '../skills/curriculum';
import { generateProblem } from '../skills/registry';
import type { Level, Problem } from '../skills/types';
import { localDate, weekStart } from '../time';
import type { DB } from './db';
import * as repo from './repo';

export interface ProblemView {
	number: number;
	total: number;
	isRetry: boolean;
	skillName: string;
	prompt: string;
	table: string[][] | null;
	inputHint: string;
}

export interface SessionSummary {
	answered: number;
	correct: number;
	strongerSkills: string[];
}

export type SessionView =
	| { state: 'question'; kind: repo.SessionKind; problem: ProblemView }
	| { state: 'feedback'; kind: repo.SessionKind; problem: ProblemView; feedback: repo.Feedback }
	| { state: 'done'; kind: repo.SessionKind; summary: SessionSummary };

export type SubmitResult = { ok: true } | { ok: false; message: string };

export interface HomeInfo {
	untriedCount: number;
	totalSkills: number;
	daysThisWeek: number;
}

/** What she typed is kept up to this length. */
const MAX_INPUT = 100;

export function startSession(db: DB, kind: repo.SessionKind, skillId: SkillId | null, now: Date): number {
	if (kind === 'practice' && !skillId) throw new Error('a practice session needs a skill');
	const target =
		kind === 'placement'
			? placementQueue(repo.loadSkillStates(db)).length
			: kind === 'practice'
				? PRACTICE_LENGTH
				: SESSION_LENGTH;
	return repo.createSession(db, kind, kind === 'practice' ? skillId : null, target, now);
}

/**
 * A problem for this skill. A generator that throws is logged and retried with
 * new seeds, then replaced by other skills (spec section 12), so a session never stops.
 */
function generateSafely(
	states: ReturnType<typeof repo.loadSkillStates>,
	skillId: SkillId,
	level: Level,
	newSeed: () => number
): Problem {
	for (const candidate of [skillId, ...SKILL_IDS.filter((s) => s !== skillId)]) {
		const candidateLevel = candidate === skillId ? level : states[candidate].level;
		for (let tries = 0; tries < 3; tries++) {
			const seed = newSeed();
			try {
				return generateProblem(candidate, candidateLevel, seed);
			} catch (err) {
				console.error(`generator ${candidate} failed at level ${candidateLevel} with seed ${seed}`, err);
			}
		}
	}
	throw new Error('every generator failed');
}

function chooseNext(db: DB, s: repo.SessionRow, now: Date, newSeed: () => number): repo.CurrentProblem | null {
	const states = repo.loadSkillStates(db);
	const attempts = repo.sessionAttempts(db, s.id);

	if (s.retryPending && attempts.length > 0) {
		const last = attempts[attempts.length - 1];
		return { problem: generateSafely(states, last.skillId, states[last.skillId].level, newSeed), isRetry: true };
	}
	if (s.pickedCount >= s.targetCount) return null;

	let skillId: SkillId;
	let level: Level;
	if (s.kind === 'placement') {
		const queue = placementQueue(states);
		if (queue.length === 0) return null;
		[skillId, level] = [queue[0], 2];
	} else if (s.kind === 'practice' && s.skillId) {
		[skillId, level] = [s.skillId, states[s.skillId].level];
	} else {
		const recent = attempts.map((a) => a.skillId);
		const pick = pickNext(states, recent, now, createRng(newSeed()));
		[skillId, level] = [pick.skillId, pick.level];
	}
	return { problem: generateSafely(states, skillId, level, newSeed), isRetry: false };
}

function toView(s: repo.SessionRow, current: repo.CurrentProblem): ProblemView {
	const p = current.problem;
	return {
		number: s.pickedCount,
		total: s.targetCount,
		isRetry: current.isRetry,
		skillName: SKILL_NAMES[p.skillId],
		prompt: p.prompt,
		table: p.table ?? null,
		inputHint: p.inputHint
	};
}

function summarize(db: DB, s: repo.SessionRow): SessionSummary {
	const attempts = repo.sessionAttempts(db, s.id);
	if (attempts.length === 0) return { answered: 0, correct: 0, strongerSkills: [] };
	const firstId = attempts[0].id;
	const lastId = attempts[attempts.length - 1].id;
	const stronger: string[] = [];
	for (const skillId of new Set(attempts.map((a) => a.skillId))) {
		const history = repo.attemptsForSkill(db, skillId).filter((a) => a.id <= lastId);
		const before = replay(skillId, history.filter((a) => a.id < firstId).map(repo.toRecord)).strength;
		const after = replay(skillId, history.map(repo.toRecord)).strength;
		if (after > before + 1e-9) stronger.push(SKILL_NAMES[skillId]);
	}
	return {
		answered: attempts.length,
		correct: attempts.filter((a) => a.correct).length,
		strongerSkills: stronger
	};
}

export function viewSession(db: DB, sessionId: number, now: Date, newSeed: () => number): SessionView | null {
	let s = repo.getSession(db, sessionId);
	if (!s) return null;

	if (s.phase === 'question' && !s.current) {
		const next = chooseNext(db, s, now, newSeed);
		if (next) {
			const pickedCount = next.isRetry ? s.pickedCount : s.pickedCount + 1;
			repo.updateSession(db, s.id, { current: next, pickedCount, retryPending: false });
		} else {
			repo.updateSession(db, s.id, { phase: 'done', endedAt: now.toISOString() });
		}
		s = repo.getSession(db, sessionId)!;
	}

	if (s.phase === 'done') return { state: 'done', kind: s.kind, summary: summarize(db, s) };
	const problem = toView(s, s.current!);
	if (s.phase === 'feedback') return { state: 'feedback', kind: s.kind, problem, feedback: s.feedback! };
	return { state: 'question', kind: s.kind, problem };
}

export function submitAnswer(db: DB, sessionId: number, input: string, now: Date): SubmitResult {
	const s = repo.getSession(db, sessionId);
	if (!s || s.phase !== 'question' || !s.current) return { ok: true };

	const given = input.trim().slice(0, MAX_INPUT);
	const outcome = checkAnswer(s.current.problem.answer, given);
	if (outcome.result === 'unreadable' || outcome.result === 'ambiguous') {
		return { ok: false, message: outcome.message };
	}

	const { problem, isRetry } = s.current;
	const correct = outcome.result === 'right';
	const offerRetry = !correct && !isRetry && s.kind !== 'placement';

	db.transaction(() => {
		const attemptId = repo.insertAttempt(db, {
			sessionId: s.id,
			skillId: problem.skillId,
			level: problem.level,
			seed: problem.seed,
			problem,
			givenAnswer: given,
			correct,
			isRetry,
			createdAt: now.toISOString()
		});
		const history = repo.attemptsForSkill(db, problem.skillId).map(repo.toRecord);
		repo.saveSkillState(db, replay(problem.skillId, history));
		repo.updateSession(db, s.id, {
			phase: 'feedback',
			retryPending: offerRetry,
			feedback: {
				attemptId,
				correct,
				given,
				answerText: problem.answerText,
				isRetry,
				tutorAllowed: !correct && s.kind !== 'placement',
				nextLabel: offerRetry ? 'Prøv en lignende' : 'Næste'
			}
		});
	})();
	return { ok: true };
}

export function advance(db: DB, sessionId: number, now: Date): void {
	const s = repo.getSession(db, sessionId);
	if (!s || s.phase !== 'feedback') return;
	repo.closeConversationsForSession(db, s.id, now);
	repo.updateSession(db, s.id, { phase: 'question', current: null, feedback: null });
}

export function homeInfo(db: DB, now: Date): HomeInfo {
	const states = repo.loadSkillStates(db);
	const monday = weekStart(now);
	const days = new Set(
		repo
			.allAttempts(db)
			.map((a) => localDate(a.createdAt))
			.filter((d) => d >= monday)
	);
	return {
		untriedCount: SKILL_IDS.filter((id) => states[id].status === 'untried').length,
		totalSkills: SKILL_IDS.length,
		daysThisWeek: days.size
	};
}
