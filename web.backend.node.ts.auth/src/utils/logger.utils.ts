import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------

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

// ---------------------------------------------------------------------

const isDevelopment: boolean = process.env.NODE_ENV != 'production';
const serviceName = process.env.MICROSERVICE_NAME || "unknown-service";

const logMode = process.env.LOG_MODE || "default";
const logFilePath = process.env.LOG_FILE_PATH || './logs/app.log';

if (logMode == 'file') {
    // Ensure log directory exists
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}
// ---------------------------------------------------------------------

function writeLogToFile(logLine: string) {

    fs.appendFile(logFilePath, logLine + '\n', err => {
        if (err) {
            // If file writing fails, log to stderr (but avoid infinite loop)
            console.error(`[LOGGER][FILE-ERROR] Failed to write log:`, err);
        }
    });
}

// Use this wherever you build your log string:
function getServicePrefix() {
    return `[${serviceName}]`;
}

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

export function logError(message: string, error: unknown = null) {
    const dateTime = formatDate(new Date()); // Get the current date and time
    const logLine = `${getServicePrefix()} ${dateTime} ${getLogDetails()} : ${message}${error ? '\n' + String(error) : ''}`;
    if (logMode == 'file') {
        writeLogToFile(logLine);
    } else if (logMode == 'default') {
        console.error(logLine);
    }
}

export function logInfo(message: string, col: string = 'reset') {
    const logLine = `${getServicePrefix()} ${getLogDetails()}: ${message}`;
    if (logMode == 'file') {
        writeLogToFile(logLine);
    } else if (logMode == 'default') {
        console.log(`${colors[col]}${logLine}${colors['reset']}`);
    }
}

export function logDebug(message: string, col: string = 'blue') {
    if (isDevelopment) {
        const logLine = `${getServicePrefix()} DEV ${getLogDetails()} > ${message}`;
        if (logMode == 'file') {
            writeLogToFile(logLine);
        } else if (logMode == 'default') {
            console.log(`${colors[col]}${logLine}${colors['reset']}`);
        }
    }
}