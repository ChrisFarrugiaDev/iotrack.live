/// <reference path="./types/express/index.d.ts" />

import _env from "./config/env.config";
import app from "./App";

app.init(Number(_env.HTTP_PORT));

process.on('SIGINT', () => app.gracefulShutdown());
process.on('SIGTERM', () => app.gracefulShutdown());