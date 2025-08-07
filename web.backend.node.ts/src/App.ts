import { Server as ServerHttp } from "node:http";
import { Server as ServerHttps } from "node:https";

import express, { Express } from "express";
import cors from "cors";
import router from "./api/routers";
import { logError, logInfo } from "./utils/logger.utils";
import { cacheAllOrganisationsToRedis } from "./services/organisation-cache.service";
import redis from "./config/redis.config";
import prisma from "./config/prisma.config";



class App {
    // Hold the single instance of App
    private static _instance: App;

    public httpServer?: ServerHttp | ServerHttps;
    public expressApp: Express;

    private constructor() {
        this.expressApp = express();
        this.initializeSingleton();
        logInfo("App instance created")
    }

    // -----------------------------------------------------------------

    // Static getter to access the singleton instance
    public static get instance(): App {

        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    }

    // -----------------------------------------------------------------

    // Central method to organize all initialization functions
    async initializeSingleton() {
        await this.runStartupTasks()
        // this.setupAppDependencies();
        // this.initializeDatabaseConnections();
        this.initializeMiddleware();
        this.initializeRoutes();
        // this.scheduleCronTasks();
    }

    // -----------------------------------------------------------------

    // initializeMiddleware - initialize middleware for parsing request bodies
    initializeMiddleware() {
        this.expressApp.use(cors());
        this.expressApp.use(express.urlencoded({ extended: false }));          // Middleware for URL-encoded data
        this.expressApp.use(express.json());                                   // Middleware for JSON data
    }

    // -----------------------------------------------------------------


    // initializeRoutes - initialize and attach routers
    initializeRoutes() {
        this.expressApp.use('/api', router);
    }

    // -----------------------------------------------------------------

    public init(httpPort = 80) {
        try {
            this.httpServer = this.expressApp.listen(httpPort, () => {
                logInfo(`HTTP server listening on port ${httpPort}`)
            });
        } catch (err) {
            logError("! App.init !", err)
        }
    }

    // -----------------------------------------------------------------

    async runStartupTasks(): Promise<void> {
        await cacheAllOrganisationsToRedis();

        this.startIntervalTasks();
    }

    startIntervalTasks(): void {
        setInterval( async()=>{
            await cacheAllOrganisationsToRedis();
        }, 1000 * 60 * 10)
    }

    registerCronJobs(): void { }

    // -----------------------------------------------------------------

    public async gracefulShutdown() {
        logInfo("Graceful shutdown initiated...");

        try {
            // Close HTTP server
            this.httpServer?.close(() => {
                logInfo("HTTP server closed.");
            });

            // Clean up Redis
            try {
                await redis.quit();
                logInfo("Redis connection closed.");
            } catch (err) {
                logError("Error closing Redis", err);
            }

            // Clean up Prisma (optional)
            try {
                await prisma.$disconnect();
                logInfo("Prisma disconnected.");
            } catch (err) {
                logError("Error disconnecting Prisma", err);
            }
            process.exit(0);

        } catch (err: unknown) {

            if (err instanceof Error) {
                console.error("Error during shutdown:", err.message)
            } else {
                console.error("Non-Error thrown during shutdown:", err);
            }

            process.exit(1);
        }
    }
}

// ---------------------------------------------------------------------
// Export the singleton instance
export default App.instance