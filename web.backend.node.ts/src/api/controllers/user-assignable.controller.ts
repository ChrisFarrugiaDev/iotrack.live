import { FastifyReply, FastifyRequest } from "fastify";
import { AccessProfileController } from "./access-profile.controller";
import { ApiResponse } from "../../types/api-response.type";
import { logger } from "../../utils/logger.utils";
import { User } from "../../models/user.model";
import { userToPublic } from "../dto/user.dto";


class UserAssignmentController {


    static async getAssignableResources(request: FastifyRequest, reply: FastifyReply) {


        try {
            const { org_id } = (request as any).body;

            // 1. Guard: the requested org must be inside the requester's own
            // org scope (org_id comes from the client and cannot be trusted).
            const requesterOrgIds = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!,
                request.userID!
            );

            if (!requesterOrgIds.includes(String(org_id))) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have access to this organisation.",
                    error: { code: "ORG_ACCESS_DENIED" },
                } as ApiResponse);
            }

            // 2. Compute all accessible org IDs for the requested org context.
            // User "1" (root) is intentional: assignment options must list the
            // org's full resources, not filtered by the requester's own
            // per-user overrides.
            const accessibleOrgIds = await AccessProfileController.computeAccessibleOrganisationIds(
                org_id,
                // userID
                "1"
            );

             // 3. Build organisation metadata map for response
            const organisation = await AccessProfileController.buildOrganisationInfoMap(accessibleOrgIds);

            // 4. Get all assignable assets/devices
            const assets = await AccessProfileController.getAccessibleAssetsForUser(
                // userID,
                "1", 
                accessibleOrgIds
            );
            const devices = await AccessProfileController.getAccessibleDevicesForUser(
                // userID,
                "1", 
                accessibleOrgIds
            );


            // Fetch users for those orgs
            const users = await User.getUsersByOrganisationIds(accessibleOrgIds);
            const safeUsers = users.map(userToPublic);

       

            // 5. Respond with all assignable entities
            return reply.send({
                success: true,
                message: 'Assignable resources fetched successfully',
                data: { organisation, assets, devices, users: safeUsers }
            } as ApiResponse);

        } catch (err) {
            // Log and return structured error for unexpected exceptions
            logger.error({ err }, '! user-assignable.controller.ts getAssignableResources !');

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
}

// =====================================================================

export default UserAssignmentController;