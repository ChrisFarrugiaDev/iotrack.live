import { Server as ServerHttp } from "node:http";
import { Server as ServerHttps } from "node:https";

import express, { Express } from "express";



class App {
    // Hold the single instance of App
    private static _instance: App;

    public httpServer?: ServerHttp | ServerHttps;
    public expressApp: Express;



    private constructor() {
        this.expressApp = express();
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

    public start(httpPort = 80) {
        this.httpServer = this.expressApp.listen(httpPort, ()=>{
            console.log(`HTTP server listening on port ${httpPort}`)
        });
    }

    // -----------------------------------------------------------------

    public async gracefulShutdown() {
        console.log("Graceful shutdown initiated...");

        try {
            this.httpServer!.close(()=>{
                console.log("HTTP server closed.")
            });
            process.exit(0);

        } catch(err: unknown) {

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