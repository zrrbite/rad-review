// Calendar questions in Copenhagen time: which day, week and month an instant
// belongs to. Stored times are UTC; she lives in Denmark.

const ZONE = 'Europe/Copenhagen';
const ISO_DATE = new Intl.DateTimeFormat('en-CA', {
	timeZone: ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});
const DANISH_DAY = new Intl.DateTimeFormat('da-DK', { timeZone: ZONE, day: 'numeric', month: 'short' });
const DANISH_DATE_TIME = new Intl.DateTimeFormat('da-DK', {
	timeZone: ZONE,
	day: 'numeric',
	month: 'short',
	hour: '2-digit',
	minute: '2-digit'
});

const asDate = (at: Date | string) => (typeof at === 'string' ? new Date(at) : at);

/** "2026-10-13": the Copenhagen calendar date. */
export function localDate(at: Date | string): string {
	return ISO_DATE.format(asDate(at));
}

/** "2026-10". */
export function localMonth(at: Date | string): string {
	return localDate(at).slice(0, 7);
}

export function addDays(date: string, days: number): string {
	const d = new Date(`${date}T00:00:00Z`);
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
}

/** The Monday of the Copenhagen week that `at` falls in. */
export function weekStart(at: Date | string): string {
	const date = localDate(at);
	const weekday = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
	return addDays(date, -weekday);
}

export function formatDanishDay(at: Date | string): string {
	return DANISH_DAY.format(asDate(at));
}

export function formatDanishDateTime(at: Date | string): string {
	return DANISH_DATE_TIME.format(asDate(at));
}
