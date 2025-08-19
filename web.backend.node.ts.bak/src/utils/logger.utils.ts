import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------

// Terminal color codes for colored console output
const colors: Record<string, string> = {
    black: "\x1b[30m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
    cyan: "\x1b[36m",
    white: "\x1b[37m",
    reset: "\x1b[0m"  // Resets the color to default
}

// ---------------------------------------------------------------------

// Check if debug logging is enabled (set DEBUG=true)
const isDebug: boolean = process.env.DEBUG == 'true';

// Microservice name for log prefix, default if not set
const serviceName = process.env.MICROSERVICE_NAME || "unknown-service";

// Logging mode (console, file, or off)
let logMode = process.env.LOG_MODE as string;

// Log file path (for file mode)
let logFilePath = process.env.LOG_FILE_PATH as string;

// Normalize log mode to lowercase and set up defaults
if (['file', 'File', 'FILE'].includes(logMode)) {
    logMode = 'file';
} else if (['off', 'Off', 'OFF'].includes(logMode)) {
    logMode = 'off';
} else {
    logMode = 'console'; // Default to console
}

// If logging to file, ensure the log directory exists
if (logMode === 'file') {
    logFilePath = logFilePath || './logs/app.log';
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
}

// ---------------------------------------------------------------------

// Returns service name as log prefix
function getServicePrefix() {
    return `[${serviceName}]`;
}

// ---------------------------------------------------------------------

// Extracts file and line info from stack trace for log context
function getLogDetails() {
    const stack = new Error().stack;
    const stackLines = stack?.split("\n")!;
    // Find the relevant stack frame (usually the 3rd or 4th line)
    let relevantLine = stackLines[3] || stackLines[2] || stackLines[1];


    // Match and extract file path, line, and column (ignore function name)
    const match = relevantLine.match(/(?:\(|\s)(\/.*?):(\d+):(\d+)\)?$/);
    if (!match) {
        // If matching fails, return a fallback
        return isDebug ? "- unknown location -" : `${formatDate(new Date())} - unknown location -`;
    }

    let filePath = match[1];
    const lineNumber = match[2];

    // Use forward slashes for cross-platform compatibility
    filePath = filePath.replace(/\\/g, '/');

    // Try to strip '/src/' or '/dist/' if present
    let basePathIndex = filePath.indexOf('/src/');
    let r = 5;
    if (basePathIndex === -1) {
        basePathIndex = filePath.indexOf('/dist/');
        r = 6;
    }
    if (basePathIndex !== -1) {
        filePath = filePath.substring(basePathIndex + r);
    }
    // (Optional) To make even shorter: filePath = filePath.split('/').slice(-2).join('/');

    // Add date prefix only if not debugging
    const datePrefix = isDebug ? "" : `${formatDate(new Date())} `;
    return `${datePrefix}[${filePath}:${lineNumber}]`;
}

// ---------------------------------------------------------------------

// Formats date for log output (YYYY-MM-DD HH:MM:SS)
function formatDate(date: Date) {
    return date.toISOString().replace('T', ' ').slice(0, 19);
}

// Writes a log line to file (used when LOG_MODE=file)
function writeLogToFile(logLine: string) {
    if (logFilePath) {
        fs.appendFile(logFilePath, logLine + '\n', err => {
            if (err) {
                // Log file write errors to stderr, but avoid recursion
                console.error(`[LOGGER][FILE-ERROR] Failed to write log:`, err);
            }
        });
    }
}

// ---------------------------------------------------------------------

// Logs an error message (with optional error object)
export function logError(message: string, error: unknown = null) {
    const dateTime = formatDate(new Date());
    const logLine = `${getServicePrefix()} ERROR ${dateTime} ${getLogDetails()} : ${message}${error ? '\n' + String(error) : ''}`;
    switch (logMode) {
        case "file":
            writeLogToFile(logLine);
            break;
        case "off":
            break;
        default:
            console.error(logLine);
            break;
    }
}

// Logs an info message, optionally colored for console
export function logInfo(message: string, col: string = 'reset') {
    const logLine = `${getServicePrefix()} INFO ${getLogDetails()}: ${message}`;
    switch (logMode) {
        case "file":
            writeLogToFile(logLine);
            break;
        case "off":
            break;
        default:
            console.log(`${colors[col]}${logLine}${colors['reset']}`);
            break;
    }
}

// Logs a debug message (only if DEBUG=true), optionally colored
export function logDebug(message: string, col: string = 'blue') {
    if (isDebug) {
        const logLine = `${getServicePrefix()} DEBUG ${getLogDetails()}: ${message}`;
        switch (logMode) {
            case "file":
                writeLogToFile(logLine);
                break;
            case "off":
                break;
            default:
                console.log(`${colors[col]}${logLine}${colors['reset']}`);
                break;
        }
    }
}
