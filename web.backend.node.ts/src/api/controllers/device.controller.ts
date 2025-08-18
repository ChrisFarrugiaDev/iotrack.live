import { Request, Response } from "express";
import { ApiResponse } from "../../types/api-response.type";
import z from "zod";
import { Device } from "../../models/device.model";
import { logError } from "../../utils/logger.utils";

class DeviceController {

    static async destroy(req: Request, res: Response<ApiResponse>) {

        try {
            const parseResult = destroySchema.safeParse(req.body);

            if (!parseResult.success) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid input",
                    error: {
                        code: "INVALID_INPUT",
                        details: z.flattenError(parseResult.error),
                        error: process.env.DEBUG === 'true' ? JSON.parse(parseResult.error as any) : undefined,             // (optional, for debugging)
                    }
                } as ApiResponse);
            }

            const { device_ids } = parseResult.data;
            const result = await Device.deleteByIDs(device_ids);

            return res.json({
                success: true,
                message: result.count === 0
                    ? "No devices were deleted."
                    : `${result.count} device(s) deleted.`,
                data: { count: result.count }
            } as ApiResponse);

        } catch (err: unknown) {

            logError('! DeviceController destroy !', err);

            return res.status(500).json({
                success: false,
                message: "Failed to delete devices.",
                error: {
                    code: "SERVER_ERROR",
                    error: process.env.DEBUG === 'true' && err instanceof Error ? err.message : undefined
                }
            } as ApiResponse);
        }

    }
}

// =====================================================================

const destroySchema = z.object({
    device_ids: z.array(
        z.string().regex(/^\d+$/)
    )
});

// https://zod.dev/error-formatting

export default DeviceController;

