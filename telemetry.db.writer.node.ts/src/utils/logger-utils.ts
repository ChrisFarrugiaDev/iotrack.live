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

const isDevelopment: boolean = Boolean(Number(process.env.DEV_LOGGER_ON));


function getLogDetails() {
    const stack = new Error().stack;
    const stackLines = stack?.split("\n")!;
    let relevantLine = stackLines[3] || stackLines[2] || stackLines[1];  // Adjust based on where the relevant call usually appears

    // Extract file path and line number
    const match = relevantLine.match(/\((.*?):(\d+):(\d+)\)/);
    if (!match) {
        return isDevelopment ? "- unknown location -" : `${formatDate(new Date())} - unknown location -`;
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
    const datePrefix = isDevelopment ? "" : `${formatDate(new Date())} `;
    return `${datePrefix}[${filePath}:${lineNumber}]`;
}

function formatDate(date: Date) {
    return date.toISOString().replace('T', ' ').slice(0, 19);  // Convert to YYYY-MM-DD HH:MM:SS
}

// ---------------------------------------------------------------------

export function logError(message:string, error: unknown = null) {
    const dateTime = formatDate(new Date()); // Get the current date and time
    console.error(`${dateTime} ${getLogDetails()} : ${message}\n`, error);
}

export function logInfo(message: string, col: string='reset') {
    console.log(`${colors[col]}${getLogDetails()} ${colors['reset']}:`, message);
    
}

export function logDev(message: string, col: string='blue') {
    if (isDevelopment) {
        console.log(`${colors[col]}DEV ${getLogDetails()} >${colors['reset']}`, message);        
    }
}