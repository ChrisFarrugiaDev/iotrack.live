import { FastifyInstance } from "fastify";
import GroupController from "../controllers/group.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema } from "../schemas/group.schema";
import { requirePermissions } from "../middleware/permission.middleware";


export default async function groupRouter(fastify:FastifyInstance) {

    fastify.post(
        "/",
        {preHandler: [authMiddleware, validateBody(storeSchema), requirePermissions(["group.create"])], },
        GroupController.store
    );

    fastify.delete(
        "/",
        {preHandler: [authMiddleware, validateBody(destroySchema), requirePermissions(["group.delete"])], },
        GroupController.destroy
    );
    

}