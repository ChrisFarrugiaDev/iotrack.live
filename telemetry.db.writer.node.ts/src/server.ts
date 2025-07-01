import _env from "./config/env.config";
import app from "./App";

// ---------------------------------------------------------------------

app.init();

// ---------------------------------------------------------------------

let isShuttingDown = false;
process.on('SIGINT', () => {
    if (!isShuttingDown) {
        isShuttingDown = true;
        app.gracefulShutdown();
    }
});

process.on('SIGTERM', () => {
    if (!isShuttingDown) {
        isShuttingDown = true;
        app.gracefulShutdown();
    }
});

// ---------------------------------------------------------------------