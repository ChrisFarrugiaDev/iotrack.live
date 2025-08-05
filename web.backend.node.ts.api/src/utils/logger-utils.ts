const colors: Record<string, string> = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m"  // This resets the color to default
}

const isDebug: boolean = process.env.DEBUG == 'true';
const serviceName = process.env.MICROSERVICE_NAME || "unknown-service";

// Use this wherever you build your log string:
function getServicePrefix() {
    return `[${serviceName}]`;
}

function getLogDetails() {
    const stack = new Error().stack;
    const stackLines = stack?.split("\n")!;
    let relevantLine = stackLines[3] || stackLines[2] || stackLines[1];  // Adjust based on where the relevant call usually appears

    // Matches: "at functionName (filePath:line:col)" or "at filePath:line:col"
    const match = relevantLine.match(/\(?(.+?):(\d+):(\d+)\)?/);  
    if (!match) {
        return isDebug ? "- unknown location -" : `${formatDate(new Date())} - unknown location -`;
    }

    let filePath = match[1];
    const lineNumber = match[2];

    // Normalize Windows file paths to Unix-style paths
    filePath = filePath.replace(/\\/g, '/');
    // Make the path relative to the src directory
    const basePathIndex = filePath.indexOf('/src/');
    if (basePathIndex !== -1) {
        filePath = filePath.substring(basePathIndex + 1);
    }

    // Include the date in the log details only if it's not in development
    const datePrefix = isDebug ? "" : `${formatDate(new Date())} `;
    return `${datePrefix}[${filePath}:${lineNumber}]`;
}

function formatDate(date: Date) {
    return date.toISOString().replace('T', ' ').slice(0, 19);  // Convert to YYYY-MM-DD HH:MM:SS
}

// ---------------------------------------------------------------------

export function logError(message:string, error: unknown = null) {
    const dateTime = formatDate(new Date()); // Get the current date and time
    console.error(`${getServicePrefix()} ${dateTime} ${getLogDetails()} : ${message}\n`, error);
}

export function logInfo(message: string, col: string='reset') {
    console.log(`${getServicePrefix()} ${colors[col]}${getLogDetails()} ${colors['reset']}:`, message);
    
}

export function logDebug(message: string, col: string='blue') {
    if (isDebug) {
        console.log(`${getServicePrefix()} ${colors[col]}DEBUG ${getLogDetails()} >${colors['reset']}`, message);        
    }
}