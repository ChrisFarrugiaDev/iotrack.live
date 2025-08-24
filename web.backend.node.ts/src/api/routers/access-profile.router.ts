import { FastifyInstance } from "fastify";
import { AccessProfileController } from "../controllers/access-profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";

// ---------------------------------------------------------------------

export default async function accessProfileRouter(fastify: FastifyInstance) {
    // Register route with auth middleware as preHandler
    fastify.get("/", { preHandler: [authMiddleware] }, AccessProfileController.getAccessProfile );
}

// ---------------------------------------------------------------------
