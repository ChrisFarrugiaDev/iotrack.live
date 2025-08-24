import { FastifyInstance } from "fastify";
import DeviceController from "../controllers/device.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, getSchema, storeSchema, updateSchema } from "../schemas/device.scheme";
import { validateParams } from "../middleware/validate-params.middleware";

// ---------------------------------------------------------------------

export default async function deviceRouter(fastify: FastifyInstance) {
    fastify.get("/", { preHandler: [authMiddleware] }, DeviceController.index);
    fastify.get("/:id", { preHandler: [authMiddleware, validateParams(getSchema)] }, DeviceController.get);
    fastify.post("/", { preHandler: [authMiddleware, validateBody(storeSchema)] }, DeviceController.store);
    fastify.patch(
        "/:id",
        { preHandler: [authMiddleware, validateBody(updateSchema), validateParams(getSchema)] },
        DeviceController.update
    );
    fastify.delete(
        "/",
        { preHandler: [authMiddleware, validateBody(destroySchema)] },
        DeviceController.destroy
    );
}

// ---------------------------------------------------------------------
