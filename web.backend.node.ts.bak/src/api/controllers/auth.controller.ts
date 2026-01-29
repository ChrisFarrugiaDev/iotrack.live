import { FastifyRequest, FastifyReply } from "fastify";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';

import { User, UserType } from "../../models/user.model";

import { ApiResponse } from "../../types/api-response.type";
import { UserJWT } from "../../types/user-jwt.type";
import { logger } from "../../utils/logger.utils";
import { AccessProfileController } from "./access-profile.controller";

// -----------------------------------------------------------------------------

// Utility: Get secret from env or throw early (prevents server starting if missing)
function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not set');
    return secret;
}

class AuthController {

    // Generate a JWT token for the authenticated user.
    static generateToken(payload: UserJWT): string {
        return jwt.sign(payload, getJwtSecret(), { expiresIn: '12h' });
    }

    // -------------------------------------------------------------------------

    /**
     * Login endpoint.
     * Validates user credentials and returns JWT + user profile (with access rights).
     */
    static async login(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { email, password } = request.body as { email: string, password: string };

            // 1. Fetch user with roles and organisation info
            const user = await User.getByEmail(email, ['organisations', 'roles']);
            if (!user) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid credentials.',
                    error: {
                        code: 'AUTH_FAILED',
                        error: process.env.DEBUG === "true" ? "Invalid email" : undefined
                    }
                } as ApiResponse);
            }

            // 2. Verify password using bcrypt
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return reply.status(401).send({
                    success: false,
                    message: 'Invalid credentials.',
                    error: {
                        code: 'AUTH_FAILED',
                        error: process.env.DEBUG === "true" ? "Invalid password" : undefined
                    }
                } as ApiResponse);
            }

            // 3. Bump and store token version for invalidating old tokens and update login datetime

            User.markLogin(user.id)
            const userPermissions = await AccessProfileController.getUserPermissionKeys(user, true);

            // user.token_version = await User.bumpTokenVersion(user.id);
            // await redisUtils.set(`user:token_version:${user.id}`, user.token_version, null, "iotrack.live:");

            // 4. Build the JWT payload and sign a new token
            const tokenPayload: UserJWT = {
                sub: user.uuid,
                id: user.id,
                email: user.email,
                role_id: user.roles.id,
                org_id: user.organisations.id,
                token_version: user.token_version,
            };

            const token = AuthController.generateToken(tokenPayload);

            // 9. Return the successful login response with JWT and user profile
            return reply.send({
                success: true,
                message: 'Login successful.',
                data: {
                    token,
                }
            } as ApiResponse);

        } catch (err) {
            // Log and return a structured error response for any unexpected error
            logger.error({ err }, '! auth.controller.ts login !');

            return reply.status(500).send({
                success: false,
                message: "An unexpected error occurred. Please try again later.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === 'true' && err instanceof Error ? err.message : undefined
                }
            } as ApiResponse);
        }
    }

    // ------------------------------------------------------------------------- 

    // Logout endpoint (implement as needed: e.g., blacklist token, clear cookie, etc)
    static async logout(request: FastifyRequest, reply: FastifyReply) {
        // Typically just instruct frontend to delete JWT from storage
        return reply.send({
            success: true,
            message: 'Logged out.',
        });
    }
}

export default AuthController;
