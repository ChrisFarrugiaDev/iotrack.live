import { FastifyInstance } from "fastify";
import AuthController from "../controllers/auth.controller";
import { validateBody } from "../middleware/validate-body.middleware";
import { loginSchema } from "../schemas/auth.scheme";

// ---------------------------------------------------------------------

export default async function authRouter(fastify: FastifyInstance) {
    fastify.post("/login", { preHandler: [validateBody(loginSchema)] }, AuthController.login);
    // If you want to use the commented line with validateLogin/validate, add them to preHandler array
}

// ---------------------------------------------------------------------
