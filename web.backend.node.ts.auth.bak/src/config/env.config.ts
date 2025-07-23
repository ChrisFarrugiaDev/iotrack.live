import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Only load .env files if NOT running in Docker
if (!process.env.DOCKERIZED) {
    // Choose env file based on NODE_ENV
    const envFileName = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
    const envPath = path.join(__dirname, "..", "..", envFileName);

    if (!fs.existsSync(envPath)) {
        console.warn("[envConfig] WARNING: Env file does not exist at:", envPath);
    } else {
        dotenv.config({ path: envPath });
    }
}

// Always set timezone
process.env.TZ = "UTC";

// Export all processed env variables
export default process.env;