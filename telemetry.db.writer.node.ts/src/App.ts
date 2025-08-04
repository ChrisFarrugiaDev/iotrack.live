import _env from "./config/env.config";
import fs from 'fs/promises';
import { ConsumerConfig, RabbitBatchConsumer } from './rabbitmq/consumer';
import { logError, logInfo } from './utils/logger-utils';
import redis from "./config/redis.config";


class App {

    private static _instance: App;
    private consumer?: RabbitBatchConsumer;

    // -----------------------------------------------------------------

    private constructor() {
        logInfo("App instance created");
    }

    // -----------------------------------------------------------------

    public static get instance(): App {
        if (!App._instance) {
            App._instance = new App();
        }
        return App._instance;
    }

    // -----------------------------------------------------------------

    public async init() {

        try {
            const configData = await fs.readFile('./rabbitmq_config.json', 'utf8');
            const config: ConsumerConfig = JSON.parse(configData);


            config.url = `amqp://${_env.RABBITMQ_USER}:${_env.RABBITMQ_PASSWORD}@${_env.RABBITMQ_HOST}:${_env.RABBITMQ_PORT}/`;

            this.consumer = new RabbitBatchConsumer(config);
            await this.consumer.start();

        } catch (err) {
            logError("! App.init !", err)
        }
    }

    // -----------------------------------------------------------------

    public async gracefulShutdown() {

        logInfo("Graceful shutdown initiated...");

        try {
            // Close the RabbitMQ consumer/channel/connection if present
            if (this.consumer && typeof this.consumer.close === 'function') {
                await this.consumer.close();
                logInfo("RabbitMQ consumer closed.");
            }

            // Clean up Redis
            try {
                await redis.quit();
                logInfo("Redis connection closed.");
            } catch (err) {
                logError("Error closing Redis", err);
            }

            process.exit(0);

        } catch (err: unknown) {
            if (err instanceof Error) {
                logError("Error during shutdown", err.message)
            } else {
                logError("Non-Error thrown during shutdown", err);
            }

            process.exit(1);
        }
    }
}

// ---------------------------------------------------------------------
// Export the singleton instance
export default App.instance