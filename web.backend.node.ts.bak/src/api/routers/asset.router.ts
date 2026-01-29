import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import AssetController from "../controllers/asset.controller";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema, updateSchema } from "../schemas/asset.schema";
import { requirePermissions } from "../middleware/permission.middleware";


// ---------------------------------------------------------------------

export default async function assetRouter(fastify: FastifyInstance) {
    fastify.get("/", {preHandler: [authMiddleware]}, AssetController.index);
    fastify.post("/", {preHandler: [authMiddleware, validateBody(storeSchema), requirePermissions(["asset.create"])]}, AssetController.store);
    fastify.delete("/", {preHandler: [authMiddleware, validateBody(destroySchema), requirePermissions(["asset.delete"]) ] }, AssetController.destroy);
    fastify.patch("/:id", {preHandler: [authMiddleware, validateBody(updateSchema), requirePermissions(["asset.update"])]}, AssetController.update )
}

// ---------------------------------------------------------------------