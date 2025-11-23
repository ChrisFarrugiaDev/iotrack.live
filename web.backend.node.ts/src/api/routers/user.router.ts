import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import UserController from "../controllers/user.controller";
import { validateBody } from "../middleware/validate-body.middleware";
import { storeSchema } from "../schemas/user.schema";
import UserAssignmentController from "../controllers/user-assignable.controller";


export default async function userRouter(fastify: FastifyInstance) {

    fastify.get("/", {preHandler: [authMiddleware]}, UserController.index);
    fastify.post("/", { preHandler: [authMiddleware, validateBody(storeSchema)] }, UserController.store);


    // Add the assignment route
    fastify.post( "/assignment-options", { preHandler: [authMiddleware] }, UserAssignmentController.getAssignableResources );

}