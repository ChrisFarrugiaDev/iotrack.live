import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../utils/logger.utils";
import { User, UserType } from "../../models/user.model";
import { AccessProfileController } from "./access-profile.controller";
import { userToPublic } from "../dto/user.dto";
import { ApiResponse } from "../../types/api-response.type";
import bcrypt from "bcryptjs";
import { genPass } from "../../utils/utils";
import prisma from "../../config/prisma.config";
import { Prisma } from "../../../generated/prisma";
import { UserPermissions, UserPermissionsType } from "../../models/user-permissions.model";
import * as userSchema from "../schemas/user.schema";
import { keyof, z } from "zod";
import { UserOrganisationAccess, UserOrganisationAccessType } from "../../models/user-organisation-access.model";
import { UserAssetAccess, UserAssetAccessType } from "../../models/user-asset-access.model";
import { UserDeviceAccess, UserDeviceAccessType } from "../../models/user-device-access.model";
import { Asset, AssetType } from "../../models/asset.model";
import { Device, DeviceType } from "../../models/device.model";
import * as redisUtils from "../../utils/redis.utils";


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

    // -----------------------------------------------------------------

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
                    is_allowed: data.user_organisation_access[org]
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

    // -----------------------------------------------------------------

    static async destroy(request: FastifyRequest, reply: FastifyReply) {

        try {


            const { user_ids } = (request as any).body;

            if (!user_ids || user_ids.length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "No user IDs provided.",
                    data: { count: 0 },
                });
            }

            const users = await User.getByIds(user_ids);

            if (!users || users.length == 0) {
                return reply.status(404).send({
                    success: false,
                    message: "No matching users were found to delete.",
                    data: { count: 0 },
                });
            }

            // Delete from DB
            const result = await User.deleteByIDs(user_ids);


            // Response
            return reply.send({
                success: true,
                message:
                    result.count === 1
                        ? "User deleted successfully."
                        : `${result.count} users were deleted successfully.`,
                data: { count: result.count, user_ids },
            });

        } catch (err) {

            logger.error({ err }, "! UserController destroy !");

            return reply.status(500).send({
                success: false,
                message: "Failed to delete users.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            });
        }
    }



    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {

            const userID = (request as any).params.id;

            // ---------------------------------------------
            // 0. Validate route param
            // ---------------------------------------------
            if (!userID) {
                return reply.status(400).send({
                    success: false,
                    message: "Missing user id in route params.",
                    error: { code: "BAD_REQUEST" },
                });
            }

            // ---------------------------------------------
            // 1. Check if user exists
            // ---------------------------------------------
            const existing = await User.getByID(userID);
            if (!existing) {
                return reply.status(404).send({
                    success: false,
                    message: "User not found.",
                    error: { code: "USER_NOT_FOUND" },
                });
            }


            // ---------------------------------------------
            // 2. Extract allowed update fields from body
            // ---------------------------------------------

            const parsed = userSchema.updateSchema.safeParse(request.body);

            if (!parsed.success) {
                // however you handle validation errors in your backend

                return reply.status(422).send({
                    success: false,
                    message: "Validation failed",
                    error: { code: "VALIDATION_ERROR" },
                });
            }

            const {
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
                user_device_access
            } = parsed.data;


            // ---------------------------------------------
            // 3. TO IMPLIMENT validate if user has permissions
            // ---------------------------------------------

            // ---------------------------------------------
            // 4. Ensure organisation is within allowed orgs for current user
            // ---------------------------------------------

            if (organisation_id !== undefined) {
                // 1. Ensure organisation is within allowed orgs for current user
                const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                    request.userOrgID!, request.userID!
                );

                if (!accessibleOrgsByUser.includes(organisation_id!)) {
                    return reply.status(403).send({
                        success: false,
                        message: "You don't have permission to set a user to this organisation.",
                        error: {
                            code: "ORG_ACCESS_DENIED",
                            details: process.env.DEBUG === "true" ? {
                                requested_org_id: organisation_id,
                                accessible_org_ids: accessibleOrgsByUser,
                            } : undefined,
                        },
                    } as ApiResponse);
                }
            }


            // ---------------------------------------------
            // 4. Input validation for critical fields
            // ---------------------------------------------
            const isEmpty = (v: unknown) =>
                v === null ||
                v === undefined ||
                (typeof v === "string" && v.trim() === "");

            const CRITICAL: Array<keyof typeof existing> = ["first_name", "last_name", "email", "role_id", "active", "organisation_id"];

            const fieldErrors: Record<string, string[]> = {};
            const data = parsed.data as Record<string, unknown>;

            // check existing DB (critical field already missing there)
            if (isEmpty(existing.first_name)) fieldErrors["first_name"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.last_name)) fieldErrors["external_id_type"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.email)) fieldErrors["email"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.role_id)) fieldErrors["role_id"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.active)) fieldErrors["active"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.organisation_id)) fieldErrors["organisation_id"] = ["Field cannot be empty (missing in DB)."];

            // Validate user-provided values
            for (const field of CRITICAL) {
                if (field in data) {
                    if (isEmpty(data[field])) {
                        fieldErrors[field] = ["Field cannot be empty."];
                    } else {
                        delete fieldErrors[field]; // value is valid
                    }
                }
            }

            // If any validation errors exist → reject request
            if (Object.keys(fieldErrors).length > 0) {
                return reply.status(400).send({
                    success: false,
                    message: "Invalid input.",
                    error: {
                        code: "INVALID_INPUT",
                        details: { fieldErrors },
                    },
                } as ApiResponse);
            }

            // ---------------------------------------------
            // 5. Build Prisma update payload
            // ---------------------------------------------
            const userFields: Prisma.usersUpdateInput = {};

            if (first_name !== undefined) { userFields.first_name = first_name; }
            if (last_name !== undefined) { userFields.last_name = last_name; }
            if (email !== undefined) { userFields.email = email; }
            if (active !== undefined) { userFields.active = active; }

            if (password !== undefined) {

                const saltRounds = 10;
                const salt = await bcrypt.genSalt(saltRounds);
                const password_hash = password && password.length
                    ? await bcrypt.hash(password, salt)
                    : await bcrypt.hash(genPass(), salt);

                userFields.password_hash = password_hash;
            }

            if (role !== undefined) {
                userFields.roles = { connect: { role_id: role } };
            }

            if (organisation_id !== undefined) {
                userFields.organisations = { connect: { id: BigInt(organisation_id) } };
            }


            await prisma.$transaction(async (tx) => {

                if (Object.keys(userFields).length > 0) {
                    await User.updateByID(userID, userFields, tx);
                }

                // ─────────────────────────────────────────
                // user_permissions
                // ─────────────────────────────────────────
                if (user_permissions !== undefined) {

                    const userPermissions: UserPermissionsType[] = [];

                    for (const perm in user_permissions) {
                        const userPerm: UserPermissionsType = {
                            user_id: BigInt(userID),
                            perm_id: Number(perm),
                            is_allowed: user_permissions[perm],
                        };
                        userPermissions.push(userPerm);
                    }

                    await UserPermissions.deleteByUserID(userID, tx);
                    await UserPermissions.createMany(userPermissions);
                }

                // ─────────────────────────────────────────
                // user_organisation_access
                // ─────────────────────────────────────────
                if (user_organisation_access !== undefined) {

                    const userOrganisationAccess: UserOrganisationAccessType[] = [];

                    for (const orgId in user_organisation_access) {
                        const userOrgAccess: UserOrganisationAccessType = {
                            user_id: BigInt(userID),
                            organisation_id: BigInt(orgId),
                            is_allowed: user_organisation_access[orgId],
                        };
                        userOrganisationAccess.push(userOrgAccess);
                    }

                    await UserOrganisationAccess.deleteByUserID(userID, tx);
                    await UserOrganisationAccess.createMany(userOrganisationAccess);
                }

                // ─────────────────────────────────────────
                // user_asset_access
                // ─────────────────────────────────────────
                if (user_asset_access !== undefined) {

                    const userAssetAccess: UserAssetAccessType[] = [];

                    for (const assetId in user_asset_access) {
                        const userAsset: UserAssetAccessType = {
                            user_id: BigInt(userID),
                            asset_id: BigInt(assetId),
                            is_allowed: user_asset_access[assetId],
                        };
                        userAssetAccess.push(userAsset);
                    }

                    await UserAssetAccess.deleteByUserID(userID, tx);
                    await UserAssetAccess.createMany(userAssetAccess);
                }

                // ─────────────────────────────────────────
                // user_device_access
                // ─────────────────────────────────────────
                if (user_device_access !== undefined) {

                    const userDeviceAccess: UserDeviceAccessType[] = [];

                    for (const deviceId in user_device_access) {
                        const userDevice: UserDeviceAccessType = {
                            user_id: BigInt(userID),
                            device_id: BigInt(deviceId),
                            is_allowed: user_device_access[deviceId],
                        };
                        userDeviceAccess.push(userDevice);
                    }

                    await UserDeviceAccess.deleteByUserID(userID, tx);
                    await UserDeviceAccess.createMany(userDeviceAccess);
                }
            });

            const updatedUser = await User.getByID(userID);


            // ---------------------------------------------
            // 7. Resolve effective access & permissions
            // ---------------------------------------------
            const [
                userPermissions,
                accessibleOrgIds,
                deviceIds,
                assetIds,
            ] = await Promise.all([
                AccessProfileController.getUserPermissions(updatedUser!, true),
                AccessProfileController.computeAccessibleOrganisationIds(
                    updatedUser!.organisation_id,
                    updatedUser!.id
                ),
                getAccessibleDeviceIdsForUser(updatedUser!),
                getAccessibleAssetIdsForUser(updatedUser!),
            ]);


            const shouldInvalidateAuth =
                password !== undefined ||
                role !== undefined ||
                active !== undefined ||
                organisation_id !== undefined ||
                user_permissions !== undefined ||
                user_organisation_access !== undefined ||
                user_asset_access !== undefined ||
                user_device_access !== undefined;

            if (shouldInvalidateAuth) {
                const newTokenVersion = await User.bumpTokenVersion(userID);

                await redisUtils.set(
                    `user:token_version:${userID}`,
                    newTokenVersion,
                    null,
                    "iotrack.live:"
                );
            }

            // ---------------------------------------------
            // 9. Successful response
            // ---------------------------------------------
            return reply.send({
                success: true,
                message: "User updated successfully.",
                data: {
                    user: userToPublic(updatedUser!),
                    user_permissions: userPermissions,
                    organisations: accessibleOrgIds,
                    assets: assetIds,
                    devices: deviceIds,
                },
            } as ApiResponse);





        } catch (err) {
            logger.error({ err }, "! UserController update !");

            return reply.status(500).send({
                success: false,
                message: "Failed to update user.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            });
        }
    }



    // -----------------------------------------------------------------


    static async permissions(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: userID } = request.params as { id: string };

            // 1. Fetch user
            const user = await User.getByID(userID);

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    message: "User not found.",
                });
            }

            // 2. Resolve effective permissions (role + user overrides)
            const userPermissions =
                await AccessProfileController.getUserPermissions(user, true);

            // 3. Respond
            return reply.send({
                success: true,
                message: "User permissions retrieved successfully.",
                data: {
                    user_permissions: userPermissions,
                },
            });

        } catch (err) {
            logger.error({ err }, "! UserController.permissions !");

            return reply.status(500).send({
                success: false,
                message: "Failed to retrieve user permissions.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            });
        }
    }

    static async organisations(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: userID } = request.params as { id: string };

            // 1. Fetch user
            const user = await User.getByID(userID);

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    message: "User not found.",
                });
            }

            // 2. Determine all organisation IDs the user can access
            const accessibleOrgIds: string[] = await AccessProfileController.computeAccessibleOrganisationIds(user.organisation_id, user.id);

            // 3. Respond
            return reply.send({
                success: true,
                message: "User organisations retrieved successfully.",
                data: {
                    organisations: accessibleOrgIds,
                },
            });

        } catch (err) {
            logger.error({ err }, "! UserController.organisations !");

            return reply.status(500).send({
                success: false,
                message: "Failed to retrieve user's organisations.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            });
        }
    }

    static async assets(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: userID } = request.params as { id: string };

            // 1. Fetch user
            const user = await User.getByID(userID);

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    message: "User not found.",
                });
            }

            const assetIds = await getAccessibleAssetIdsForUser(user);

            return reply.send({
                success: true,
                message: "User assets retrieved successfully.",
                data: {
                    assets: assetIds,
                },
            });

        } catch (err) {
            logger.error({ err }, "! UserController.assets !");

            return reply.status(500).send({
                success: false,
                message: "Failed to retrieve user's assets.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            });
        }
    }
    static async devices(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { id: userID } = request.params as { id: string };

            // 1. Fetch user
            const user = await User.getByID(userID);

            if (!user) {
                return reply.status(404).send({
                    success: false,
                    message: "User not found.",
                });
            }

            const deviceIds = await getAccessibleDeviceIdsForUser(user);

            return reply.send({
                success: true,
                message: "User devices retrieved successfully.",
                data: {
                    devices: deviceIds,
                },
            });

        } catch (err) {
            logger.error({ err }, "! UserController.devices !");

            return reply.status(500).send({
                success: false,
                message: "Failed to retrieve user's devices.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            });
        }
    }
}




async function getAccessibleAssetIdsForUser(user: UserType): Promise<string[]> {

    // 1. Fetch user-specific asset access overrides
    const overrides = await UserAssetAccess.getByUserID(user.id);

    const deny: string[] = [];

    for (const override of overrides) {
        if (!override.is_allowed) {
            deny.push(override.asset_id);
        }
    }

    // 2. Determine all organisation IDs the user can access
    const accessibleOrgIds =
        await AccessProfileController.computeAccessibleOrganisationIds(
            user.organisation_id,
            // user.id
            "1"
        );

    // 3. Fetch all assets belonging to those organisations
    const assets = await Asset.getByOrganisationsIDs(accessibleOrgIds);

    // 4. Remove explicitly denied assets
    const accessibleAssets = assets.filter(
        (asset: AssetType) => !deny.includes(asset.id)
    );

    // 5. Return asset IDs only
    return accessibleAssets.map(asset => asset.id);
}

async function getAccessibleDeviceIdsForUser(user: UserType): Promise<string[]> {

    // 1. Fetch user-specific device access overrides
    const overrides = await UserDeviceAccess.getByUserID(user.id);

    const deny: string[] = [];

    for (const override of overrides) {
        if (!override.is_allowed) {
            deny.push(override.device_id);
        }
    }

    // 2. Determine all organisation IDs the user can access
    const accessibleOrgIds =
        await AccessProfileController.computeAccessibleOrganisationIds(
            user.organisation_id,
            // user.id
            "1"
        );

    // 3. Fetch all devices belonging to those organisations
    const devices = await Device.getByOrganisationsIDs(accessibleOrgIds);

    // 4. Remove explicitly denied devices
    const accessibleDevices = devices.filter(
        (device: DeviceType) => !deny.includes(device.id)
    );

    // 5. Return device IDs only
    return accessibleDevices.map(device => device.id);
}

// =====================================================================

export default UserController;
