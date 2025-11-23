import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { storeSchema } from "../schemas/organisation.schema";
import OrganisationController from "../controllers/organisation.controller";



export default async function organisationRoute(fastify: FastifyInstance) {

    fastify.post("/", { preHandler: [authMiddleware, validateBody(storeSchema)] }, OrganisationController.store);
}