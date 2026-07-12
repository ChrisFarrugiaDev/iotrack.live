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

type Coord = { latitude: number; longitude: number };

/**
 * Course over ground between two fixes, in degrees clockwise from north.
 *
 * Derived from the positions rather than the device's own heading field, which
 * depends on how the tracker happens to be mounted and is often wrong.
 */
export function bearingBetween(from: Coord, to: Coord): number | null {
    const rad = Math.PI / 180;

    const lat1 = from.latitude * rad;
    const lat2 = to.latitude * rad;
    const dLng = (to.longitude - from.longitude) * rad;

    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2)
        - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

    // Two fixes at the same spot have no direction of travel.
    if (y === 0 && x === 0) return null;

    return (Math.atan2(y, x) / rad + 360) % 360;
}
