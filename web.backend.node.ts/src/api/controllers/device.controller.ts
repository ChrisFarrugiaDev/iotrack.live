import { Request, Response } from "express";
import { ApiResponse } from "../../types/api-response.type";
import z from "zod";
import { Device } from "../../models/device.model";
import { logError } from "../../utils/logger.utils";
import * as redisUtils from "../../utils/redis.utils";
import { Prisma } from "../../../generated/prisma";

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
    // TODO:  Test this method
    static async list(req: Request, res: Response<ApiResponse>) {
        try {


            const { page, limit, sort_by, order } = req.body.query;
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

            const { device_ids } = req.body;

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
        // TODO: 
        //  need to check that device is with in user organisation scope
        //  and if asset id provide and ONLY if provide check that asset exist and has the same org_id as device.
        try {

            const {
                organisation_id,
                asserts_id,
                external_id,
                external_id_type,
                protocol,
                vendor,
                model,
                status,
                attributes,
            } = req.body;

            const deviceData = {
                organisation_id: BigInt(organisation_id),
                asset_id: asserts_id ? BigInt(asserts_id) : null,
                external_id,
                external_id_type,
                protocol,
                vendor,
                model,
                status,
                attributes,
            };

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
}

// =====================================================================

export default DeviceController;

