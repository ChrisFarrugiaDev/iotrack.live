import { logger } from "./utils/logger.utils";
import { createRedisSubscriber } from "./utils/redis/subscriber";

class App {
    static _instance: App;
    private sub: ReturnType<typeof createRedisSubscriber> | null = null;

    private constructor() {
        logger.info("App instance created");
    }

    public static get instance(): App {
        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    }

    public async init() {

        this.sub = createRedisSubscriber((msg) => {
            // just console.log for now
            // console.log("[LIVE]", JSON.stringify(msg));


            // Step 1: decode base64 → UTF-8 string
            const jsonString = Buffer.from(msg, "base64").toString("utf8");
            console.log(jsonString)

            // In the next step:
            // if (msg.orgPath) msg.orgPath.split(',').forEach(id => sio.to(`org:${id}`).emit("li



            
        });

        logger.info("SocketIO Gateway initialized (Redis subscriber is running).");
    }

    public async gracefulShutdown() {

        logger.info("Graceful shutdown initiated...");
        try {
            if (this.sub) {
                try {
                    await this.sub?.unsubscribe();
                } catch {
                    // ignore
                }
                await this.sub.quit();
                logger.info("Redis subscriber closed.");
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