import { FastifyRequest, FastifyReply } from "fastify";
import { ApiResponse } from "../../types/api-response.type";
import jwt from 'jsonwebtoken';
import { UserJWT } from "../../types/user-jwt.type";

/**
 * Middleware to validate JWT and attach user info to the request object.
 */
export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    const header = request.headers['authorization'];

    // 1. Ensure Authorization header exists and is properly formatted
    if (!header || typeof header !== "string" || !header.startsWith("Bearer ")) {
        return reply.status(401).send({
            success: false,
            message: 'Authorization token missing or invalid format',
            error: {
                code: 'AUTH_MISSING',
                error: process.env.DEBUG === "true" ? "Expected format: Bearer <token>" : undefined
            }
        } as ApiResponse);
    }

    // 2. Extract token from "Bearer <token>"
    const token = header.split(" ")[1];

    try {
        // 3. Verify JWT using secret from env
        const secret = process.env.JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as UserJWT;

        // 4. Attach decoded user data to request for downstream handlers
        request.userID = decoded.id;
        request.userOrgID = decoded.org_id;
        request.userRoleID = decoded.role_id;

        // 5. Continue to the next middleware/controller
        // Fastify continues automatically if you return nothing and don't send a response
        // (if you want compatibility with non-async middleware, you can also accept `done` and call it)
    } catch (err: unknown) {
        // 6. Token verification failed → respond with 401
        return reply.status(401).send({
            success: false,
            message: 'Invalid or expired token',
            error: {
                code: 'AUTH_FAILED',
                error: process.env.DEBUG === "true" ? (err instanceof Error ? err.message : "Unknown error") : undefined
            }
        } as ApiResponse);
    }
};
