import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import AssetController from "../controllers/asset.controller";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema } from "../schemas/asset.scheme";

// ---------------------------------------------------------------------

export default async function assetRouter(fastify: FastifyInstance) {
    fastify.get("/", {preHandler: [authMiddleware]}, AssetController.index);
    fastify.post("/", {preHandler: [authMiddleware, validateBody(storeSchema)]}, AssetController.store);
    fastify.delete("/", {preHandler: [authMiddleware, validateBody(destroySchema)] }, AssetController.destroy);

}

// ---------------------------------------------------------------------