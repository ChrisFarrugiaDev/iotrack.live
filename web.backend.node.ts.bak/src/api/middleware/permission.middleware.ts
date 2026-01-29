import { FastifyRequest, FastifyReply } from "fastify";
import { AccessProfileController } from "../controllers/access-profile.controller";

export const requirePermissions = (required: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const perms = await AccessProfileController.getUserPermissionKeys(
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
