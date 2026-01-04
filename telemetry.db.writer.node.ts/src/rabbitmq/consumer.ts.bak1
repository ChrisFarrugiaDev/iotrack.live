import amqp, { ChannelModel, Channel, ConsumeMessage } from "amqplib";
import { logDebug, logError, logInfo } from "../utils/logger.utils";
import { Telemetry } from "../models/telemetry.model";

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

    private shuttingDown = false;
    private pendingFlushes: Promise<any>[] = [];

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

        logInfo(`RabbitMQ connected successfully on port ${process.env.RABBITMQ_PORT}`);

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

    /**
     * Starts consuming messages from a queue and batches them for processing.
     * When the batch size is reached or a timer expires, the batch is flushed.
     */
    private consumeBatch(q: QueueConfig) {
        const { name, batch } = q;

        // Start consuming messages from the given queue
        this.channel.consume(
            name,
            (msg) => {
                if (!msg) return; // Ignore empty/null messages

                // Add the message to the buffer for this queue
                this.batches[name].push(msg);

                if (this.batches[name].length >= batch.max_size) {
                    // If batch buffer is full, flush (process) immediately
                    this.flushBatch(name, batch);

                } else if (this.batches[name].length === 1) {
                    // If this is the first message in the batch, start the batch timer
                    this.timers[name] = setTimeout(() => {
                        this.flushBatch(name, batch);
                    }, batch.max_wait_seconds * 1000);
                }
            },
            { noAck: false } // Require manual ack for reliable message processing
        );
    }


    // -----------------------------------------------------------------

    /**
     * Processes up to max_size messages for a queue, saves them to the DB,
     * then acknowledges them in RabbitMQ. Called when batch is full or timer fires.
     */
    private async flushBatch(queueName: string, batch: BatchSettings) {
        // If shutting down, skip further batch processing
        if (this.shuttingDown) return;

        // Prevent more than one flush running at a time for the same queue
        if (this.flushing?.[queueName]) {
            logInfo(`[${queueName}] flushBatch: Already flushing, skipping.`);
            return;
        }
        this.flushing[queueName] = true; // Mark this queue as being flushed

        // Create an async flush operation and track it for graceful shutdown
        const flushPromise = (async () => {

            let messages: ConsumeMessage[] = [];

            try {
                // Get the batch array for this queue
                const batchArray = this.batches[queueName] || [];
                if (batchArray.length === 0) {
                    // No messages to process; release the lock and exit
                    this.flushing[queueName] = false;
                    return;
                }

                // Cancel and remove any running flush timer for this queue
                clearTimeout(this.timers[queueName]);
                delete this.timers[queueName];

                // Take up to max_size messages for processing in this batch
                messages = batchArray.splice(0, batch.max_size);

                // Put any leftover messages back in the buffer
                this.batches[queueName] = batchArray;

                // ----- BUSINESS LOGIC: Write to database -----                
                if (queueName == "telemetry") {
                    // Parse message data and bulk insert into DB
                    // TODO:  move it to a handler
                    const data = messages.map((msg) => JSON.parse(msg.content.toString()));
                    await Telemetry.createBulk(data);
                }

                // Log that a batch was processed (for observability)
                logDebug(`[${queueName}] Processing batch of ${messages.length} messages`);

                // Acknowledge (ACK) each message in RabbitMQ as successfully processed
                for (const msg of messages) {
                    this.channel.ack(msg, false);
                }

                // If there are still messages waiting, immediately schedule the next flush
                if (this.batches[queueName].length > 0) {
                    setImmediate(() => this.flushBatch(queueName, batch));
                }

            } catch (err) {

                // If batch processing fails, NACK only the current batch to requeue them
                if (messages && messages.length > 0) {
                    messages.forEach((msg) => this.channel.nack(msg, false, true));
                }
                // Log the error for debugging
                logError(`! consumer.flushBatch ! Error processing batch for queue ${queueName}`, err);

            } finally {
                // Release the flushing lock even if there was an error
                this.flushing[queueName] = false;
            }
        })();

        // Track this flush promise so shutdown can wait for all in-progress batches
        this.pendingFlushes.push(flushPromise);

        // Remove the promise from the list once finished (success or error)
        flushPromise.finally(() => {
            this.pendingFlushes = this.pendingFlushes.filter(p => p !== flushPromise);
        });
        
    }



    // -----------------------------------------------------------------

    async close() {
        this.shuttingDown = true;

        // Wait for all flushes to finish
        await Promise.all(this.pendingFlushes);

        // Now close channel/connection
        if (this.channel) await this.channel.close();
        if (this.connection) await this.connection.close();
    }
}
