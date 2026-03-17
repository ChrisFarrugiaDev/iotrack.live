import { FastifyInstance } from "fastify";
import AuthController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate-body.middleware";
import { loginSchema, switchOrg } from "../schemas/auth.schema";
import { authMiddleware } from "../middleware/auth.middleware";
import { requirePermissions } from "../middleware/permission.middleware";

// ---------------------------------------------------------------------

export default async function authRouter(fastify: FastifyInstance) {
    fastify.post("/login", { preHandler: [validateBody(loginSchema)] }, AuthController.login);
    // If you want to use the commented line with validateLogin/validate, add them to preHandler array

    fastify.post("/switch_org", { preHandler: [authMiddleware, validateBody(switchOrg), requirePermissions(["org.switch"])] }, AuthController.switchOrg );
}

// ---------------------------------------------------------------------
