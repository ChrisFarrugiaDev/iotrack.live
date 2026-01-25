import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import UserController from "../controllers/user.controller";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema, updateSchema } from "../schemas/user.schema";
import UserAssignmentController from "../controllers/user-assignable.controller";
import { requirePermissions } from "../middleware/permission.middleware";


export default async function userRouter(fastify: FastifyInstance) {

    fastify.get(
        "/",
        { preHandler: [authMiddleware] },
        UserController.index
    );

    fastify.post(
        "/",
        { preHandler: [authMiddleware, validateBody(storeSchema), requirePermissions(["user.create"])] },
        UserController.store
    );

    fastify.delete(
        "/",
        { preHandler: [authMiddleware, validateBody(destroySchema), requirePermissions(["user.delete"])] },
        UserController.destroy
    );

    
    fastify.patch("/:id", 
        { preHandler: [authMiddleware, validateBody(updateSchema), requirePermissions(["user.update"])] },
        UserController.update
    );

    // User permissions
    fastify.get(
        "/:id/permissions",
        { preHandler: [authMiddleware] },
        UserController.permissions
    );

    // User organisations
    fastify.get(
        "/:id/organisations",
        { preHandler: [authMiddleware] },
        UserController.organisations
    );

    // User assets
    fastify.get(
        "/:id/assets",
        { preHandler: [authMiddleware] },
        UserController.assets
    );

    // User devices
    fastify.get(
        "/:id/devices",
        { preHandler: [authMiddleware] },
        UserController.devices
    );

    // Assignment options
    fastify.post(
        "/assignment-options",
        { preHandler: [authMiddleware] },
        UserAssignmentController.getAssignableResources
    );
}
