import { FastifyRequest, FastifyReply } from "fastify";
import { Asset } from "../../models/asset.model";
import { ApiResponse } from "../../types/api-response.type";
import { logger } from "../../utils/logger.utils";
import { AccessProfileController } from "./access-profile.controller";
import { Device } from "../../models/device.model";
import { Prisma } from "../../../generated/prisma";
import z from "zod";
import { AssetDestroyBody, AssetStoreBody } from "../schemas/asset.scheme";



class AssetController {

    // List all assets
    static async index(request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = await Asset.getAll();
            return reply.send({
                success: true,
                message: "Assets fetched",
                data: {
                    count: result.length,
                    assets: result
                }
            } as ApiResponse);
        } catch (err) {
            logger.error({ err }, "! AssetController index !");
            return reply.status(500).send({
                success: false,
                message: "Failed to fetch assets.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === "true" ? err : undefined,
                },
            } as ApiResponse);
        }
    }

    // -----------------------------------------------------------------

    // Create new asset, optionally with attached device
    static async store(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { name, asset_type, organisation_id, device_id } = (request as any).body;

            // Organisation access check
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!, request.userID!
            );
            if (!accessibleOrgsByUser.includes(organisation_id)) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to create an asset for this organisation.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details: process.env.DEBUG === "true" ? {
                            requested_org_id: organisation_id,
                            accessible_org_ids: accessibleOrgsByUser,
                        } : undefined,
                    },
                } as ApiResponse);
            }

            // If a device is to be attached, validate device existence is is not already att and org match
            if (device_id) {
                const device = await Device.getByID(device_id);
                if (!device) {
                    return reply.status(404).send({
                        success: false,
                        message: "Device not found. Cannot attach a non-existent device to Asset.",
                        error: {
                            code: "DEVICE_NOT_FOUND",
                            details: process.env.DEBUG === "true" ? { requested_device_id: device_id } : undefined,
                        },
                    } as ApiResponse);
                }

                if (device.asset_id != null) {
                    return reply.status(409).send({
                        success: false,
                        message: "Device is already attached to another asset.",
                        error: {
                            code: "DEVICE_ALREADY_ATTACHED",
                            details: process.env.DEBUG === "true" ? {
                                attached_asset_id: device.asset_id,
                                requested_asset_name: name, // optional
                            } : undefined,
                        },
                    } as ApiResponse);
                }

                if (String(device.organisation_id) !== organisation_id) {
                    return reply.status(409).send({
                        success: false,
                        message: "Device belongs to a different organisation. Device cannot be set to Asset.",
                        error: {
                            code: "ORG_DEVICE_MISMATCH",
                            details: process.env.DEBUG === "true" ? {
                                device_org_id: device.organisation_id,
                                requested_org_id: organisation_id,
                            } : undefined,
                        },
                    } as ApiResponse);
                }
            }

            // Build payload and create asset (attach device if provided)
            const assetData: any = {
                name,
                asset_type,
                organisations: { connect: { id: BigInt(organisation_id) } },
            };
            if (device_id) {
                assetData.devices = { connect: { id: BigInt(device_id) } };
            }

            const result = await Asset.create(assetData);
            return reply.status(201).send({
                success: true,
                message: "Asset created successfully.",
                data: result,
            } as ApiResponse);

        } catch (err: unknown) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    return reply.status(409).send({
                        success: false,
                        message: "Asset already exists.",
                        error: { code: "DUPLICATE" },
                    });
                }
                if (err.code === "P2003") {
                    return reply.status(400).send({
                        success: false,
                        message: "Foreign key constraint failed (check organisation_id / device_id).",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }
            }
            logger.error({ err }, "! AssetController store !");
            return reply.status(500).send({
                success: false,
                message: "Failed to create asset.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === "true" ? err : undefined,
                },
            });
        }
    }

    // -----------------------------------------------------------------

    // In AssetController.ts

    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const assetID = (request as any).params.id;
            if (!assetID) {
                return reply.status(400).send({
                    success: false,
                    message: "Missing asset id in route params.",
                    error: { code: "BAD_REQUEST" },
                } as ApiResponse);
            }

            // Fetch existing asset
            const existing = await Asset.getByID(assetID);
            if (!existing) {
                return reply.status(404).send({
                    success: false,
                    message: "Asset not found.",
                    error: { code: "ASSET_NOT_FOUND" },
                } as ApiResponse);
            }

            // Extract updatable fields (partial update)
            const {
                name,
                asset_type,
                organisation_id,
                device_id,   // string to attach, null to detach, undefined = no change
            } = request.body as Partial<{
                name: string;
                asset_type: string;
                organisation_id: string;
                device_id: string | null;
            }>;

            // Org access check on the final/target org
            const targetOrgID = organisation_id ?? String(existing.organisation_id);
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!, request.userID!
            );
            if (!accessibleOrgsByUser.includes(String(targetOrgID))) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to update an asset for this organisation.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details: process.env.DEBUG === "true"
                            ? { requested_org_id: targetOrgID, accessible_org_ids: accessibleOrgsByUser }
                            : undefined,
                    },
                } as ApiResponse);
            }

            // Device attach/detach validations (if requested)
            if (typeof device_id !== "undefined") {
                if (device_id === null) {
                    // explicit detach -> ok
                } else {
                    const dev = await Device.getByID(device_id);
                    if (!dev) {
                        return reply.status(404).send({
                            success: false,
                            message: "Device not found. Cannot attach a non-existent device to Asset.",
                            error: {
                                code: "DEVICE_NOT_FOUND",
                                details: process.env.DEBUG === "true" ? { requested_device_id: device_id } : undefined,
                            },
                        } as ApiResponse);
                    }

                    // If already attached to another asset (not this one), reject
                    if (dev.asset_id != null && String(dev.asset_id) !== String(existing.id)) {
                        return reply.status(409).send({
                            success: false,
                            message: "Device is already attached to another asset.",
                            error: {
                                code: "DEVICE_ALREADY_ATTACHED",
                                details: process.env.DEBUG === "true" ? { attached_asset_id: dev.asset_id } : undefined,
                            },
                        } as ApiResponse);
                    }

                    // Org must match final asset org
                    const finalOrgID = targetOrgID;
                    if (String(dev.organisation_id) !== String(finalOrgID)) {
                        return reply.status(409).send({
                            success: false,
                            message: "Device belongs to a different organisation. Device cannot be set to Asset.",
                            error: {
                                code: "ORG_DEVICE_MISMATCH",
                                details: process.env.DEBUG === "true"
                                    ? { device_org_id: dev.organisation_id, requested_org_id: finalOrgID }
                                    : undefined,
                            },
                        } as ApiResponse);
                    }
                }
            }

            // ---------------- Validations for critical empties ----------------

            const isEmpty = (v: unknown) =>
                v === null || v === undefined || (typeof v === "string" && v.trim() === "");

            // Critical: cannot be set to empty/null; if already empty in DB, must be provided
            const CRITICAL = ["name", "asset_type", "organisation_id"] as const;

            const body = request.body as Record<string, unknown>;
            const fieldErrors: Record<string, string[]> = {};

            // If any critical field is already empty in DB → require it now
            if (isEmpty(existing.name)) fieldErrors["name"] = ["Field cannot be empty."];
            if (isEmpty(existing.asset_type)) fieldErrors["asset_type"] = ["Field cannot be empty."];
            if (isEmpty(existing.organisation_id)) fieldErrors["organisation_id"] = ["Field cannot be empty."];

            // If client provided any critical field as empty → reject
            for (const k of CRITICAL) {
                if (k in body && isEmpty(body[k])) fieldErrors[k] = ["Field cannot be empty."];
            }

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

            // ----------------------- Build Prisma update ----------------------

            const data: Prisma.assetsUpdateInput = {};
            if (typeof name !== "undefined") data.name = name;
            if (typeof asset_type !== "undefined") data.asset_type = asset_type;
            if (typeof organisation_id !== "undefined") {
                data.organisations = { connect: { id: BigInt(organisation_id) } };
            }
            if (typeof device_id !== "undefined") {
                data.devices = device_id
                    ? { set: [{ id: BigInt(device_id) }] } // attach/replace with this one
                    : { set: [] };                         // detach all
            }

            // No-op guard
            if (Object.keys(data).length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "At least one field must be provided to update.",
                    error: { code: "EMPTY_UPDATE" },
                } as ApiResponse);
            }

            // Update
            const updated = await Asset.updateByID(assetID, data);

            return reply.send({
                success: true,
                message: "Asset updated successfully.",
                data: updated,
            } as ApiResponse);

        } catch (err: any) {
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    return reply.status(409).send({
                        success: false,
                        message: "Asset already exists.",
                        error: { code: "DUPLICATE" },
                    });
                }
                if (err.code === "P2003") {
                    return reply.status(400).send({
                        success: false,
                        message: "Foreign key constraint failed (check organisation_id / device_id).",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }
                if (err.code === "P2025") {
                    return reply.status(404).send({
                        success: false,
                        message: "Asset not found.",
                        error: { code: "ASSET_NOT_FOUND" },
                    });
                }
            }

            logger.error({ err }, "! AssetController update !");
            return reply.status(500).send({
                success: false,
                message: "Failed to update asset.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === "true" ? err : undefined,
                },
            } as ApiResponse);
        }
    }


    // -----------------------------------------------------------------

    // Delete assets by IDs    
    static async destroy(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { asset_ids } = (request as any).body;
            if (!asset_ids || asset_ids.length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "No asset IDs provided.",
                    data: { count: 0 },
                } as ApiResponse);
            }

            // Delete from DB
            const result = await Asset.deleteByIDs(asset_ids);

            let message: string;
            switch (result.count) {
                case 0:
                    message = "No assets were deleted."; break;
                case 1:
                    message = `1 asset deleted.`; break;
                default:
                    message = `${result.count} assets deleted.`; break;
            }

            return reply.send({
                success: true,
                message,
                data: { count: result.count, asset_ids },
            } as ApiResponse);

        } catch (err) {
            logger.error({ err }, "! AssetController destroy !");
            return reply.status(500).send({
                success: false,
                message: "Failed to delete assets.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === "true" ? err : undefined,
                },
            });
        }
    }
}

export default AssetController;
