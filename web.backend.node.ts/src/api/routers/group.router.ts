import { FastifyInstance } from "fastify";
import GroupController from "../controllers/group.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema, updateSchema } from "../schemas/group.schema";
import { requirePermissions } from "../middleware/permission.middleware";


export default async function groupRouter(fastify:FastifyInstance) {

    fastify.get(
        "/:type/:id",
        {preHandler: [authMiddleware, requirePermissions(["group.view"])], },
        GroupController.index
    );

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


    fastify.patch(
        "/:id",
        { preHandler: [authMiddleware, validateBody(updateSchema), ] },
        GroupController.update
    );   
}