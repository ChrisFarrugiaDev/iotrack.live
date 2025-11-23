import { FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { ApiResponse } from "../../types/api-response.type";

export function validateParams(schema: z.ZodObject<any>) {
	return async (request: FastifyRequest, reply: FastifyReply) => {
		const result = schema.safeParse(request.params);

		if (!result.success) {
			const details = z.flattenError(result.error);

			return reply.status(400).send({
				success: false,
				message: "Invalid route parameters.",
				error: {
					code: "INVALID_PARAMS",
					details,
				},
			} as ApiResponse);
		}

		request.params = result.data;
	};
}
