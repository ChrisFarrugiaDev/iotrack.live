import { FastifyInstance } from "fastify";
import { authMiddleware } from "../middleware/auth.middleware";
import UserController from "../controllers/user.controller";


export default async function userRouter(fasrify: FastifyInstance) {

    fasrify.get("/", {preHandler: [authMiddleware]}, UserController.index);

}