import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse } from "../../types/api-response.type";

export function validateParams(schema: z.ZodObject<any>) {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      const details = z.flattenError(result.error);

      return res.status(400).json({
        success: false,
        message: "Invalid route parameters.",
        error: {
          code: "INVALID_PARAMS",
          details,
        },
      });
    }

    req._params = result.data;
    next();
  };
}
