import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema, updateSchema } from "../schemas/organisation.schema";
import OrganisationController from "../controllers/organisation.controller";



export default async function organisationRoute(fastify: FastifyInstance) {

    fastify.post("/", { preHandler: [authMiddleware, validateBody(storeSchema)] }, OrganisationController.store);

    fastify.delete(
        "/",
        { preHandler: [authMiddleware, validateBody(destroySchema)] },
        OrganisationController.destroy
    );

    fastify.patch(
        "/:id",
        { preHandler: [authMiddleware, validateBody(updateSchema)] },
        OrganisationController.update
    )
}