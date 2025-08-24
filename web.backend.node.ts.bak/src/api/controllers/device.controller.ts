import { Request, Response } from "express";
import { ApiResponse } from "../../types/api-response.type";
import z from "zod";
import { Device } from "../../models/device.model";
import { logError } from "../../utils/logger.utils";
import * as redisUtils from "../../utils/redis.utils";
import { Prisma } from "../../../generated/prisma";
import { AccessProfileController } from "./access-profile.controller";
import { Asset } from "../../models/asset.model";

class DeviceController {

    static async index(req: Request, res: Response<ApiResponse>) {
        try {
            const result = await Device.getAll();
            return res.json({
                success: true,
                message: "Devices fetched.",
                data: {
                    count: result.length,
                    devices: result
                },
            });
        } catch (err) {
            logError("! DeviceController index !", err);
            return res.status(500).json({
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
    static async get(req: Request, res: Response<ApiResponse>) {
        try {
            const id = req._params!.id;

            const device = await Device.getByID(id);
            if (!device) {
                return res.status(404).json({
                    success: false,
                    message: "Device not found.",
                    error: { code: "DEVICE_NOT_FOUND" },
                });
            }

            // Org access check: user must have access to the device's organisation
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(
                req.userOrgID!, req.userID!
            );
            if (!accessibleOrgsByUser.includes(String(device.organisation_id))) {
                return res.status(403).json({
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

            return res.json({
                success: true,
                message: "Device fetched.",
                data: { device },
            });
        } catch (err: any) {
            logError("! DeviceController get !", err);
            return res.status(500).json({
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
    static async list(req: Request, res: Response<ApiResponse>) {
        try {


            const { page, limit, sort_by, order } = req._body!.query;
            const skip = (page - 1) * limit;

            const [items, total] = await Promise.all([
                Device.list({ skip, take: limit, sortBy: sort_by, order }),
                Device.count(),
            ]);

            return res.json({
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
            logError("! DeviceController index !", err);
            return res.status(500).json({
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

    static async destroy(req: Request, res: Response<ApiResponse>) {
        try {

            const { device_ids } = req._body!;

            if (!device_ids || device_ids.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No device IDs provided.",
                    data: { count: 0 },
                });
            }

            // Map DB IDs -> external_ids to clean Redis later
            const external_ids = await Device.getExternalIDsByIDs(device_ids);

            if (!external_ids || external_ids.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No matching devices found for the provided IDs.",
                    data: { count: 0 },
                });
            }

            // Delete from DB
            const result = await Device.deleteByIDs(device_ids);

            // Best-effort Redis cleanup (don’t fail request if this errors)
            (async () => {
                try {
                    // hashKey: "devices", fields: external_ids, optional prefix: "teltonika.parser.go:"
                    await redisUtils.hdel("devices", external_ids, "teltonika.parser.go:");
                } catch (e) {
                    logError("Redis cleanup failed in DeviceController.destroy", e);
                }
            })();

            return res.json({
                success: true,
                message:
                    result.count === 0
                        ? "No devices were deleted."
                        : `${result.count} device(s) deleted.`,
                data: { count: result.count, device_ids },
            });
        } catch (err: unknown) {
            logError("! DeviceController destroy !", err);
            return res.status(500).json({
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

    static async store(req: Request, res: Response<ApiResponse>) {

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
            } = req._body!;

            // Ensure the device's organisation belongs to the user's accessible orgs (own or child).
            // Otherwise return 403 Forbidden.
            const accessibleOrgsByUser = await AccessProfileController.computeAccessibleOrganisationIds(req.userOrgID!, req.userID!);

            if (!accessibleOrgsByUser.includes(organisation_id)) {
                return res.status(403).json({
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
                    return res.status(404).json({
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
                    return res.status(409).json({
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
                        "teltonika.parser.go:"
                    );
                } catch (e) {
                    logError("Redis hadd failed in DeviceController.store", e);
                }
            })();

            return res.status(201).json({
                success: true,
                message: "Device created.",
                data: result,
            });
        } catch (err: unknown) {
            // Prisma-known errors
            if (
                err instanceof Prisma.PrismaClientKnownRequestError
            ) {
                // Duplicate (unique constraint)
                if (err.code === "P2002") {
                    return res.status(409).json({
                        success: false,
                        message:
                            "Device already exists (unique external_id + external_id_type).",
                        error: { code: "DUPLICATE" },
                    });
                }
                // Foreign key violation
                if (err.code === "P2003") {
                    return res.status(400).json({
                        success: false,
                        message:
                            "Foreign key constraint failed (check organisation_id / asset_id).",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }
            }

            // Unknown / unhandled
            logError("! DeviceController store !", err);
            return res.status(500).json({
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
    static async update(req: Request, res: Response<ApiResponse>) {
        try {
            const deviceID = req._params?.id;
            if (!deviceID) {
                return res.status(400).json({
                    success: false,
                    message: "Missing device id in route params.",
                    error: { code: "BAD_REQUEST" },
                });
            }

            // Fetch the current device (for existence check + diffing/Redis cleanup)
            const existing = await Device.getByID(deviceID);
            if (!existing) {
                return res.status(404).json({
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
            } = req.body as Partial<{
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
                req.userOrgID!,
                req.userID!
            );
            if (!accessibleOrgsByUser.includes(String(targetOrgID))) {
                return res.status(403).json({
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
                        return res.status(404).json({
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
                        return res.status(409).json({
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
                return res.status(400).json({
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
                        await redisUtils.hdel("devices", [oldKey], "teltonika.parser.go:");
                    }
                    await redisUtils.hadd("devices", newKey, updated, "teltonika.parser.go:");
                } catch (e) {
                    logError("Redis cache refresh failed in DeviceController.update", e);
                }
            })();

            return res.json({
                success: true,
                message: "Device updated.",
                data: updated,
            });
        } catch (err: any) {
            // Known Prisma errors
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === "P2002") {
                    return res.status(409).json({
                        success: false,
                        message: "Device already exists (unique external_id + external_id_type).",
                        error: { code: "DUPLICATE" },
                    });
                }
                if (err.code === "P2003") {
                    return res.status(400).json({
                        success: false,
                        message: "Foreign key constraint failed (check organisation_id / asset_id).",
                        error: { code: "FOREIGN_KEY_VIOLATION" },
                    });
                }
                if (err.code === "P2025") {
                    return res.status(404).json({
                        success: false,
                        message: "Device not found.",
                        error: { code: "DEVICE_NOT_FOUND" },
                    });
                }
            }

            logError("! DeviceController update !", err);
            return res.status(500).json({
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

