import { FastifyReply, FastifyRequest } from "fastify";
import { AccessProfileController } from "./access-profile.controller";
import { ApiResponse } from "../../types/api-response.type";
import { logger } from "../../utils/logger.utils";


class UserAssignmentController {


    static async getAssignableResources(request: FastifyRequest, reply: FastifyReply) {


        try {
            const userID = (request as any)?.userID;
            const { org_id } = (request as any).body;  

            // TODO:  validate org_id is within user's allowed scope

             // 1. Compute all accessible org IDs for this user in this org context
            const accessibleOrgIds = await AccessProfileController.computeAccessibleOrganisationIds(
                org_id, 
                // userID
                "1"
            );

             // 2. Build organisation metadata map for response
            const organisation = await AccessProfileController.buildOrganisationInfoMap(accessibleOrgIds);

            // 3. Get all assignable assets/devices
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


            // 4. Respond with all assignable entities
            return reply.send({
                success: true,
                message: 'Assignable resources fetched successfully',
                data: { organisation, assets, devices }
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