import amqp, { ChannelModel, Channel, ConsumeMessage } from "amqplib";
import { logError, logInfo } from "../utils/logger-utils";
import { Telemetry } from "../models/telemetry";

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

    // Holds the main connection object for RabbitMQ (from amqplib)
    private connection!: ChannelModel;

    // Holds the channel object for RabbitMQ—used to send/receive messages
    private channel!: Channel;

    // For each queue, this stores an array (buffer) of unprocessed messages
    private batches: Record<string, ConsumeMessage[]> = {};

    // For each queue, this stores the timeout object for the current batch timer
    private timers: Record<string, NodeJS.Timeout> = {};

    // Stores the consumer config passed to this class
    private config: ConsumerConfig;
    // Stores just the queue configs for easy access
    private queueConfigs: QueueConfig[];

    // This flag ensures that only one flushBatch runs at a time per queue
    private flushing: Record<string, boolean> = {};

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
            logInfo("RabbitMQ connection closed. Reconnecting...");

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

    /**
     * Processes up to max_size messages for a queue, saves them to the DB,
     * then acknowledges them in RabbitMQ. Called when batch is full or timer fires.
     */
    private async flushBatch(queueName: string, batch: BatchSettings) {
        // Prevent multiple concurrent flushes for the same queue
        if (this.flushing?.[queueName]) {
            logInfo(`[${queueName}] flushBatch: Already flushing, skipping.`);
            return;
        }
        this.flushing[queueName] = true;

        try {
            // Get (and work with) the message buffer for this queue
            const batchArray = this.batches[queueName] || [];
            if (batchArray.length === 0) {
                // Nothing to process, release the lock and exit
                this.flushing[queueName] = false;
                return;
            }

            // Cancel and remove the flush timer for this queue
            clearTimeout(this.timers[queueName]);
            delete this.timers[queueName];

            // Remove up to max_size messages from the buffer for this batch
            const messages = batchArray.splice(0, batch.max_size);

            // Put any remaining messages back in the buffer for later
            this.batches[queueName] = batchArray;

            // Business logic: parse messages and write to database
            if (queueName == "telemetry") {
                const data = messages.map((msg) => JSON.parse(msg.content.toString()));
                await Telemetry.createBulk(data);
            }

            // Log batch processing for monitoring/debugging
            logInfo(`[${queueName}] Processing batch of ${messages.length} messages`);

            // Ack all messages in this batch (up to and including the last) in RabbitMQ
            // const lastMsg = messages[messages.length - 1];
            // if (lastMsg) this.channel.ack(lastMsg, true);

            for (const msg of messages) {
                this.channel.ack(msg, false);
            }

            // If there are still messages buffered, schedule another flush right away
            if (this.batches[queueName].length > 0) {
                setImmediate(() => this.flushBatch(queueName, batch));
            }

        } catch (err) {
            // If DB/processing failed, NACK only the current batch so they are requeued
            const messages = this.batches[queueName];
            if (messages && messages.length > 0) {
                messages.forEach((msg) => this.channel.nack(msg, false, true));
            }
            // Log the error
            logError(`! consumer.flushBatch ! Error processing batch for queue ${queueName}`, err);

        } finally {
            // Always release the "flushing" lock, even if error occurs
            this.flushing[queueName] = false;
        }
    }


    // -----------------------------------------------------------------

    async close() {
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}
