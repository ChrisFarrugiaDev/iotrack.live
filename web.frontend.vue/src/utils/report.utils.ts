// Display formatting for the Activity Report.
// The data stays raw — metres and km/h — and is only formatted here (§22).

/** 8820 -> "2h 27m". Always shows minutes so short periods stay readable. */
export function formatDuration(seconds: number): string {
    if (!seconds) return '0m';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);

    if (hours && minutes) return `${hours}h ${minutes}m`;
    if (hours) return `${hours}h`;

    return `${minutes}m`;
}

/** 12400 -> "12.4 km"; below a kilometre stays in metres. */
export function formatDistance(meters: number): string {
    if (meters < 1000) return `${Math.round(meters)} m`;

    return `${(meters / 1000).toFixed(1)} km`;
}

export function formatSpeed(kph: number | null): string {
    if (kph === null) return '—';

    return `${Math.round(kph)} km/h`;
}

/** Clock time in the report's timezone, e.g. "07:03". */
export function formatTime(iso: string, timeZone: string): string {
    return new Date(iso).toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
    });
}

/** Date and clock time, e.g. "12 Jul 07:03". */
export function formatDateTime(iso: string, timeZone: string): string {
    return new Date(iso).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone,
    });
}

export function formatCoords(latitude: number, longitude: number): string {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}
