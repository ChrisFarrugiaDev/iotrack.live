import { logger } from "./utils/logger.utils";
import { createRedisSubscriber } from "./redis/subscriber";
import { createSocketIOServer } from "./socketio/server";

class App {
    static _instance: App;
    private sub: ReturnType<typeof createRedisSubscriber> | null = null;
    private sio?: ReturnType<typeof createSocketIOServer> | null = null;;

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
        // 1) Start Socket.IO
        const socketioPort = Number(process.env.SIO_PORT) || 4003
        this.sio = createSocketIOServer(socketioPort);
        

        // 2) Start Redis subscriber and forward to org rooms
        this.sub = createRedisSubscriber((msg) => {
            try {

                // Step 3: decode base64 → UTF-8 string
                const msgString = Buffer.from(msg, "base64").toString("utf8");
                const jsonMsg = JSON.parse(msgString)
                // console.log("->")
                // console.log(jsonMsg)

                // Accept device_id as string | number | bigint (anything else: skip)
                const rawDeviceID = jsonMsg?.device_id;

                // Make sure it's string/number/bigint, else return
                if (!this.sio) return;
                if (
                    typeof rawDeviceID !== "string" &&
                    typeof rawDeviceID !== "number" &&
                    typeof rawDeviceID !== "bigint"
                ) {
                    return;
                }

                // Convert to string, trim, and ensure it's not empty
                const deviceID = String(rawDeviceID).trim();
                if (deviceID.length < 1) return;


                // 4) Build payload 
                const payload: Record<string, any> = {
                    device_id: jsonMsg.device_id,
                    happened_at: jsonMsg.happened_at,
                    telemetry: jsonMsg.telemetry,
                };

   
                // 4) Emit to the device room
                this.sio.emitToDevice(deviceID, "live-update", payload);
            } catch (err) {
                logger.error({ err }, "Failed to parse/emit redis message");
            }

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

            if (this.sio) {
                this.sio.close();
                logger.info("Socket.IO closed.");
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