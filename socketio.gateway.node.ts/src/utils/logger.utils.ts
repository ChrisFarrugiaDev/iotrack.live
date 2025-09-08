// utils/logger.utils.ts
import pino from "pino";
import fs from "fs";

// ------------- ENV CONFIG -----------------
const LOG_MODE = process.env.LOG_MODE || "console"; // "console", "file", "off"
const LOG_FILE_PATH = process.env.LOG_FILE_PATH || "./logs/app.log";
const DEBUG = process.env.DEBUG === "true";
const LOG_LEVEL = DEBUG ? "debug" : (process.env.LOG_LEVEL || "info");

// ------------ PINO DESTINATION ------------
let destination: pino.DestinationStream;

if (LOG_MODE === "file") {
  // Ensure log directory exists
  fs.mkdirSync(require("path").dirname(LOG_FILE_PATH), { recursive: true });
  destination = pino.destination({ dest: LOG_FILE_PATH, sync: false });

} else if (LOG_MODE === "off") {
  // Send logs nowhere
  destination = pino.destination({ dest: "/dev/null", sync: false });
  
} else {
  // Pretty-print in dev, json in prod
  destination = pino.transport({
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:standard",
      ignore: "pid,hostname",
      levelFirst: true,
    },
  }) as unknown as pino.DestinationStream;
}

// ------------ PINO LOGGER INIT ------------
export const logger = pino(
  {
    level: LOG_LEVEL,
    base: { service: process.env.MICROSERVICE_NAME || "unknown-service" },
    // Add timestamp, or customize fields if you want
  },
  destination
);

// ------------ SHORTCUTS (optional) -----------
export const logInfo = (msg: string, ...args: any[]) => logger.info(msg, ...args);
export const logError = (msg: string, ...args: any[]) => logger.error(msg, ...args);
export const logDebug = (msg: string, ...args: any[]) => logger.debug(msg, ...args);

