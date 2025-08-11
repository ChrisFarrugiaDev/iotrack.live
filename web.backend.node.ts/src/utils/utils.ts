export function bigIntToString(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(bigIntToString);
    }
    if (obj instanceof Date) {
        return obj; // Keep Date objects as they are
    }
    if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'bigint') {
                result[key] = val.toString();
            } else if (val instanceof Date) {
                result[key] = val; // Preserve Date objects
            } else if (typeof val === 'object' && val !== null) {
                result[key] = bigIntToString(val);
            } else {
                result[key] = val;
            }
        }
        return result;
    }
    return obj;
}