import { FastifyReply, FastifyRequest } from "fastify";
import * as organisationSchema from "../schemas/organisation.schema";
import * as redisUtils from '../../utils/redis.utils';
import z from "zod";
import { logger } from "../../utils/logger.utils";
import { AccessProfileController } from "./access-profile.controller";
import { ApiResponse } from "../../types/api-response.type";
import { Organisation, OrganisationType } from "../../models/organisation.model";
import { organisationToPublic } from "../dto/organisation.dto";

// ---------------------------------------------------------------------

class OrganisationController {
    static async store(request: FastifyRequest, reply: FastifyReply) {

        try {


            // Validate request body with Zod schema
            const parsed = organisationSchema.storeSchema.safeParse(request.body);

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
            if (!accessibleOrgsByUser.includes(data.parent_org_id)) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to create a user for this organisation.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details: process.env.DEBUG === "true" ? {
                            requested_org_id: data.parent_org_id,
                            accessible_org_ids: accessibleOrgsByUser,
                        } : undefined,
                    },
                } as ApiResponse);
            }


            // 2. Ensure name is unique
            const orgExists = await Organisation.getByName(data.name);
            if (orgExists) {
                return reply.status(400).send({
                    success: false,
                    message: "An organisation with this name already exists.",
                    error: { code: "ORG_NAME_ALREADY_EXISTS" },
                });
            }

            const orgData = {
                name: data.name,
                parent_org_id: data.parent_org_id,
                can_inherit_key: data.can_inherit_key,
                maps_api_key: data.maps_api_key ?? '',
            };

            const organisation = await Organisation.create(orgData);

            await redisUtils.hadd('organisations', organisation.id, organisation, 'iotrack.live:');

            const safeOrganisation = await organisationToPublic(organisation);


            return reply.send({
                success: true,
                message: "Organisation created successfully.",
                data: { organisation: safeOrganisation },
            } as ApiResponse);


        } catch (err) {
            logger.error(
                { err },
                "! OrganisationController store !"
            );
            return reply.status(500).send({
                success: false,
                message: "Failed to create organisation.",
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
            const { organisation_ids } = (request as any).body;

            if (!organisation_ids || organisation_ids.length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "No organisation IDs provided.",
                    data: { count: 0 },
                });
            }

            const organisations = await Organisation.getByIds(organisation_ids);

            if (!organisations || organisations.length == 0) {
                return reply.status(404).send({
                    success: false,
                    message: "No matching organisations were found to delete.",
                    data: { count: 0 },
                });
            }

            // Delete from DB
            const result = await Organisation.deleteByIDs(organisation_ids);

            // Best-effort Redis cleanup (don’t fail request if this errors)
            (async () => {
                try {
                    await redisUtils.hdel("organisations", organisation_ids, "iotrack.live:");
                } catch (e) {
                    logger.error({ err: e }, "Redis cleanup failed in OrganisationController.destroy");
                }
            })();

            // Response
            return reply.send({
                success: true,
                message:
                    result.count === 1
                        ? "Organisation deleted successfully."
                        : `${result.count} organisations were deleted successfully.`,
                data: { count: result.count, organisation_ids },
            });

        } catch (err) {

            logger.error({ err }, "! OrganisationController destroy !");

            return reply.status(500).send({
                success: false,
                message: "Failed to delete organisations.",
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

export default OrganisationController;