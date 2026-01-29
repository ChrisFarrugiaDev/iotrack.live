import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema, updateSchema } from "../schemas/organisation.schema";
import OrganisationController from "../controllers/organisation.controller";
import { requirePermissions } from "../middleware/permission.middleware";



export default async function organisationRoute(fastify: FastifyInstance) {

    fastify.post(
        "/", 
        { preHandler: [authMiddleware, validateBody(storeSchema), requirePermissions(["org.create"])],  }, 
        OrganisationController.store
    );

    fastify.delete(
        "/",
        { preHandler: [authMiddleware, validateBody(destroySchema), requirePermissions(["org.delete"])] },
        OrganisationController.destroy
    );

    fastify.patch(
        "/:id",
        { preHandler: [authMiddleware, validateBody(updateSchema), requirePermissions(["org.update"])] },
        OrganisationController.update
    )
}