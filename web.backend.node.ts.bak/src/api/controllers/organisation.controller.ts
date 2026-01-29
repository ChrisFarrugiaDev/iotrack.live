import { FastifyReply, FastifyRequest } from "fastify";
import * as organisationSchema from "../schemas/organisation.schema";
import * as redisUtils from '../../utils/redis.utils';
import z from "zod";
import { logger } from "../../utils/logger.utils";
import { AccessProfileController } from "./access-profile.controller";
import { ApiResponse } from "../../types/api-response.type";
import { Organisation, OrganisationType } from "../../models/organisation.model";
import { organisationToPublic } from "../dto/organisation.dto";
import { Prisma } from "../../../generated/prisma";
import prisma from "../../config/prisma.config";


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

            // Child check — do not allow deleting a parent with children
            for (const org of organisations) {
                const hasKids = await Organisation.hasChildren(org.id);
                if (hasKids) {
                    return reply.status(400).send({
                        success: false,
                        message: `Organisation "${org.name}" cannot be deleted because it has sub-organisations.`,
                        data: { organisationId: org.id },
                    });
                }
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

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const orgID = (request as any).params.id;

            // ---------------------------------------------
            // 0. Validate route param
            // ---------------------------------------------
            if (!orgID) {
                return reply.status(400).send({
                    success: false,
                    message: "Missing organisation id in route params.",
                    error: { code: "BAD_REQUEST" },
                });
            }

            // ---------------------------------------------
            // 1. Check if org exists
            // ---------------------------------------------
            const existing = await Organisation.getById(orgID);
            if (!existing) {
                return reply.status(404).send({
                    success: false,
                    message: "Organisation not found.",
                    error: { code: "ORGANISATION_NOT_FOUND" },
                });
            }

            // ---------------------------------------------
            // 2. Extract allowed update fields from body
            // ---------------------------------------------
            const {
                name,
                parent_org_id,
                maps_api_key,
                can_inherit_key,
                attributes,
            } = request.body as Partial<{
                name: string;
                parent_org_id: string | null;
                maps_api_key: string | null;
                can_inherit_key: boolean;
                attributes: Record<string, any>;
            }>;

            // ---------------------------------------------
            // 3. Access control — verify user can update this org
            // ---------------------------------------------
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!,
                request.userID!
            );

            if (!accessibleOrgsByUser.includes(existing.id)) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to update this organisation.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details:
                            process.env.DEBUG === "true"
                                ? {
                                    requested_org_id: existing.id,
                                    accessible_org_ids: accessibleOrgsByUser,
                                }
                                : undefined,
                    },
                } as ApiResponse);
            }

            // ---------------------------------------------
            // 4. Input validation for critical fields
            // ---------------------------------------------
            const isEmpty = (v: unknown) =>
                v === null ||
                v === undefined ||
                (typeof v === "string" && v.trim() === "");

            const CRITICAL: Array<keyof typeof existing> = ["name", "can_inherit_key"];

            const fieldErrors: Record<string, string[]> = {};
            const body = request.body as Record<string, unknown>;

            // Check DB first (critical fields missing in DB)
            if (isEmpty(existing.name))
                fieldErrors["name"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.can_inherit_key))
                fieldErrors["can_inherit_key"] = ["Field cannot be empty (missing in DB)."];

            // Validate user-provided values
            for (const field of CRITICAL) {
                if (field in body) {
                    if (isEmpty(body[field])) {
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
            const data: Prisma.organisationsUpdateInput = {};

            // Parent org update
            if (parent_org_id === undefined) {
                // do nothing
            } else if (parent_org_id === null) {
                data.organisations = { disconnect: true };
            } else {
                data.organisations = { connect: { id: BigInt(parent_org_id) } };
            }

            // Other fields
            if (typeof name !== "undefined") data.name = name;
            if (typeof maps_api_key !== "undefined") data.maps_api_key = maps_api_key;
            if (typeof can_inherit_key !== "undefined") data.can_inherit_key = can_inherit_key;
            if (typeof attributes !== "undefined") data.attributes = attributes as any;

            // Reject empty update
            if (Object.keys(data).length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "At least one field must be provided to update.",
                    error: { code: "EMPTY_UPDATE" },
                });
            }

            // ---------------------------------------------
            // 6. Atomic DB update + hierarchy recalculation
            // ---------------------------------------------
            const updatedOrgs = await prisma.$transaction(async (tx) => {
                // (A) Update this organisation
                const updated = await Organisation.updateByID(orgID, data, tx);

                // (B) If parent changed → recalculate all paths
                if (data.organisations !== undefined) {
                    await Organisation.updatePaths(BigInt(updated.id), tx);
                }

                // (C) Re-fetch all organisations accessible by this user
                const orgIDs = await AccessProfileController.computeAccessibleOrganisationIds(
                    orgID,
                    request.userID!
                );

                const orgs = await Organisation.getByIds(orgIDs, tx);
                return orgs;
            });

            // ---------------------------------------------
            // 7. Async Redis cache update (best effort)
            // ---------------------------------------------
            (async () => {
                try {
                    if (updatedOrgs && updatedOrgs.length > 0) {
                       
                        for (const org of updatedOrgs) {
                            await redisUtils.hadd("organisations", org.id, org, "iotrack.live:");
                        }
                    } 
                } catch (e) {
                    logger.error({ err: e }, "Redis cache update failed");
                }
            })();

            // Transform for public API output
            const organisationsPublic = await Promise.all(
                updatedOrgs!.map((org) => organisationToPublic(org))
            );

            // ---------------------------------------------
            // 8. Successful response
            // ---------------------------------------------
            return reply.send({
                success: true,
                message: "Organisation updated successfully.",
                data: { organisations: organisationsPublic },
            } as ApiResponse);

        } catch (err) {
            logger.error({ err }, "! OrganisationController update !");

            return reply.status(500).send({
                success: false,
                message: "Failed to update organisation.",
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