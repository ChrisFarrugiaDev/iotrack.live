import { FastifyRequest, FastifyReply } from "fastify";
import z from "zod";
import { ApiResponse } from "../../types/api-response.type";



export function validateBody(schema: z.ZodObject) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        const result = schema.safeParse(request.body);

        if (!result.success) {
  
            const details = z.flattenError(result.error);           

            return reply.status(400).send({
                success: false,
                message: "Invalid input.",
                error: {
                    code: "INVALID_INPUT",
                    details: details
                }
            } as ApiResponse);
        }

        request.body = result.data;    
    }
}

// https://zod.dev/error-formatting