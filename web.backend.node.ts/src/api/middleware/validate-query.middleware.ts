import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ApiResponse } from "../../types/api-response.type";

export function validateQuery(schema: z.ZodObject<any>) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const result = schema.safeParse(request.query);

		if (!result.success) {
			const details = z.flattenError(result.error);

			return reply.status(400).send({
				success: false,
				message: "Invalid query parameters.",
				error: {
					code: "INVALID_QUERY",
					details,
				},
			} as ApiResponse);
		}

		request.query = result.data;
	};
}