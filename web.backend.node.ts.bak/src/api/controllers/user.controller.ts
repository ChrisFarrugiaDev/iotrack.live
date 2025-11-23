import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger.utils";
import { User, UserType } from "../../models/user.model";
import { AccessProfileController } from "./access-profile.controller";
import { userToPublic } from "../dto/user.dto";
import { ApiResponse } from "../../types/api-response.type";
import bcrypt from "bcryptjs";
import { genPass } from "../../utils/utils";
import { bigint } from "zod";
import prisma from "../../config/prisma.config";


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

        let  {
            first_name,
            last_name,
            email,
            password,
            role,
            active,
            organisation_id,
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
            organisation_id,
            user_permissions,
            user_organisation_access,
            user_asset_access,
            user_device_access,
        });        


        // Ensure the new user's organisation belongs to the user's accessible orgs (own or child).
        // Otherwise return 403 Forbidden.
        const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
            request.userOrgID!, request.userID!
        );

        if (!accessibleOrgsByUser.includes(organisation_id)) {
            return reply.status(403).send({
                success: false,
                message: "You don't have permission to create a user for this organisation.",
                error: {
                    code: "ORG_ACCESS_DENIED",
                    details: process.env.DEBUG === "true" ? {
                        requested_org_id: organisation_id,
                        accessible_org_ids: accessibleOrgsByUser,
                    } : undefined,
                },
            } as ApiResponse);
        }

        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const password_hash = password && password.length ? await bcrypt.hash(password, salt) : await bcrypt.hash(genPass(), salt);


        const userData = {
            first_name,
            last_name,
            email,
            password_hash: password_hash,
            roles: { connect: {role_id: Number(role) } },
            organisations: { connect: {id: BigInt(organisation_id) } },
            active,  
        }

        const result = await prisma.$transaction( async(tx) => {
            const user = User.create(userData, tx)

            return {user};
        })

        return reply.send({
            success: true,
            message: "User created successfully.",
            data: {...result},
        } as ApiResponse);
    }
}



// =====================================================================

export default UserController;