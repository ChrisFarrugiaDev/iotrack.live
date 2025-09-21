/**
 * Burst Forwarder (queue.forwarder.ts)
 * -----------------------------------
 * Purpose:
 *   Redis Pub/Sub can deliver messages in large bursts. If we call
 *   `onMessage` immediately for each one, thousands of synchronous
 *   calls could block the Node.js event loop and slow down Socket.IO
 *   or other async tasks.
 *
 * Solution:
 *   This helper batches messages:
 *     1. Incoming messages are queued in memory (FIFO).
 *     2. A microtask (`queueMicrotask`) runs a drain loop.
 *     3. Up to `maxBatch` messages are forwarded in one cycle.
 *     4. If more remain, another microtask is scheduled.
 *
 * Benefits:
 *   - Keeps event loop responsive.
 *   - Still delivers all messages very quickly (within the same tick).
 *   - Prevents overload from bursts (e.g., 10k Redis messages at once).
 */

type Msg = any;          // Type for queued messages (could refine later)
const q: Msg[] = [];     // Internal FIFO queue
let draining = false;    // Flag: are we currently draining?

export function createBurstForwarder(
    forward: (m: Msg) => void, // Callback to handle each message
    maxBatch = 500             // Max messages per drain cycle
) {

    // Drain loop: processes up to `maxBatch` messages per tick
    function drain() {
        let n = 0;
        while (q.length && n < maxBatch) {
            forward(q.shift()!); // Forward one message
            n++;
        }
        draining = false; // Finished this batch

        // If messages remain, schedule another drain in next microtask
        if (q.length) {
            queueMicrotask(drain);
        }
    }

    // Function returned to caller: enqueue a new message
    return function enqueue(msg: Msg) {
        q.push(msg);            // Add message to queue
        if (draining) return;   // Already draining? Exit early
        draining = true;        // Mark draining so no double scheduling
        queueMicrotask(drain);  // Schedule drain to start ASAP
    };
}
