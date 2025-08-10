import { Request, Response, NextFunction } from "express";
import * as redisUtils from "../../utils/redis.utils";
import { logError } from "../../utils/logger.utils";
import * as types from "../../types/teltonika-codec-12-comand.type";
import { TeltonikaCodec12Commands } from "../../models/teltonika-codec12-commands.model";
import { ApiResponse } from "../../types/api-response.type";

class TeltonikaController {
    // Handles API call to add Codec 12 command(s) for a device
    static async addCodec12Command(req: Request, res: Response, next: NextFunction): Promise<void> {
        const imei = req.params.imei;
        let { commands } = req.body;



        // Normalize commands: convert string input to single-item array
        if (typeof commands === 'string') {
            commands = commands.trim();
            if (commands.length > 3) {
                commands = [commands];
            }
        }

        // Validate commands: must be a non-empty array or string
        if (!Array.isArray(commands) || !commands.length) {
            res.status(400).json({ error: 'commands must be a non-empty array or string' });
            return;
        }

        const payload: {
            imei: string,
            command: string,
            status: string
            comment: string | null
        }[] = [];

        // Prepare command metadata
        const status = "pending";
        const comment = null;

        // Add each command to the payload with a unique ID
        for (const command of commands) {
            payload.push({
                imei,
                command,
                status,
                comment
            });
        }


        // Create per-device Redis list key for pending commands
        const redisKey = `codec12:pending-commands:${imei}`;

        try {
            const insertedUuids = await TeltonikaCodec12Commands.createBulk(payload);
            const insertedCmd = await TeltonikaCodec12Commands.findManyByUUID(insertedUuids);


            // Save all commands to Redis list for this device
            await redisUtils.saveArrayToList(redisKey, insertedCmd, "teltonika.parser.go:");

            // Get total number of pending Codec 12 commands in Redis for this IMEI
            const pendingCode12CommandsNo = await redisUtils.listLength(redisKey, "teltonika.parser.go:");

            // Respond with success and command details
            const response: ApiResponse<types.TeltonikaCodec12Command[]> = {
                success: true,
                message: `${pendingCode12CommandsNo} command(s) queued for device ${imei}`,
                data: insertedCmd
            };

            res.status(200).json(response);
            return;


        } catch (err: unknown) {
            // Log the raw error
            logError("! TeltonikaCodec12Controller addCommand !", err);

            // Prepare error details (safely extract error message if possible)
            const errorMessage = process.env.NODE_ENV === 'development' && err instanceof Error
                ? err.message
                : undefined;

            const response: ApiResponse = {
                success: false,
                message: "Internal server error",
                error: {
                    code: "SERVER_ERROR",
                    error: errorMessage
                }
            };

            res.status(500).json(response);
            return;

        }
    }
}

export default TeltonikaController;
