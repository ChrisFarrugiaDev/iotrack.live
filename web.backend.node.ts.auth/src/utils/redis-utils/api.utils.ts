import { ApiResponse } from "../../types";
import { Response } from "express";

export function errorResponse(
    res: Response,
    status: number,
    code: string,
    message: string,
    details?: Record<string, any>,
    error?: any
) {
    return res.status(status).json({
        success: false,
        message,
        error: { code, details, error }
    } as ApiResponse);
}
