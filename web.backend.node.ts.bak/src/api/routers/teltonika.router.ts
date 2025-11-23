import { FastifyInstance } from "fastify";
import TeltonikaController from "../controllers/teltonika.controller";

// ---------------------------------------------------------------------

export default async function teltonikaRouter(fastify: FastifyInstance) {
    fastify.post("/codec12/commands/:imei", TeltonikaController.addCodec12Command );
}

// ---------------------------------------------------------------------
