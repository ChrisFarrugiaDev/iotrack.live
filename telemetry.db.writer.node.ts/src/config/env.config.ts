import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Define the environment file based on NODE_ENV
const envFileName = process.env.NODE_ENV === "production" ? ".env" : ".env.development";
const envPath = path.join(__dirname, "..", "..", envFileName);

if (!fs.existsSync(envPath)) {
    console.warn("[envConfig] WARNING: Env file does not exist at:", envPath);
}

// Configure dotenv
dotenv.config({path: envPath});

// Set the timezone to UTC globally for the application, regardless of the system's local timezone
process.env.TZ = "UTC";

// Export the processed environment variables
export default process.env