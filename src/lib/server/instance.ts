// The one database connection this process uses.

import { getConfig } from './config';
import { openDb, type DB } from './db';

let db: DB | null = null;

export function getDb(): DB {
	if (!db) db = openDb(getConfig().databasePath);
	return db;
}
