import { FastifyRequest, FastifyReply } from "fastify";
import * as redisUtils from "../../utils/redis.utils";
import { logger } from "../../utils/logger.utils";
import * as types from "../../types/teltonika-codec-12-comand.type";
import { TeltonikaCodec12Commands } from "../../models/teltonika-codec12-commands.model";
import { ApiResponse } from "../../types/api-response.type";
import { codec12CommandSchema, codec12ParamsSchema } from "../schemas/teltonika.schema";
import z from "zod";

// ---------------------------------------------------------------------

type Codec12Params = z.infer<typeof codec12ParamsSchema>;
type Codec12Body   = z.infer<typeof codec12CommandSchema>;

// ---------------------------------------------------------------------

class TeltonikaController {
    static async addCodec12Command(request: FastifyRequest, reply: FastifyReply): Promise<void> {
        const { imei }     = request.params as Codec12Params;
        const { commands } = request.body   as Codec12Body;

        const payload = commands.map(command => ({
            imei,
            command,
            status:  "pending",
            comment: null as string | null,
        }));

        const redisKey = `codec12:pending-commands:${imei}`;

        try {
            const insertedUuids = await TeltonikaCodec12Commands.createBulk(payload);
            const insertedCmd   = await TeltonikaCodec12Commands.findManyByUUID(insertedUuids);

            await redisUtils.saveArrayToList(redisKey, insertedCmd, "teltonika.parser.go:");

            const pendingCode12CommandsNo = await redisUtils.listLength(redisKey, "teltonika.parser.go:");

            const response: ApiResponse<types.TeltonikaCodec12Command[]> = {
                success: true,
                message: `${pendingCode12CommandsNo} command(s) queued for device ${imei}`,
                data:    insertedCmd,
            };

            return reply.status(200).send(response);

        } catch (err: unknown) {
            logger.error({ err }, "! TeltonikaCodec12Controller addCommand !");

            const errorMessage = process.env.NODE_ENV === "development" && err instanceof Error
                ? err.message
                : undefined;

            const response: ApiResponse = {
                success: false,
                message: "Internal server error",
                error: {
                    code:  "SERVER_ERROR",
                    error: errorMessage,
                },
            };

            return reply.status(500).send(response);
        }
    }
}

// ---------------------------------------------------------------------

export default TeltonikaController;
