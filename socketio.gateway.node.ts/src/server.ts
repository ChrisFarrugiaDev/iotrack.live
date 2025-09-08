
import _env from "./config/env.config";
import app from "./App";

_env;

app.init();

process.on('SIGINT', () => app.gracefulShutdown());
process.on('SIGTERM', () => app.gracefulShutdown());