type Msg = any;

export function createBurstForwarder(
    forward: (m: Msg) => void,
    maxBatch = 500
) {
    const q: Msg[] = [];
    let draining = false;

    function drain() {
        let n = 0;
        while (q.length && n < maxBatch) {
            forward(q.shift()!);
            n++;
        }
        draining = false;
        if (q.length) {
            // More messages left — drain again next tick
            queueMicrotask(drain);
        }
    }

    return function enqueue(msg: Msg) {
        q.push(msg);
        if (!draining) {
            draining = true;
            queueMicrotask(drain);
        }
    };
}