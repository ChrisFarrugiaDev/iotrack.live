import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger.utils";
import { User, UserType } from "../../models/user.model";
import { AccessProfileController } from "./access-profile.controller";
import { userToPublic } from "../dto/user.dto";
import { ApiResponse } from "../../types/api-response.type";
import bcrypt from "bcryptjs";
import { genPass } from "../../utils/utils";
import prisma from "../../config/prisma.config";
import { Prisma } from "@prisma/client";
import { UserPermissions } from "../../models/user-permissions.model";
import * as userSchema from "../schemas/user.schema";
import { z } from "zod";
import { UserOrganisationAccess } from "../../models/user-organisation-access.model";
import { UserAssetAccess } from "../../models/user-asset-access.model";
import { UserDeviceAccess } from "../../models/user-device-access.model";

// UserController: Handles all user-related endpoints
class UserController {

    /**
     * List all users accessible by the current user (based on org permissions).
     */
    static async index(request: FastifyRequest, reply: FastifyReply) {
        try {
            const orgId = request.userOrgID;
            const userId = request.userID;

            // Compute orgs the user can access
            const orgsIds = await AccessProfileController.computeAccessibleOrganisationIds(orgId!, userId!);

            // Fetch users for those orgs
            const users = await User.getUsersByOrganisationIds(orgsIds);
            const safeUsers = users.map(userToPublic);

            // Map users by ID for easier frontend access
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

    /**
     * Create a new user, with permissions and org access validation.
     */
    static async store(request: FastifyRequest, reply: FastifyReply) {
        // Validate request body with Zod schema
        const parsed = userSchema.storeSchema.safeParse(request.body);

        if (!parsed.success) {
            return reply.status(400).send({
                success: false,
                errors: z.flattenError(parsed.error),
            });
        }
        const data = parsed.data;

        // 1. Ensure organisation is within allowed orgs for current user
        const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
            request.userOrgID!, request.userID!
        );
        if (!accessibleOrgsByUser.includes(data.organisation_id)) {
            return reply.status(403).send({
                success: false,
                message: "You don't have permission to create a user for this organisation.",
                error: {
                    code: "ORG_ACCESS_DENIED",
                    details: process.env.DEBUG === "true" ? {
                        requested_org_id: data.organisation_id,
                        accessible_org_ids: accessibleOrgsByUser,
                    } : undefined,
                },
            } as ApiResponse);
        }

        // 2. Ensure email is unique
        const userExists = await User.getByEmail(data.email);
        if (userExists) {
            return reply.status(400).send({
                success: false,
                message: "Email already exists.",
                error: { code: "EMAIL_EXISTS" },
            });
        }

        // 3. Hash password (use provided or generate random one)
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const password_hash = data.password && data.password.length
            ? await bcrypt.hash(data.password, salt)
            : await bcrypt.hash(genPass(), salt);

        // 4. Prepare user data for DB
        const userData = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            password_hash,
            roles: { connect: { role_id: Number(data.role) } },
            organisations: { connect: { id: BigInt(data.organisation_id) } },
            active: data.active,
        };

        // User permission type for bulk insert
        type UserPermissionType = { user_id: bigint; perm_id: number; is_allowed: boolean; };
        const userPermissions: UserPermissionType[] = [];


        type UserOrganisationAccessType = { user_id: bigint; organisation_id: number; is_allowed: boolean; };
        const userOrganisationAccess: UserOrganisationAccessType[] = [];

        type UserAssetAccessType = { user_id: bigint; asset_id: number; is_allowed: boolean; };
        const userAssetAccessType: UserAssetAccessType[] = [];

        type UserDeviceAccessType = { user_id: bigint; device_id: number; is_allowed: boolean; };
        const userDeviceAccessType: UserDeviceAccessType[] = [];

        // 5. Transaction: create user + all permissions
        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {

            const user = await User.create(userData, tx);

            // --- user_permissions 
            for (let perm in data.user_permissions) {
                const userPerm: UserPermissionType = {
                    user_id: BigInt(user.id),
                    perm_id: Number(perm),
                    is_allowed: data.user_permissions[perm]
                };
                userPermissions.push(userPerm);
            }

            const permissions = await UserPermissions.createMany(userPermissions, tx);

            // --- user_organisation_access 
            for (let org in data.user_organisation_access) {
                const userOrg: UserOrganisationAccessType = {
                    user_id: BigInt(user.id),
                    organisation_id: Number(org),
                    is_allowed: data.user_permissions[org]
                };
                userOrganisationAccess.push(userOrg);
            }

            const organisation = await UserOrganisationAccess.createMany(userOrganisationAccess, tx);


            // --- user_asset_access 
            for (let asset in data.user_asset_access) {
                const userAsset: UserAssetAccessType = {
                    user_id: BigInt(user.id),
                    asset_id: Number(asset),
                    is_allowed: data.user_asset_access[asset]
                };
                userAssetAccessType.push(userAsset);
            }
            const assets = await UserAssetAccess.createMany(userAssetAccessType, tx);

            // --- user_device_access 
            for (let device in data.user_device_access) {
                const userDevice: UserDeviceAccessType = {
                    user_id: BigInt(user.id),
                    device_id: Number(device),
                    is_allowed: data.user_device_access[device]
                };
                userDeviceAccessType.push(userDevice);
            }
            const devices = await UserDeviceAccess.createMany(userDeviceAccessType, tx);

            const safeUser = userToPublic(user);


            return { user: safeUser, permissions, organisation, assets, devices };
        });

        return reply.send({
            success: true,
            message: "User created successfully.",
            data: { ...result },
        } as ApiResponse);
    }
}

// =====================================================================

export default UserController;
