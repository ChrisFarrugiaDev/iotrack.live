import { FastifyReply, FastifyRequest } from "fastify";
import z from "zod";
import { logger } from "../../utils/logger.utils";
import { ApiResponse } from "../../types/api-response.type";
import { WhiteLabel } from "../../models/white-label.model";
import { updateSchema } from "../schemas/white-label.schema";

// ---------------------------------------------------------------------

const ROOT_ORG_ID = "1";

type UpdateBody = z.infer<typeof updateSchema>;

class WhiteLabelController {

    // Public endpoint (no auth) — used by the login screen before authentication.
    // Resolves branding by request hostname first, then falls back to the root
    // organisation's effective config. Never fails: returns empty config on error
    // so the login screen always renders (with built-in defaults).
    static async getPublic(request: FastifyRequest, reply: FastifyReply) {
        try {
            const host = (request.headers.host ?? "").split(":")[0].toLowerCase();

            let config = host ? await WhiteLabel.getByDomain(host) : null;

            if (!config) {
                config = await WhiteLabel.getEffectiveByOrgId(ROOT_ORG_ID);
            }

            return reply.send({
                success: true,
                data: {
                    white_label: config ? {
                        app_title: config.app_title,
                        login_bg_url: config.login_bg_url,
                        login_fg_url: config.login_fg_url,
                    } : null,
                },
            } as ApiResponse);

        } catch (err) {
            logger.error({ err }, "! WhiteLabelController getPublic !");
            return reply.send({
                success: true,
                data: { white_label: null },
            } as ApiResponse);
        }
    }

    // Returns the requesting user's org own white label row (not inherited) —
    // this is what the edit form shows.
    static async get(request: FastifyRequest, reply: FastifyReply) {
        try {
            const whiteLabel = await WhiteLabel.getByOrgId(request.userOrgID!);

            return reply.send({
                success: true,
                data: { white_label: whiteLabel },
            } as ApiResponse);

        } catch (err) {
            logger.error({ err }, "! WhiteLabelController get !");
            return reply.status(500).send({
                success: false,
                message: "Failed to fetch white label settings.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            } as ApiResponse);
        }
    }

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const body = request.body as UpdateBody;

            // Normalise empty strings to null so cleared fields are stored as NULL
            // (also avoids unique-constraint collisions on empty domain values).
            const data: Record<string, string | null> = {};
            for (const key of ["domain", "app_title", "login_bg_url", "login_fg_url"] as const) {
                if (typeof body[key] !== "undefined") {
                    data[key] = body[key] === "" ? null : body[key];
                }
            }

            const whiteLabel = await WhiteLabel.upsertForOrg(request.userOrgID!, data);

            return reply.send({
                success: true,
                message: "White label settings saved successfully.",
                data: { white_label: whiteLabel },
            } as ApiResponse);

        } catch (err) {
            logger.error({ err }, "! WhiteLabelController update !");

            // Unique violation on domain
            if (err instanceof Error && err.message.includes("Unique constraint")) {
                return reply.status(400).send({
                    success: false,
                    message: "Invalid input.",
                    error: {
                        code: "INVALID_INPUT",
                        details: { fieldErrors: { domain: ["This domain is already in use."] } },
                    },
                } as ApiResponse);
            }

            return reply.status(500).send({
                success: false,
                message: "Failed to save white label settings.",
                error: {
                    code: "SERVER_ERROR",
                    error:
                        process.env.DEBUG === "true" && err instanceof Error
                            ? err.message
                            : undefined,
                },
            } as ApiResponse);
        }
    }
}

// ---------------------------------------------------------------------

export default WhiteLabelController;
