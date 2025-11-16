import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger.utils";
import { User, UserType } from "../../models/user.model";
import { AccessProfileController } from "./access-profile.controller";
import { userToPublic } from "../dto/user.dto";


class UserController {


    static async index(request: FastifyRequest, reply: FastifyReply) {
        try {

            const orgId = request.userOrgID;
            const userId = request.userID;

       
            const orgsIds = await AccessProfileController.computeAccessibleOrganisationIds(orgId!, userId!);

            const users = await User.getUsersByOrganisationIds(orgsIds);
            const safeUsers = users.map(userToPublic);

            const userMap: Record<string, any> = {};

            for (let user of safeUsers) {
                userMap[user.id] = user;
            }

            return reply.status(200).send({
                success: true,
                message: "Users fetched.",
                data: {
                    count: safeUsers.length,
                    users: userMap
                }
            });


        } catch (err) {
            logger.error(
                { err, orgId: request.userOrgID, userId: request.userID }, 
                "! UserController list !"
            );

            return reply.status(500).send({
                success: false,
                message: "Failed to fetch users.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                }
            });
        }
    }


    static async store(request: FastifyRequest, reply: FastifyReply) {

        const {
            first_name,
            last_name,
            email,
            password,
            role,
            active,
            user_permissions,
            user_organisation_access,
            user_asset_access,
            user_device_access,
        } = (request as any).body;

        console.log({
            first_name,
            last_name,
            email,
            password,
            role,
            active,
            user_permissions,
            user_organisation_access,
            user_asset_access,
            user_device_access,
        })
    }
}



// =====================================================================

export default UserController;