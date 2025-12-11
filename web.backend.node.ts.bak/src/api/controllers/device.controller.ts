import { FastifyRequest, FastifyReply } from "fastify";
import { ApiResponse } from "../../types/api-response.type";
import { Device } from "../../models/device.model";
import { logger } from "../../utils/logger.utils";
import * as redisUtils from "../../utils/redis.utils";
import { Prisma } from "../../../generated/prisma";
import { AccessProfileController } from "./access-profile.controller";
import { Asset } from "../../models/asset.model";

class DeviceController {

    static async index(request: FastifyRequest, reply: FastifyReply) {
        try {
            const result = await Device.getAll();
            return reply.send({
                success: true,
                message: "Devices fetched.",
                data: {
                    count: result.length,
                    devices: result
                },
            });
        } catch (err) {
            logger.error({ err }, "! DeviceController index !");
            return reply.status(500).send({
                success: false,
                message: "Failed to fetch devices.",
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
    static async get(request: FastifyRequest, reply: FastifyReply) {
        try {
            const id = (request as any).params.id;

            const device = await Device.getByID(id);
            if (!device) {
                return reply.status(404).send({
                    success: false,
                    message: "Device not found.",
                    error: { code: "DEVICE_NOT_FOUND" },
                });
            }

            // Org access check: user must have access to the device's organisation
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!, request.userID!
            );
            if (!accessibleOrgsByUser.includes(String(device.organisation_id))) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to view this device.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details: process.env.DEBUG === "true"
                            ? { device_org_id: device.organisation_id, accessible_org_ids: accessibleOrgsByUser }
                            : undefined,
                    },
                } as ApiResponse);
            }

            return reply.send({
                success: true,
                message: "Device fetched.",
                data: { device },
            });
        } catch (err: any) {
            logger.error({ err }, "! DeviceController get !");
            return reply.status(500).send({
                success: false,
                message: "Failed to fetch device.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === "true" && err instanceof Error ? err.message : undefined,
                },
            });
        }
    }

    // -----------------------------------------------------------------
    // TODO:  Test this method
    static async list(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { page, limit, sort_by, order } = (request as any).query;
            const skip = (page - 1) * limit;

            const [items, total] = await Promise.all([
                Device.list({ skip, take: limit, sortBy: sort_by, order }),
                Device.count(),
            ]);

            return reply.send({
                success: true,
                message: "Devices fetched.",
                data: {
                    items,
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    sort_by,
                    order,
                },
            });
        } catch (err) {
            logger.error({ err }, "! DeviceController index !");
            return reply.status(500).send({
                success: false,
                message: "Failed to fetch devices.",
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

    static async destroy(request: FastifyRequest, reply: FastifyReply) {
        try {
            const { device_ids } = (request as any).body;

            if (!device_ids || device_ids.length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "No device IDs provided.",
                    data: { count: 0 },
                });
            }

            // Map DB IDs -> external_ids to clean Redis later
            const external_ids = await Device.getExternalIDsByIDs(device_ids);

            if (!external_ids || external_ids.length === 0) {
                return reply.status(404).send({
                    success: false,
                    message: "No matching devices were found to delete.",
                    data: { count: 0 },
                });
            }

            // Delete from DB
            const result = await Device.deleteByIDs(device_ids);

            // Best-effort Redis cleanup (don’t fail request if this errors)
            (async () => {
                try {
                    await redisUtils.hdel("devices", external_ids, "iotrack.live:");
                } catch (e) {
                    logger.error({ err: e }, "Redis cleanup failed in DeviceController.destroy");
                }
            })();

            return reply.send({
                success: true,
                message:
                    result.count === 1
                        ? "Device deleted successfully."
                        : `${result.count} devices were deleted successfully.`,
                data: { count: result.count, device_ids },
            });
            
        } catch (err: unknown) {

            logger.error({ err }, "! DeviceController destroy !");
            
            return reply.status(500).send({
                success: false,
                message: "Failed to delete devices.",
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

    static async store(request: FastifyRequest, reply: FastifyReply) {
        try {
            const {
                organisation_id,
                asset_id,
                external_id,
                external_id_type,
                protocol,
                vendor,
                model,
                status,
                attributes,
            } = (request as any).body;

            // Ensure the device's organisation belongs to the user's accessible orgs (own or child).
            // Otherwise return 403 Forbidden.
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!, request.userID!
            );

            if (!accessibleOrgsByUser.includes(organisation_id)) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to create a device for this organisation.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details: process.env.DEBUG === "true" ? {
                            requested_org_id: organisation_id,
                            accessible_org_ids: accessibleOrgsByUser,
                        } : undefined,
                    },
                } as ApiResponse);
            }

            // If a device is being attached to an asset, validate that the asset exists
            // and belongs to the same organisation as the device.
            if (asset_id) {
                const asset = await Asset.getByID(asset_id);

                if (!asset) {
                    return reply.status(404).send({
                        success: false,
                        message: "Asset not found. Cannot attach device to a non-existent asset.",
                        error: {
                            code: "ASSET_NOT_FOUND",
                            details: process.env.DEBUG === "true" ? { requested_asset_id: asset_id } : undefined,
                        },
                    } as ApiResponse);
                }

                if (asset.organisation_id !== organisation_id) {
                    // Ensure asset and device are under the same organisation
                    return reply.status(409).send({
                        success: false,
                        message: "Asset belongs to a different organisation. Device cannot be set to Asset.",
                        error: {
                            code: "ORG_ASSET_MISMATCH",
                            details: process.env.DEBUG === "true" ? {
                                asset_org_id: asset.organisation_id,
                                requested_org_id: organisation_id,
                            } : undefined,
                        },
                    } as ApiResponse);
                }
            }

            const deviceData = {
                organisation_id: BigInt(organisation_id),
                asset_id: asset_id ? BigInt(asset_id) : null,
                external_id,
                external_id_type,
                protocol,
                vendor,
                model,
                status,
                attributes,
            };

            // Create device in DB
            const result = await Device.create(deviceData); // recommend using upsert inside

            // Best-effort Redis cache add (won’t fail the request if Redis errors)
            (async () => {
                try {
                    await redisUtils.hadd(
                        "devices",
                        result.external_id,
                        result,
                        "iotrack.live:"
                    );
                } catch (e) {
                    logger.error({ err: e }, "Redis hadd failed in DeviceController.store");
                }
            })();

            return reply.status(201).send({
                success: true,
                message: "Device created  successfully.",
                data: { device: result },
            });
        } catch (err: unknown) {
            // Prisma-known errors
            if (err instanceof Prisma.PrismaClientKnownRequestError) {

                // Duplicate (unique constraint)
                if (err.code === "P2002") {
                    return reply.status(409).send({
                        success: false,
                        message:
                            "Device already exists (unique external_id + external_id_type).",
                        error: { code: "DUPLICATE" },
                    });
                }
                // Foreign key violation
                if (err.code === "P2003") {
                    return reply.status(400).send({
                        success: false,
                        message:
                            "Foreign key constraint failed (check organisation_id / asset_id).",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }
            }

            // Unknown / unhandled
            logger.error({ err }, "! DeviceController store !");
            return reply.status(500).send({
                success: false,
                message: "Failed to create device.",
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
    static async update(request: FastifyRequest, reply: FastifyReply) {
        try {
            const deviceID = (request as any).params.id;
            if (!deviceID) {
                return reply.status(400).send({
                    success: false,
                    message: "Missing device id in route params.",
                    error: { code: "BAD_REQUEST" },
                });
            }

            // Fetch the current device (for existence check + diffing/Redis cleanup)
            const existing = await Device.getByID(deviceID);
            if (!existing) {
                return reply.status(404).send({
                    success: false,
                    message: "Device not found.",
                    error: { code: "DEVICE_NOT_FOUND" },
                });
            }

            // Extract only fields that may be updated (partial update)
            const {
                organisation_id,
                asset_id,
                external_id,
                external_id_type,
                protocol,
                vendor,
                model,
                status,
                attributes,
            } = request.body as Partial<{
                organisation_id: string;
                asset_id: string | null;
                external_id: string;
                external_id_type: string;
                protocol: string;
                vendor: string;
                model: string;
                status: string;
                attributes: Record<string, any>;
            }>;

            // Guard: ensure user can act on the target organisation (new org if provided, else existing)
            const targetOrgID = organisation_id ?? existing.organisation_id;
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                request.userOrgID!,
                request.userID!
            );
            if (!accessibleOrgsByUser.includes(String(targetOrgID))) {
                return reply.status(403).send({
                    success: false,
                    message: "You don't have permission to update a device for this organisation.",
                    error: {
                        code: "ORG_ACCESS_DENIED",
                        details:
                            process.env.DEBUG === "true"
                                ? { requested_org_id: targetOrgID, accessible_org_ids: accessibleOrgsByUser }
                                : undefined,
                    },
                } as ApiResponse);
            }

            // If attaching to/detaching from an asset was requested, validate the asset
            if (typeof asset_id !== "undefined") {
                if (asset_id === null) {
                    // explicit detach is allowed; nothing to validate
                } else {
                    const asset = await Asset.getByID(asset_id);
                    if (!asset) {
                        return reply.status(404).send({
                            success: false,
                            message: "Asset not found. Cannot attach device to a non-existent asset.",
                            error: {
                                code: "ASSET_NOT_FOUND",
                                details: process.env.DEBUG === "true" ? { requested_asset_id: asset_id } : undefined,
                            },
                        } as ApiResponse);
                    }

                    // Use the organisation we’ll end up with after update
                    const finalOrgID = organisation_id ?? existing.organisation_id;

                    if (String(asset.organisation_id) !== String(finalOrgID)) {
                        // Ensure asset and device are under the same organisation
                        return reply.status(409).send({
                            success: false,
                            message: "Asset belongs to a different organisation. Device cannot be set to Asset.",
                            error: {
                                code: "ORG_ASSET_MISMATCH",
                                details:
                                    process.env.DEBUG === "true"
                                        ? { asset_org_id: asset.organisation_id, requested_org_id: finalOrgID }
                                        : undefined,
                            },
                        } as ApiResponse);
                    }
                }
            }

            // ------------------------

            const isEmpty = (v: unknown) => v === null || v === undefined || (typeof v === "string" && v.trim() === "");

            // Critical fields that can never be set to empty/null via update:
            const CRITICAL: Array<keyof typeof existing> = [
                "organisation_id",
                "external_id",
                "external_id_type",
                "vendor",
                "model",
                "protocol",
                "status",
            ];

            const body = request.body as Record<string, unknown>;
            const fieldErrors: Record<string, string[]> = {};

          

            // check existing DB (critical field already missing there)
            if (isEmpty(existing.external_id))      fieldErrors["external_id"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.external_id_type)) fieldErrors["external_id_type"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.vendor))           fieldErrors["vendor"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.model))            fieldErrors["model"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.protocol))         fieldErrors["protocol"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.status))           fieldErrors["status"] = ["Field cannot be empty (missing in DB)."];
            if (isEmpty(existing.organisation_id))  fieldErrors["organisation_id"] = ["Field cannot be empty (missing in DB)."];

            for (const k of CRITICAL) {
                if (k in body) {

                    if (isEmpty(body[k])) {
                        fieldErrors[k] = ["Field cannot be empty."];
                    } else {
                        delete  fieldErrors[k];
                    }
                }
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

            // ------------------

            // Build Prisma update payload (only include provided fields)
            const data: Prisma.devicesUpdateInput = {};
            if (typeof organisation_id !== "undefined") {
                data.organisations = { connect: { id: BigInt(organisation_id) } }; // ✅ use relation field
            }
            if (typeof asset_id !== "undefined") {
                data.assets = asset_id
                    ? { connect: { id: BigInt(asset_id) } }   // attach
                    : { disconnect: true };                   // detach
            }
            if (typeof external_id !== "undefined") data.external_id = external_id;
            if (typeof external_id_type !== "undefined") data.external_id_type = external_id_type;
            if (typeof protocol !== "undefined") data.protocol = protocol;
            if (typeof vendor !== "undefined") data.vendor = vendor;
            if (typeof model !== "undefined") data.model = model;
            if (typeof status !== "undefined") data.status = status;
            if (typeof attributes !== "undefined") data.attributes = attributes as any; // Prisma.JsonValue

            // No-op guard: reject empty body (nothing to update)
            if (Object.keys(data).length === 0) {
                return reply.status(400).send({
                    success: false,
                    message: "At least one field must be provided to update.",
                    error: { code: "EMPTY_UPDATE" },
                });
            }

            // Perform DB update
            const updated = await Device.updateByID(deviceID, data);

            // Refresh Redis cache (best-effort). If external_id changed, remove old key.
            (async () => {
                try {
                    const oldKey = existing.external_id;
                    const newKey = updated.external_id;

                    if (oldKey && oldKey !== newKey) {
                        await redisUtils.hdel("devices", [oldKey], "iotrack.live:");
                    }
                    await redisUtils.hadd("devices", newKey, updated, "iotrack.live:");
                } catch (e) {
                    logger.error({ err: e }, "Redis cache refresh failed in DeviceController.update");
                }
            })();

            return reply.send({
                success: true,
                message: "Device updated successfully.",
                data: {
                    device: updated
                },
            });
        } catch (err: any) {
            // Known Prisma errors
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    return reply.status(409).send({
                        success: false,
                        message: "Device already exists (unique external_id + external_id_type).",
                        error: { code: "DUPLICATE" },
                    });
                }
                if (err.code === "P2003") {
                    return reply.status(400).send({
                        success: false,
                        message: "Foreign key constraint failed (check organisation_id / asset_id).",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }
                if (err.code === "P2025") {
                    return reply.status(404).send({
                        success: false,
                        message: "Device not found.",
                        error: { code: "DEVICE_NOT_FOUND" },
                    });
                }
            }

            logger.error({ err }, "! DeviceController update !");
            return reply.status(500).send({
                success: false,
                message: "Failed to update device.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === "true" && err instanceof Error ? err.message : undefined,
                },
            });
        }
    }
}

// =====================================================================

export default DeviceController;
