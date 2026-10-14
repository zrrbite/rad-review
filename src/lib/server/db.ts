// Opens the SQLite file and brings its schema up to date.

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { MIGRATIONS } from './migrations';

export type DB = Database.Database;

export function openDb(path: string): DB {
	if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });
	const db = new Database(path);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	const current = db.pragma('user_version', { simple: true }) as number;
	for (let version = current; version < MIGRATIONS.length; version++) {
		db.transaction(() => {
			db.exec(MIGRATIONS[version]);
			db.pragma(`user_version = ${version + 1}`);
		})();
	}
	return db;
}
