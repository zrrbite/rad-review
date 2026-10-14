// All SQL lives here. Rows come back as typed objects with their JSON parsed.

import type Anthropic from '@anthropic-ai/sdk';
import { fillStates, type SkillStates } from '../adaptive/pick';
import type { AttemptRecord, SkillState, Status } from '../adaptive/state';
import type { SkillId } from '../skills/curriculum';
import type { Level, Problem } from '../skills/types';
import type { DB } from './db';

export type SessionKind = 'placement' | 'adaptive' | 'practice';
export type Phase = 'question' | 'feedback' | 'done';
export type ApiMessage = Anthropic.MessageParam;

export interface CurrentProblem {
	problem: Problem;
	isRetry: boolean;
}

export interface Feedback {
	attemptId: number;
	correct: boolean;
	given: string;
	answerText: string;
	isRetry: boolean;
	tutorAllowed: boolean;
	nextLabel: 'Prøv en lignende' | 'Næste';
}

export interface SessionRow {
	id: number;
	kind: SessionKind;
	skillId: SkillId | null;
	targetCount: number;
	pickedCount: number;
	phase: Phase;
	current: CurrentProblem | null;
	feedback: Feedback | null;
	retryPending: boolean;
	startedAt: string;
	endedAt: string | null;
}

export interface SessionPatch {
	pickedCount?: number;
	phase?: Phase;
	current?: CurrentProblem | null;
	feedback?: Feedback | null;
	retryPending?: boolean;
	endedAt?: string | null;
}

export interface AttemptRow {
	id: number;
	sessionId: number;
	skillId: SkillId;
	level: Level;
	seed: number;
	problem: Problem;
	givenAnswer: string;
	correct: boolean;
	isRetry: boolean;
	createdAt: string;
}
export type NewAttempt = Omit<AttemptRow, 'id'>;

export interface ConversationRow {
	id: number;
	attemptId: number;
	apiMessages: ApiMessage[];
	flagged: boolean;
	flagReason: string | null;
	createdAt: string;
	closedAt: string | null;
}

export interface ConversationSummary extends ConversationRow {
	skillId: SkillId;
	problem: Problem;
	givenAnswer: string;
	firstReply: string | null;
}

export interface MessageRow {
	id: number;
	conversationId: number;
	role: 'student' | 'tutor';
	content: string;
	inputTokens: number;
	outputTokens: number;
	cacheWriteTokens: number;
	cacheReadTokens: number;
	createdAt: string;
}
export type NewMessage = Omit<MessageRow, 'id'>;

export interface UsageRow {
	createdAt: string;
	inputTokens: number;
	outputTokens: number;
	cacheWriteTokens: number;
	cacheReadTokens: number;
}

// ── sessions ────────────────────────────────────────────────────────────────

interface SessionDbRow {
	id: number;
	kind: SessionKind;
	skill_id: SkillId | null;
	target_count: number;
	picked_count: number;
	phase: Phase;
	current_json: string | null;
	feedback_json: string | null;
	retry_pending: number;
	started_at: string;
	ended_at: string | null;
}

const toSession = (r: SessionDbRow): SessionRow => ({
	id: r.id,
	kind: r.kind,
	skillId: r.skill_id,
	targetCount: r.target_count,
	pickedCount: r.picked_count,
	phase: r.phase,
	current: r.current_json ? JSON.parse(r.current_json) : null,
	feedback: r.feedback_json ? JSON.parse(r.feedback_json) : null,
	retryPending: r.retry_pending === 1,
	startedAt: r.started_at,
	endedAt: r.ended_at
});

export function createSession(
	db: DB,
	kind: SessionKind,
	skillId: SkillId | null,
	targetCount: number,
	now: Date
): number {
	const result = db
		.prepare('INSERT INTO sessions (kind, skill_id, target_count, started_at) VALUES (?, ?, ?, ?)')
		.run(kind, skillId, targetCount, now.toISOString());
	return Number(result.lastInsertRowid);
}

