import amqp, { ChannelModel, Channel, ConsumeMessage } from "amqplib";
import { logError } from "../utils/logger-utils";

// ---------------------------------------------------------------------

type BatchSettings = {
    max_size: number;           // Max messages per batch
    max_wait_seconds: number;   // Max wait before flushing batch (seconds)
}

type QueueConfig = {
    name: string;
    durable: boolean;
    batch: BatchSettings;
};

export type ConsumerConfig = {
    url: string;
    reconnect_delay_seconds: number;
    queues: QueueConfig[];
};

// ---------------------------------------------------------------------

export class RabbitBatchConsumer {

    private connection!: ChannelModel;                                    // RabbitMQ connection
    private channel!: Channel;                                          // Channel for all queues

    private batches: Record<string, ConsumeMessage[]> = {};             // Message buffers per queue
    private timers: Record<string, NodeJS.Timeout> = {};                // Flush timers per queue

    private config: ConsumerConfig;
    private queueConfigs: QueueConfig[];

    // -----------------------------------------------------------------

    constructor(config: ConsumerConfig) {
        this.config = config;
        this.queueConfigs = config.queues;
    }

    // -----------------------------------------------------------------

    // Establish connection & channel; auto-reconnect on close
    private async connect() {
        this.connection = await amqp.connect(this.config.url)
        this.channel = await this.connection.createChannel();

        this.connection.on('close', async () => {
            logError("RabbitMQ connection closed. Reconnecting...");

            setTimeout(() => this.start(), this.config.reconnect_delay_seconds * 1000);

        });
    }

    // -----------------------------------------------------------------

    // Start connection and consumers for each queue
    async start() {

        await this.connect();

        for (const q of this.queueConfigs) {
            await this.setupQueue(q);
            this.consumeBatch(q);
        }
    }

    // -----------------------------------------------------------------

    private async setupQueue(q: QueueConfig) {
        await this.channel.assertQueue(q.name, { durable: q.durable });
        this.batches[q.name] = [];
    }

    // -----------------------------------------------------------------

    private consumeBatch(q: QueueConfig) {
        const { name, batch } = q;
        this.channel.consume(
            name,
            (msg) => {
                if (!msg) return;
                this.batches[name].push(msg);

                if (this.batches[name].length >= batch.max_size) {
                    // If batch full, process immediately
                    this.flushBatch(name, batch);

                } else if (this.batches[name].length === 1) {
                    // Start the timer for the first message in the batch
                    this.timers[name] = setTimeout(() => {
                        this.flushBatch(name, batch);
                    }, batch.max_wait_seconds * 1000);
                }
            },
            { noAck: false }
        );
    }

    // -----------------------------------------------------------------

    // Process and acknowledge (or requeue) all messages in the batch
    private async flushBatch(queueName: string, batch: BatchSettings) {
        const messages = this.batches[queueName];
        if (!messages || messages.length === 0) return;
        clearTimeout(this.timers[queueName]);

        try {
            // ---- Insert your DB bulk write logic here ----
            const data = messages.map((msg) => JSON.parse(msg.content.toString()));
            console.log(`[${queueName}] Processing batch of ${messages.length} messages`);
            // await db.insertMany(data);

            // Ack all processed messages
            // messages.forEach((msg) => this.channel.ack(msg));

            // Ack all up to and including the last message in the batch
            const lastMsg = messages[messages.length - 1];
            if (lastMsg) this.channel.ack(lastMsg, true);

        } catch (err) {
            // Nack all (requeue) on failure
            messages.forEach((msg) => this.channel.nack(msg, false, true));
            console.error(`Error processing batch for queue ${queueName}:`, err);
        }
        this.batches[queueName] = [];
    }

    // -----------------------------------------------------------------
    
    async close() {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}
