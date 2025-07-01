import { Server as ServerHttp } from "node:http";
import { Server as ServerHttps } from "node:https";

import express, { Express } from "express";
import cors from "cors";
import router from "./api/routes";
import { logError } from "./utils/logger-utils";


class App {
    // Hold the single instance of App
    private static _instance: App;

    public httpServer?: ServerHttp | ServerHttps;
    public expressApp: Express;

    private constructor() {
        this.expressApp = express();
        this.initializeSingleton();
        console.log("App instance created")
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
    initializeSingleton() {
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
        this.expressApp.use('/teltonika-parser', router);
    }
    // -----------------------------------------------------------------

    public init(httpPort = 80) {
        try {
            this.httpServer = this.expressApp.listen(httpPort, () => {
                console.log(`HTTP server listening on port ${httpPort}`)
            });
        } catch (err) {
            logError("! App.init !", err)
        }

    }

    // -----------------------------------------------------------------

    public async gracefulShutdown() {
        console.log("Graceful shutdown initiated...");

        try {
            this.httpServer!.close(() => {
                console.log("HTTP server closed.")
            });
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