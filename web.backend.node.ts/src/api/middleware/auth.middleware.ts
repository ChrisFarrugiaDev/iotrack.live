import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../../types/api-response.type";
import jwt from 'jsonwebtoken';
import { UserJWT } from "../../types/user-jwt.type";

/**
 * Middleware to validate JWT and attach user info to the request object.
 */

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const header = req.header("Authorization");

    // 1. Ensure Authorization header exists and is properly formatted
    if (!header || !header.startsWith("Bearer ")) {
        return res.status(401).json({
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
        req.userID = decoded.id;
        req.userOrgUuid = decoded.org_uuid;
        req.userRoleID = decoded.role_id;

        // 5. Continue to the next middleware/controller
        next();
    } catch (err: unknown) {
        // 6. Token verification failed → respond with 401
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: {
                code: 'AUTH_FAILED',
                error: process.env.DEBUG === "true" ? (err instanceof Error ? err.message : "Unknown error") : undefined
            }
        } as ApiResponse);
    }
};