export function getSession(db: DB, id: number): SessionRow | undefined {
	const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionDbRow | undefined;
	return row && toSession(row);
}

export function updateSession(db: DB, id: number, patch: SessionPatch): void {
	const columns: string[] = [];
	const values: unknown[] = [];
	const set = (column: string, value: unknown) => {
		columns.push(`${column} = ?`);
		values.push(value);
	};
	if (patch.pickedCount !== undefined) set('picked_count', patch.pickedCount);
	if (patch.phase !== undefined) set('phase', patch.phase);
	if (patch.current !== undefined) set('current_json', patch.current && JSON.stringify(patch.current));
	if (patch.feedback !== undefined) set('feedback_json', patch.feedback && JSON.stringify(patch.feedback));
	if (patch.retryPending !== undefined) set('retry_pending', patch.retryPending ? 1 : 0);
	if (patch.endedAt !== undefined) set('ended_at', patch.endedAt);
	if (columns.length === 0) return;
	db.prepare(`UPDATE sessions SET ${columns.join(', ')} WHERE id = ?`).run(...values, id);
}

// ── attempts ────────────────────────────────────────────────────────────────

interface AttemptDbRow {
	id: number;
	session_id: number;
	skill_id: SkillId;
	level: Level;
	seed: number;
	problem_json: string;
	given_answer: string;
	correct: number;
	is_retry: number;
	created_at: string;
}

const toAttempt = (r: AttemptDbRow): AttemptRow => ({
	id: r.id,
	sessionId: r.session_id,
	skillId: r.skill_id,
	level: r.level,
	seed: r.seed,
	problem: JSON.parse(r.problem_json),
	givenAnswer: r.given_answer,
	correct: r.correct === 1,
	isRetry: r.is_retry === 1,
	createdAt: r.created_at
});

export const toRecord = (a: AttemptRow): AttemptRecord => ({ correct: a.correct, at: a.createdAt });

