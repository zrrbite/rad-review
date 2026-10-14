// What the skill map and the parent pages show (spec section 7).

import { displayStatus, replay, STATUS_LABELS, type DisplayStatus } from '../adaptive/state';
import { fmtNum } from '../math/format';
import { renderMath } from '../render';
import { SKILL_IDS, SKILL_NAMES, TOPICS, type SkillId } from '../skills/curriculum';
import { addDays, formatDanishDateTime, formatDanishDay, localDate, weekStart } from '../time';
import type { SkillMapTopic, TrendPoint } from '../view-types';
import type { Config } from './config';
import type { DB } from './db';
import * as repo from './repo';
import { monthSpendUsd } from './tutor';

const GAP_CAP_MS = 5 * 60_000;
const STATUS_ORDER: DisplayStatus[] = ['untried', 'weak', 'progressing', 'solid', 'due'];

export function skillMap(db: DB, now: Date, withDetail = false): SkillMapTopic[] {
	const states = repo.loadSkillStates(db);
	return TOPICS.map((topic) => ({
		id: topic.id,
		name: topic.name,
		skills: topic.skills.map((id) => {
			const state = states[id];
			const status = displayStatus(state, now);
			const detail =
				withDetail && state.lastAttemptAt
					? `${Math.round(state.strength * 100)} % · niveau ${state.level} · ${formatDanishDay(state.lastAttemptAt)}`
					: null;
			return { id, name: SKILL_NAMES[id], status, label: STATUS_LABELS[status], detail };
		})
	}));
}

/** Minutes this week: gaps between answers in the same session, each at most 5 minutes. */
export function minutesThisWeek(attempts: repo.AttemptRow[], now: Date): number {
	const monday = weekStart(now);
	let ms = 0;
	for (let i = 1; i < attempts.length; i++) {
		const [prev, cur] = [attempts[i - 1], attempts[i]];
		if (cur.sessionId !== prev.sessionId || localDate(cur.createdAt) < monday) continue;
		ms += Math.min(GAP_CAP_MS, Date.parse(cur.createdAt) - Date.parse(prev.createdAt));
	}
	return Math.round(ms / 60_000);
}

/** How many skills were weak at the end of each day, for the last `days` days. */
export function weakTrend(attempts: repo.AttemptRow[], now: Date, days = 30): TrendPoint[] {
	if (attempts.length === 0) return [];
	const today = localDate(now);
	const firstDay = attempts.map((a) => localDate(a.createdAt)).reduce((a, b) => (b < a ? b : a));
	const windowStart = addDays(today, -(days - 1));
	const start = firstDay > windowStart ? firstDay : windowStart;

	const bySkill = new Map<SkillId, repo.AttemptRow[]>();
	for (const a of attempts) bySkill.set(a.skillId, [...(bySkill.get(a.skillId) ?? []), a]);

	const points: TrendPoint[] = [];
	for (let date = start; date <= today; date = addDays(date, 1)) {
		let weak = 0;
		for (const [skillId, list] of bySkill) {
			const upToDate = list.filter((a) => localDate(a.createdAt) <= date).map(repo.toRecord);
			if (replay(skillId, upToDate).status === 'weak') weak++;
		}
		points.push({ date, label: formatDanishDay(`${date}T12:00:00Z`), weak });
	}
	return points;
}

export interface Overview {
	lastPractised: string | null;
	daysThisWeek: number;
	minutesThisWeek: number;
	counts: { status: DisplayStatus; label: string; count: number }[];
	trend: TrendPoint[];
	spend: string;
	cap: string;
	flaggedCount: number;
	conversationCount: number;
}

export function overview(db: DB, now: Date, config: Config): Overview {
	const attempts = repo.allAttempts(db);
	const states = repo.loadSkillStates(db);
	const statuses = SKILL_IDS.map((id) => displayStatus(states[id], now));
	const monday = weekStart(now);
	const last = attempts.at(-1);
	return {
		lastPractised: last ? formatDanishDateTime(last.createdAt) : null,
		daysThisWeek: new Set(attempts.map((a) => localDate(a.createdAt)).filter((d) => d >= monday)).size,
		minutesThisWeek: minutesThisWeek(attempts, now),
		counts: STATUS_ORDER.map((status) => ({
			status,
			label: STATUS_LABELS[status],
			count: statuses.filter((s) => s === status).length
		})),
		trend: weakTrend(attempts, now),
		spend: fmtNum(monthSpendUsd(db, now, config), 2),
		cap: fmtNum(config.tutorMonthlyCapUsd, 2),
		flaggedCount: repo.countFlagged(db),
		conversationCount: repo.listConversations(db).length
	};
}

export interface HistoryItem {
	id: number;
	when: string;
	level: number;
	promptHtml: string;
	given: string;
	answerText: string;
	correct: boolean;
	isRetry: boolean;
	conversationId: number | null;
}

/** Her recent answers on one skill, newest first. */
export function skillHistory(db: DB, skillId: SkillId, limit = 30): HistoryItem[] {
	return repo.recentAttemptsForSkill(db, skillId, limit).map((a) => ({
		id: a.id,
		when: formatDanishDateTime(a.createdAt),
		level: a.level,
		promptHtml: renderMath(a.problem.prompt),
		given: a.givenAnswer,
		answerText: a.problem.answerText,
		correct: a.correct,
		isRetry: a.isRetry,
		conversationId: repo.getConversationByAttempt(db, a.id)?.id ?? null
	}));
}
