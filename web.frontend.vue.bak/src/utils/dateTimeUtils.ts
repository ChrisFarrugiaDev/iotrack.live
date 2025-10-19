
// Calculates and returns a human-readable string describing the elapsed time since a given UTC date
// Accepts ISO string, Date, ms or seconds epoch. Optional "nowMs" for testing/ticking.
export function timeElapsed(
	input: string | number | Date,
	nowMs: number = Date.now()
): string {
	// Normalize input -> milliseconds
	let eventMs: number;
	if (input instanceof Date) {
		eventMs = input.getTime();
	} else if (typeof input === 'number') {
		// If it looks like seconds, convert to ms
		eventMs = input > 1e12 ? input : input * 1000;
	} else {
		eventMs = Date.parse(input); // ISO/UTC string
	}

	if (Number.isNaN(eventMs)) return '—';

	const diffMs = nowMs - eventMs;

	// Handle clock drift / future timestamps
	if (diffMs < 0) {
		// small negative: treat as "just now"; large negative: unsynced
		return diffMs > -60_000 ? 'A few seconds ago' : 'Unsynced';
	}

	const seconds = Math.floor(diffMs / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);
	const weeks = Math.floor(days / 7);
	const years = Math.floor(days / 365);

	const remMins = minutes % 60;
	const remHours = hours % 24;
	const remDays = days % 7;
	const remWeeks = weeks % 52;

	if (seconds < 60) {
		return 'A few seconds ago';
	} else if (minutes < 60) {
		return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
	} else if (hours < 24) {
		return `${hours} hour${hours !== 1 ? 's' : ''}, ${remMins} minute${remMins !== 1 ? 's' : ''} ago`;
	} else if (days < 7) {
		return `${days} day${days !== 1 ? 's' : ''}, ${remHours} hour${remHours !== 1 ? 's' : ''} ago`;
	} else if (weeks < 52) {
		return `${weeks} week${weeks !== 1 ? 's' : ''}, ${remDays} day${remDays !== 1 ? 's' : ''} ago`;
	} else {
		return `${years} year${years !== 1 ? 's' : ''}, ${remWeeks} week${remWeeks !== 1 ? 's' : ''} ago`;
	}
}




export function formatDateTime(
  utcDateString: string,
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone
): string {
  const parsed = new Date(utcDateString);
  if (Number.isNaN(parsed.getTime())) return ""; // bad date -> empty

  // Build with formatToParts so we control the exact shape
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(parsed);

  const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
  // Ensure zero-padded minutes, just in case
  const minute = (map.minute ?? "").padStart(2, "0");

  return `${map.month} ${map.day}, ${map.year} ${map.hour}:${minute} ${map.dayPeriod}`;
}