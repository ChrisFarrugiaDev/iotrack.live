import Fastify, { FastifyInstance } from "fastify";
import fastifyCors from "@fastify/cors";
import router from "./api/routers";
import { logger } from "./utils/logger.utils"; // Uses your Pino instance
import { cacheAllOrganisationsToRedis } from "./services/organisation-cache.service";
import redis from "./config/redis.config";
import prisma from "./config/prisma.config";

// ---------------------------------------------------------------------

class App {
    // Hold the single instance of App
    private static _instance: App;

    public fastify!: FastifyInstance;

    private constructor() {
        // Create Fastify instance with logger
        this.fastify = Fastify({
            logger: {
                transport: {
                    target: "pino-pretty",
                    options: {
                        colorize: true,
                        translateTime: "SYS:standard",
                        ignore: "pid,hostname",
                        singleLine: false,
                    },
                },
                level: 'warn', // 'debug' for more, 'warn' for less
            }
        });
        logger.info("App instance created");
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
        await this.runStartupTasks();
        await this.initializeMiddleware();
        await this.initializeRoutes();
    }

    // -----------------------------------------------------------------

    // initializeMiddleware - register CORS and other plugins for Fastify
    async initializeMiddleware() {
        await this.fastify.register(fastifyCors, {
            origin: true,
            methods : ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true, // only if you use cookies/sessions
            maxAge: 86400,     // cache preflight 24h
        });
        // Fastify handles JSON and URL-encoded body parsing natively
    }

    // -----------------------------------------------------------------

    // initializeRoutes - register routers using Fastify's plugin system
    async initializeRoutes() {
        await this.fastify.register(router, { prefix: "/api" });
    }

    // -----------------------------------------------------------------

    // Start Fastify server on the given port
    public async init(httpPort = 80) {
        await this.initializeSingleton();
        try {
            await this.fastify.listen({ port: httpPort, host: "0.0.0.0" });
            logger.info(`HTTP server listening on port ${httpPort}`);
        } catch (err) {
            logger.error({ err }, "! App.init !");
            process.exit(1);
        }
    }

    // -----------------------------------------------------------------

    // Run any startup logic before serving requests
    async runStartupTasks(): Promise<void> {
        await cacheAllOrganisationsToRedis();
        this.startIntervalTasks();
    }

    // -----------------------------------------------------------------

    // startIntervalTasks - schedule regular background jobs (e.g. cache updates)
    startIntervalTasks(): void {
        setInterval(async () => {
            await cacheAllOrganisationsToRedis();
        }, 1000 * 60 * 10);
    }

    // -----------------------------------------------------------------

    registerCronJobs(): void { }

    // -----------------------------------------------------------------

    // Graceful shutdown for Fastify, Redis, and Prisma
    public async gracefulShutdown() {
        logger.info("Graceful shutdown initiated...");

        try {
            await this.fastify.close();
            logger.info("Fastify server closed.");

            // Clean up Redis
            try {
                await redis.quit();
                logger.info("Redis connection closed.");
            } catch (err) {
                logger.error({ err }, "Error closing Redis");
            }

            // Clean up Prisma (optional)
            try {
                await prisma.$disconnect();
                logger.info("Prisma disconnected.");
            } catch (err) {
                logger.error({ err }, "Error disconnecting Prisma");
            }
            process.exit(0);

        } catch (err) {
            logger.error({ err }, "Error during shutdown");
            process.exit(1);
        }
    }
}

// ---------------------------------------------------------------------
// Export the singleton instance
export default App.instance;
