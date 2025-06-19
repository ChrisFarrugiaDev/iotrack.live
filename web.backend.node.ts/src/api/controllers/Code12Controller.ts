import { Request, Response, NextFunction } from "express";
import * as redisUtils from "../../utils/redisUtils";
import { logError } from "../../utils/loggerUtils";

type CommandRecord = {
    imei: string;
    command: string;
    status: string; // e.g. "pending", "sent", "responded", "failed"
    created_at: string;       // ISO8601 string in UTC, e.g. "2024-06-19T14:31:00Z"
    sent_at?: string;         // same as above, optional
    responded_at?: string;    // same as above, optional
    response?: string;
    retries: number;
    comment?: string;         // optional, for notes/description
};

class Codec12Controller {
    static async addCommand(req: Request, res: Response, next: NextFunction) {
        const imei = req.params.imei;
        let { commands } = req.body;

        const payload: CommandRecord[] = [];

        // Normalize commands to an array of strings
        if (typeof commands === 'string') {
            commands = commands.trim();
            if (commands.length > 3) {
                commands = [commands];
            }
        }

        if (!Array.isArray(commands) || !commands.length) {
            return res.status(400).json({ error: 'commands must be a non-empty array or string' });
        }

        const status = "pending";
        const created_at = new Date().toISOString();
        const retries = 0;

        for (const command of commands) {
            payload.push({ imei, command, status, created_at, retries });
        }

        // Assuming you want to store per device
        const redisKey = `codec12:pending-commands:${imei}`;

        try {
            // Add each command to the Redis list
            for (const item of payload) {
                // If your redisUtils is async, await here
                await redisUtils.addItemToList(redisKey, JSON.stringify(item));
            }
            // TODO:  Better responce
            return res.status(200).json({ success: true });

        } catch (err: unknown) {
            let message = 'Unknown error';

            if (err instanceof Error) {
                message = err.message;
                logError("! Codec12Controller addCommand !", err);
            } else if (typeof err === 'string') {
                message = err;
                logError("! Codec12Controller addCommand !", new Error(err));
            } else {
                logError("! Codec12Controller addCommand !", new Error('Unknown error object'));
            }

            return res.status(500).json({
                error: 'Internal server error',
                details: message,
            });
        }
    }
}

export default Codec12Controller;
