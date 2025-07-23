export function bigIntToString(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(bigIntToString);
    }
    if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val === 'bigint') {
                result[key] = val.toString();
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