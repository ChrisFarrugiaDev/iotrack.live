import { FastifyRequest, FastifyReply } from "fastify";
import { ApiResponse } from "../../types/api-response.type";
import jwt from 'jsonwebtoken';
import { UserJWT } from "../../types/user-jwt.type";
import * as redisUtils from "../../utils/redis.utils";
import prisma from "../../config/prisma.config";

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



        // 4. Fetch JWT version
        const cacheKey = `user:token_version:${decoded.id}`;
        let currentVersion = await redisUtils.get(cacheKey, "iotrack.live:");

        if (!currentVersion) {
            const user = await prisma.users.findUnique({
                where: { id: BigInt(decoded.id) },
                select: { token_version: true },
            });

            if (!user) {
                return reply.status(401).send({
                    success: false,
                    message: "User no longer exists",
                    error: { code: "AUTH_USER_GONE" },
                });
            }

            currentVersion = user.token_version.toString();

            await redisUtils.set(
                cacheKey,
                currentVersion,
                900, // 15 min
                "iotrack.live:"
            );
        }

        // 5. compare JWT version
        if (Number(currentVersion) !== decoded.token_version) {
            return reply.status(401).send({
                success: false,
                message: "Session expired. Please log in again.",
                error: { code: "AUTH_TOKEN_REVOKED" },
            });
        }

        // 6. Attach decoded user data to request for downstream handlers
        request.userID = decoded.id;
        request.userOrgID = decoded.org_id;
        request.userRoleID = decoded.role_id;

        // 7. Continue to the next middleware/controller
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
