import { FastifyReply, FastifyRequest } from "fastify";
import * as organisationSchema from "../schemas/organisation.schema";
import z from "zod";
import { logger } from "../../utils/logger.utils";
import { AccessProfileController } from "./access-profile.controller";
import { ApiResponse } from "../../types/api-response.type";
import { Organisation } from "../../models/organisation.model";

// ---------------------------------------------------------------------

class OrganisationController {
    static async store(request: FastifyRequest, reply: FastifyReply) {

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


        // // 2. Ensure name is unique
        // const userExists = await Organisation.getByEmail(data.email);
        // if (userExists) {
        //     return reply.status(400).send({
        //         success: false,
        //         message: "Email already exists.",
        //         error: { code: "EMAIL_EXISTS" },
        //     });
        // }

        

        logger.debug(data);



    }
}

// ---------------------------------------------------------------------

export default OrganisationController;