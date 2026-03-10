import { FastifyRequest, FastifyReply } from "fastify";
import { Group } from "../../models/group.model";

import * as groupSchema from "../schemas/group.schema";
import z from "zod";
import { logger } from "../../utils/logger.utils";
import { ApiResponse } from "../../types/api-response.type";
import { Prisma } from "../../../generated/prisma";
import prisma from "../../config/prisma.config";
import { GroupAsset, GroupAssetType, } from "../../models/group-asset.model";
import { GroupDevice } from "../../models/goup-device.model";
import { GroupOrganisation } from "../../models/group-organisation.model";
import { GroupUser } from "../../models/group-user.model";


class GroupController {

    static async index(request: FastifyRequest, reply: FastifyReply) {
        try {

            const groupID = (request as any).params.id;

            if (!groupID) {
                return reply.status(400).send({
                    success: false,
                    message: "Missing group id in route params.",
                    error: { code: "BAD_REQUEST" },
                });
            }

            // --------------------------------------------------
            // 1️ Check group exists
            // --------------------------------------------------

            const existing = await Group.getByID(groupID);

            if (!existing) {
                return reply.status(404).send({
                    success: false,
                    message: "Group not found.",
                    error: { code: "GROUP_NOT_FOUND" },
                });
            }

            // --------------------------------------------------
            // 2️ Organisation access check
            // --------------------------------------------------

            if (String(existing.organisation_id) !== String(request.userOrgID)) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have access to this group.",
                    error: { code: "ORG_ACCESS_DENIED" },
                });
            }

            // --------------------------------------------------
            // 3️ Load pivot entities based on type
            // --------------------------------------------------

        let entityKey = "";
        let entityIds: string[] = [];

        if (existing.type === "asset") {
            const rows = await GroupAsset.getByGroupId(existing.id);
            entityIds = rows.map(r => String(r.asset_id));
            entityKey = "asset_ids";
        }

        if (existing.type === "device") {
            const rows = await GroupDevice.getByGroupId(existing.id);
            entityIds = rows.map(r => String(r.device_id));
            entityKey = "device_ids";
        }

        if (existing.type === "organisation") {
            const rows = await GroupOrganisation.getByGroupId(existing.id);
            entityIds = rows.map(r => String(r.organisation_id));
            entityKey = "organisation_ids";
        }

        if (existing.type === "user") {
            const rows = await GroupUser.getByGroupId(existing.id);
            entityIds = rows.map(r => String(r.user_id));
            entityKey = "user_ids";
        }

            // --------------------------------------------------
            // 4️ Response
            // --------------------------------------------------

        return reply.send({
            success: true,
            message: "Group fetched successfully.",
            data: {
                group: existing,
                [entityKey]: entityIds
            },
        } as ApiResponse);

        } catch (err: unknown) {

            logger.error({ err }, "! GroupController index !");

            return reply.status(500).send({
                success: false,
                message: "Failed to fetch group.",
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



    static async store(request: FastifyRequest, reply: FastifyReply) {

        try {

            // Validate request body with Zod schema
            const parsed = groupSchema.storeSchema.safeParse(request.body);

            if (!parsed.success) {
                return reply.status(400).send({
                    success: false,
                    errors: z.flattenError(parsed.error),
                });
            }
            const data = parsed.data;


            // Ensure name is unique
            const grpExists = await Group.getByNameAndOrgId(data.name, request.userOrgID!);
            if (grpExists) {
                return reply.status(400).send({
                    success: false,
                    message: "A group with this name already exists.",
                    error: { code: "GROUP_NAME_ALREADY_EXISTS" },
                });
            }

            const groupData = {
                name: data.name,
                type: data.type,
                organisations: {
                    connect: {
                        id: BigInt(request.userOrgID!)
                    }
                }
            };



            const group = await Group.create(groupData);


            return reply.send({
                success: true,
                message: "Group created successfully.",
                data: { group: group },
            } as ApiResponse);



        } catch (err: unknown) {
            logger.error(
                { err },
                "! GroupController store !"
            );
            return reply.status(500).send({
                success: false,
                message: "Failed to create group.",
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

    static async destroy(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { group_ids } = (request as any).body;

            if (!group_ids || group_ids.length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "No group IDs provided.",
                    data: { count: 0 },
                });
            }

            // Fetch groups
            const groups = await Group.getByIds(group_ids);


            if (!groups || groups.length == 0) {
                return reply.status(404).send({
                    success: false,
                    message: "No matching groups were found to delete.",
                    data: { count: 0 },
                });
            }

            // Delete from DB
            const result = await Group.deleteByIDs(group_ids);


            // Response
            return reply.send({
                success: true,
                message:
                    result.count === 1
                        ? "Group deleted successfully."
                        : `${result.count} groups were deleted successfully.`,
                data: { count: result.count, group_ids },
            });

        } catch (err) {
            logger.error({ err }, "! GroupController destroy !");

            return reply.status(500).send({
                success: false,
                message: "Failed to delete groups.",
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

            const groupID = (request as any).params.id;

            if (!groupID) {
                return reply.status(400).send({
                    success: false,
                    message: "Missing group id in route params.",
                    error: { code: "BAD_REQUEST" },
                });
            }

            // --- Validate Body ---------------------------------------

            const parsed = groupSchema.updateSchema.safeParse(request.body);

            if (!parsed.success) {
                return reply.status(400).send({
                    success: false,
                    errors: z.flattenError(parsed.error),
                });
            }

            const data = parsed.data;

            // --- Fetch Existing --------------------------------------

            const existing = await Group.getByID(groupID);

            if (!existing) {
                return reply.status(404).send({
                    success: false,
                    message: "Group not found.",
                    error: { code: "GROUP_NOT_FOUND" },
                });
            }

            // --- Prevent Type Change ---------------------------------

            if (data.type && data.type !== existing.type) {
                return reply.status(400).send({
                    success: false,
                    message: "Group type cannot be changed.",
                    error: { code: "GROUP_TYPE_IMMUTABLE" },
                });
            }

            // --- Name Uniqueness -------------------------------------

            if (data.name && data.name !== existing.name) {
                const nameExists = await Group.getByNameAndOrgId(
                    data.name,
                    existing.organisation_id
                );

                if (nameExists) {
                    return reply.status(409).send({
                        success: false,
                        message: "A group with this name already exists.",
                        error: { code: "GROUP_NAME_ALREADY_EXISTS" },
                    });
                }
            }

            const groupData: Prisma.groupsUpdateInput = {};

            if (typeof data.name !== "undefined") {
                groupData.name = data.name;
            }

            const updated = await prisma.$transaction(async (tx) => {

                // =========================================================
                // ASSET GROUP
                // =========================================================
                if (existing.type === "asset" && data.entities_ids) {

                    await GroupAsset.deleteByGroupID(existing.id, tx);

                    if (data.entities_ids.length > 0) {
                        const rows = data.entities_ids.map(id => ({
                            group_id: BigInt(existing.id),
                            asset_id: BigInt(id),
                        }));

                        await GroupAsset.createMany(rows, tx);
                    }

                    groupData.items = data.entities_ids.length;
                }

                // =========================================================
                // DEVICE GROUP
                // =========================================================
                if (existing.type === "device" && data.entities_ids) {

                    await GroupDevice.deleteByGroupID(existing.id, tx);

                    if (data.entities_ids.length > 0) {
                        const rows = data.entities_ids.map(id => ({
                            group_id: BigInt(existing.id),
                            device_id: BigInt(id),
                        }));

                        await GroupDevice.createMany(rows, tx);
                    }

                    groupData.items = data.entities_ids.length;
                }

                // =========================================================
                // ORGANISATION GROUP
                // =========================================================
                if (existing.type === "organisation" && data.entities_ids) {

                    await GroupOrganisation.deleteByGroupID(existing.id, tx);

                    if (data.entities_ids.length > 0) {
                        const rows = data.entities_ids.map(id => ({
                            group_id: BigInt(existing.id),
                            organisation_id: BigInt(id),
                        }));

                        await GroupOrganisation.createMany(rows, tx);
                    }

                    groupData.items = data.entities_ids.length;
                }

                // =========================================================
                // USER GROUP
                // =========================================================
                if (existing.type === "user" && data.entities_ids) {

                    await GroupUser.deleteByGroupID(existing.id, tx);

                    if (data.entities_ids.length > 0) {
                        const rows = data.entities_ids.map(id => ({
                            group_id: BigInt(existing.id),
                            user_id: BigInt(id),
                        }));

                        await GroupUser.createMany(rows, tx);
                    }

                    groupData.items = data.entities_ids.length;
                }

                // =========================================================
                // UPDATE GROUP RECORD
                // =========================================================

                let updatedGroup = existing;

                if (Object.keys(groupData).length > 0) {
                    updatedGroup = await Group.updateByID(
                        existing.id,
                        groupData,
                        tx
                    );
                }

                return updatedGroup;
            });

            return reply.send({
                success: true,
                message: "Group updated successfully.",
                data: { group: updated },
            });

        } catch (err: any) {

            if (err instanceof Prisma.PrismaClientKnownRequestError) {

                if (err.code === "P2002") {
                    return reply.status(409).send({
                        success: false,
                        message: "Duplicate group.",
                        error: { code: "DUPLICATE" },
                    });
                }

                if (err.code === "P2003") {
                    return reply.status(400).send({
                        success: false,
                        message: "Foreign key constraint failed.",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }

                if (err.code === "P2025") {
                    return reply.status(404).send({
                        success: false,
                        message: "Group not found.",
                        error: { code: "GROUP_NOT_FOUND" },
                    });
                }
            }

            logger.error({ err }, "! GroupController update !");

            return reply.status(500).send({
                success: false,
                message: "Failed to update group.",
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


// ---------------------------------------------------------------------

export default GroupController;