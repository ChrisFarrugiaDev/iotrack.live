import _env from "./config/envConfig";
import app from "./App";

app.start(Number(_env.HTTP_PORT));

process.on('SIGINT', () => app.gracefulShutdown());
process.on('SIGTERM', () => app.gracefulShutdown());