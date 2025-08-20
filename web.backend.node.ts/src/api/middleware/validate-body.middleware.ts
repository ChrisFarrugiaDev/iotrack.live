import { Request, Response, NextFunction } from "express";
import z from "zod";
import { ApiResponse } from "../../types/api-response.type";


export function validateBody(schema: z.ZodObject) {
    return (req: Request, res: Response<ApiResponse>, next: NextFunction) => {
        const result = schema.safeParse(req.body);

        if (!result.success) {
  
            const details = z.flattenError(result.error);           

            return res.status(400).json({
                success: false,
                message: "Invalid input.",
                error: {
                    code: "INVALID_INPUT",
                    details: details
                }
            })
        }

        req.body = result.data;    
        next();
    }
}

// https://zod.dev/error-formatting