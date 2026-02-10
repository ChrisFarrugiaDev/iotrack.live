import { FastifyRequest, FastifyReply } from "fastify";
import { Group } from "../../models/group.model";

import * as groupSchema from "../schemas/group.schema";
import z from "zod";
import { logger } from "../../utils/logger.utils";
import { ApiResponse } from "../../types/api-response.type";


class GroupController {
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
}

// ---------------------------------------------------------------------

export default GroupController;