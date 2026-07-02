import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/permission.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { validateParams } from "../middleware/validate-params.middleware";
import { codec12CommandSchema, codec12ParamsSchema } from "../schemas/teltonika.schema";
import TeltonikaController from "../controllers/teltonika.controller";

// ---------------------------------------------------------------------

export default async function teltonikaRouter(fastify: FastifyInstance) {
    fastify.post(
        "/codec12/commands/:imei",
        { preHandler: [authMiddleware, validateParams(codec12ParamsSchema), validateBody(codec12CommandSchema), requirePermissions(["device.command"])] },
        TeltonikaController.addCodec12Command
    );
}

// ---------------------------------------------------------------------