export function insertAttempt(db: DB, a: NewAttempt): number {
	const result = db
		.prepare(
			`INSERT INTO attempts (session_id, skill_id, level, seed, problem_json, given_answer, correct, is_retry, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			a.sessionId,
			a.skillId,
			a.level,
			a.seed,
			JSON.stringify(a.problem),
			a.givenAnswer,
			a.correct ? 1 : 0,
			a.isRetry ? 1 : 0,
			a.createdAt
		);
	return Number(result.lastInsertRowid);
}

export function getAttempt(db: DB, id: number): AttemptRow | undefined {
	const row = db.prepare('SELECT * FROM attempts WHERE id = ?').get(id) as AttemptDbRow | undefined;
	return row && toAttempt(row);
}

function attempts(db: DB, sql: string, ...params: unknown[]): AttemptRow[] {
	return (db.prepare(sql).all(...params) as AttemptDbRow[]).map(toAttempt);
}

export const attemptsForSkill = (db: DB, skillId: SkillId) =>
	attempts(db, 'SELECT * FROM attempts WHERE skill_id = ? ORDER BY id', skillId);

export const sessionAttempts = (db: DB, sessionId: number) =>
	attempts(db, 'SELECT * FROM attempts WHERE session_id = ? ORDER BY id', sessionId);

export const allAttempts = (db: DB) => attempts(db, 'SELECT * FROM attempts ORDER BY id');

/** Wrong answers on a skill before a given attempt, newest first. */
export const recentWrongAttempts = (db: DB, skillId: SkillId, beforeId: number, limit: number) =>
	attempts(
		db,
		'SELECT * FROM attempts WHERE skill_id = ? AND correct = 0 AND id < ? ORDER BY id DESC LIMIT ?',
		skillId,
		beforeId,
		limit
	);

export const recentAttemptsForSkill = (db: DB, skillId: SkillId, limit: number) =>
	attempts(db, 'SELECT * FROM attempts WHERE skill_id = ? ORDER BY id DESC LIMIT ?', skillId, limit);

// ── skill state ─────────────────────────────────────────────────────────────

interface SkillStateDbRow {
	skill_id: SkillId;
	strength: number;
	level: Level;
	status: Status;
	interval_index: number;
	next_review_at: string | null;
	attempt_count: number;
	last_attempt_at: string | null;
}

export function saveSkillState(db: DB, s: SkillState): void {
	db.prepare(
		`INSERT INTO skill_state (skill_id, strength, level, status, interval_index, next_review_at, attempt_count, last_attempt_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		 ON CONFLICT (skill_id) DO UPDATE SET
		   strength = excluded.strength, level = excluded.level, status = excluded.status,
		   interval_index = excluded.interval_index, next_review_at = excluded.next_review_at,
		   attempt_count = excluded.attempt_count, last_attempt_at = excluded.last_attempt_at`
	).run(s.skillId, s.strength, s.level, s.status, s.intervalIndex, s.nextReviewAt, s.attemptCount, s.lastAttemptAt);
}

export function loadSkillStates(db: DB): SkillStates {
	const rows = db.prepare('SELECT * FROM skill_state').all() as SkillStateDbRow[];
	const partial: Partial<SkillStates> = {};
	for (const r of rows) {
		partial[r.skill_id] = {
			skillId: r.skill_id,
			strength: r.strength,
			level: r.level,
			status: r.status,
			intervalIndex: r.interval_index,
			nextReviewAt: r.next_review_at,
			attemptCount: r.attempt_count,
			lastAttemptAt: r.last_attempt_at
		};
	}
	return fillStates(partial);
}

// ── tutor ───────────────────────────────────────────────────────────────────

interface ConversationDbRow {
	id: number;
	attempt_id: number;
	api_messages_json: string;
	flagged: number;
	flag_reason: string | null;
	created_at: string;
	closed_at: string | null;
}

const toConversation = (r: ConversationDbRow): ConversationRow => ({
	id: r.id,
	attemptId: r.attempt_id,
	apiMessages: JSON.parse(r.api_messages_json),
	flagged: r.flagged === 1,
	flagReason: r.flag_reason,
	createdAt: r.created_at,
	closedAt: r.closed_at
});

/** Null when the attempt already has a conversation. */
export function createConversation(
	db: DB,
	attemptId: number,
	apiMessages: ApiMessage[],
	now: Date
): ConversationRow | null {
	const row = db
		.prepare(
			`INSERT INTO tutor_conversations (attempt_id, api_messages_json, created_at) VALUES (?, ?, ?)
			 ON CONFLICT (attempt_id) DO NOTHING RETURNING *`
		)
		.get(attemptId, JSON.stringify(apiMessages), now.toISOString()) as ConversationDbRow | undefined;
	return row ? toConversation(row) : null;
}

export function getConversation(db: DB, id: number): ConversationRow | undefined {
	const row = db.prepare('SELECT * FROM tutor_conversations WHERE id = ?').get(id) as ConversationDbRow | undefined;
	return row && toConversation(row);
}

export function getConversationByAttempt(db: DB, attemptId: number): ConversationRow | undefined {
	const row = db.prepare('SELECT * FROM tutor_conversations WHERE attempt_id = ?').get(attemptId) as
		| ConversationDbRow
		| undefined;
	return row && toConversation(row);
}

export function setApiMessages(db: DB, id: number, messages: ApiMessage[]): void {
	db.prepare('UPDATE tutor_conversations SET api_messages_json = ? WHERE id = ?').run(JSON.stringify(messages), id);
}

export function flagConversation(db: DB, id: number, reason: string): void {
	db.prepare('UPDATE tutor_conversations SET flagged = 1, flag_reason = ? WHERE id = ?').run(reason, id);
}

export function closeConversation(db: DB, id: number, now: Date): void {
	db.prepare('UPDATE tutor_conversations SET closed_at = ? WHERE id = ? AND closed_at IS NULL').run(
		now.toISOString(),
		id
	);
}

export function closeConversationsForSession(db: DB, sessionId: number, now: Date): void {
	db.prepare(
		`UPDATE tutor_conversations SET closed_at = ?
		 WHERE closed_at IS NULL AND attempt_id IN (SELECT id FROM attempts WHERE session_id = ?)`
	).run(now.toISOString(), sessionId);
}

interface MessageDbRow {
	id: number;
	conversation_id: number;
	role: 'student' | 'tutor';
	content: string;
	input_tokens: number;
	output_tokens: number;
	cache_write_tokens: number;
	cache_read_tokens: number;
	created_at: string;
}

const toMessage = (r: MessageDbRow): MessageRow => ({
	id: r.id,
	conversationId: r.conversation_id,
	role: r.role,
	content: r.content,
	inputTokens: r.input_tokens,
	outputTokens: r.output_tokens,
	cacheWriteTokens: r.cache_write_tokens,
	cacheReadTokens: r.cache_read_tokens,
	createdAt: r.created_at
});

export function addMessage(db: DB, m: NewMessage): number {
	const result = db
		.prepare(
			`INSERT INTO tutor_messages
			 (conversation_id, role, content, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens, created_at)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
		)
		.run(
			m.conversationId,
			m.role,
			m.content,
			m.inputTokens,
			m.outputTokens,
			m.cacheWriteTokens,
			m.cacheReadTokens,
			m.createdAt
		);
	return Number(result.lastInsertRowid);
}

export function listMessages(db: DB, conversationId: number): MessageRow[] {
	return (
		db.prepare('SELECT * FROM tutor_messages WHERE conversation_id = ? ORDER BY id').all(conversationId) as MessageDbRow[]
	).map(toMessage);
}

export function countStudentMessages(db: DB, conversationId: number): number {
	const row = db
		.prepare("SELECT COUNT(*) AS n FROM tutor_messages WHERE conversation_id = ? AND role = 'student'")
		.get(conversationId) as { n: number };
	return row.n;
}

/** Flagged first, then newest first. */
export function listConversations(db: DB): ConversationSummary[] {
	const rows = db
		.prepare(
			`SELECT c.*, a.skill_id, a.problem_json, a.given_answer,
			   (SELECT m.content FROM tutor_messages m
			    WHERE m.conversation_id = c.id AND m.role = 'tutor' ORDER BY m.id LIMIT 1) AS first_reply
			 FROM tutor_conversations c JOIN attempts a ON a.id = c.attempt_id
			 ORDER BY c.flagged DESC, c.id DESC`
		)
		.all() as (ConversationDbRow & {
		skill_id: SkillId;
		problem_json: string;
		given_answer: string;
		first_reply: string | null;
	})[];
	return rows.map((r) => ({
		...toConversation(r),
		skillId: r.skill_id,
		problem: JSON.parse(r.problem_json),
		givenAnswer: r.given_answer,
		firstReply: r.first_reply
	}));
}

export function countFlagged(db: DB): number {
	return (db.prepare('SELECT COUNT(*) AS n FROM tutor_conversations WHERE flagged = 1').get() as { n: number }).n;
}

/** Token usage of every tutor reply, for the monthly spend. */
export function allUsage(db: DB): UsageRow[] {
	return (
		db
			.prepare(
				`SELECT created_at, input_tokens, output_tokens, cache_write_tokens, cache_read_tokens
				 FROM tutor_messages WHERE role = 'tutor' ORDER BY id`
			)
			.all() as {
			created_at: string;
			input_tokens: number;
			output_tokens: number;
			cache_write_tokens: number;
			cache_read_tokens: number;
		}[]
	).map((r) => ({
		createdAt: r.created_at,
		inputTokens: r.input_tokens,
		outputTokens: r.output_tokens,
		cacheWriteTokens: r.cache_write_tokens,
		cacheReadTokens: r.cache_read_tokens
	}));
}
