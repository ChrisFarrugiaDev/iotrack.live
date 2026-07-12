import { FastifyRequest, FastifyReply } from "fastify";
import { AccessProfileController } from "../controllers/access-profile.controller";

export const requirePermissions = (required: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {

        const ROOT_ROLE_ID = 1;

        // Root bypass: full access
        if (Number(request.userRoleID) === ROOT_ROLE_ID) {
            return;
        }

        // Prefer the permissions authMiddleware already attached; fall back
        // to a fresh lookup if the request reached us without them.
        const perms = request.userPerms ?? await AccessProfileController.getUserPermissionKeys(
            { id: request.userID!, role_id: Number(request.userRoleID!) }
        );

        const permSet = new Set(perms);

        for (const p of required) {
            if (!permSet.has(p)) {
                return reply.status(403).send({
                    success: false,
                    message: "Permission denied.",
                    error: { code: "PERMISSION_DENIED", permission: p },
                });
            }
        }
    };
};
