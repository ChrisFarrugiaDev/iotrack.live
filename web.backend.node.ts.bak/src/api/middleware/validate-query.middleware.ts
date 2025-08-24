import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { ApiResponse } from "../../types/api-response.type";

export function validateQuery(schema: z.ZodObject<any>) {
  return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details =  z.flattenError(result.error);  

      return res.status(400).json({
        success: false,
        message: "Invalid query parameters.",
        error: {
          code: "INVALID_QUERY",
          details,
        },
      });
    }

    req._query = result.data; 
    next();
  };
}