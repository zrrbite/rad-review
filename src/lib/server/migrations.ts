// The schema, one SQL string per version. Append new versions; never edit old ones.

export const MIGRATIONS: readonly string[] = [
	`
CREATE TABLE sessions (
	id INTEGER PRIMARY KEY,
	kind TEXT NOT NULL CHECK (kind IN ('placement', 'adaptive', 'practice')),
	skill_id TEXT,
	target_count INTEGER NOT NULL,
	picked_count INTEGER NOT NULL DEFAULT 0,
	phase TEXT NOT NULL DEFAULT 'question' CHECK (phase IN ('question', 'feedback', 'done')),
	current_json TEXT,
	feedback_json TEXT,
	retry_pending INTEGER NOT NULL DEFAULT 0,
	started_at TEXT NOT NULL,
	ended_at TEXT
);

CREATE TABLE attempts (
	id INTEGER PRIMARY KEY,
	session_id INTEGER NOT NULL REFERENCES sessions(id),
	skill_id TEXT NOT NULL,
	level INTEGER NOT NULL,
	seed INTEGER NOT NULL,
	problem_json TEXT NOT NULL,
	given_answer TEXT NOT NULL,
	correct INTEGER NOT NULL,
	is_retry INTEGER NOT NULL,
	created_at TEXT NOT NULL
);
CREATE INDEX attempts_by_skill ON attempts (skill_id, id);
CREATE INDEX attempts_by_session ON attempts (session_id, id);

CREATE TABLE skill_state (
	skill_id TEXT PRIMARY KEY,
	strength REAL NOT NULL,
	level INTEGER NOT NULL,
	status TEXT NOT NULL,
	interval_index INTEGER NOT NULL,
	next_review_at TEXT,
	attempt_count INTEGER NOT NULL,
	last_attempt_at TEXT
);

CREATE TABLE tutor_conversations (
	id INTEGER PRIMARY KEY,
	attempt_id INTEGER NOT NULL UNIQUE REFERENCES attempts(id),
	api_messages_json TEXT NOT NULL,
	flagged INTEGER NOT NULL DEFAULT 0,
	flag_reason TEXT,
	created_at TEXT NOT NULL,
	closed_at TEXT
);

CREATE TABLE tutor_messages (
	id INTEGER PRIMARY KEY,
	conversation_id INTEGER NOT NULL REFERENCES tutor_conversations(id),
	role TEXT NOT NULL CHECK (role IN ('student', 'tutor')),
	content TEXT NOT NULL,
	input_tokens INTEGER NOT NULL DEFAULT 0,
	output_tokens INTEGER NOT NULL DEFAULT 0,
	cache_write_tokens INTEGER NOT NULL DEFAULT 0,
	cache_read_tokens INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL
);
CREATE INDEX tutor_messages_by_conversation ON tutor_messages (conversation_id, id);
`
];
