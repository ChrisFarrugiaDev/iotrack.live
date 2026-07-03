import { FastifyInstance } from "fastify";
import WhiteLabelController from "../controllers/white-label.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { requirePermissions } from "../middleware/permission.middleware";
import { updateSchema } from "../schemas/white-label.schema";

// ---------------------------------------------------------------------

export default async function whiteLabelRouter(fastify: FastifyInstance) {
    // Public — used by the login screen before authentication
    fastify.get("/public", WhiteLabelController.getPublic);

    fastify.get("/", { preHandler: [authMiddleware] }, WhiteLabelController.get);
    fastify.put(
        "/",
        { preHandler: [authMiddleware, validateBody(updateSchema), requirePermissions(["white_label.update"])] },
        WhiteLabelController.update
    );
}

// ---------------------------------------------------------------------
