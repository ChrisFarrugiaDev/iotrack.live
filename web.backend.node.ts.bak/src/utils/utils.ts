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

export function genPass(len=12, upper=true, nums=true, special=true) {
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const upperChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numChars = "0123456789";
    const specialChars = "!@#$%^&*()-_=+[]{}|;:,.<>?";
    let chars = lower;

    if (upper) chars += upperChars;
    if (nums) chars += numChars;
    if (special) chars += specialChars;

    let pass = "";
    for (let i = 0; i < len; i++) {
        const randIdx = Math.floor(Math.random() * chars.length);
        pass += chars[randIdx];
    }

    return pass;
}