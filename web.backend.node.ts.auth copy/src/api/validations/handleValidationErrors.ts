const { validationResult } = require('express-validator');
import { Request, Response, NextFunction } from "express";
import { ValidationError } from "express-validator";

// export const validate = (req: Request, res: Response, next: NextFunction) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//         const messages = errors.array().map((err: ValidationError) => err.msg)      
//         return res.status(400).json({ok: false, messages});
//     }
//     next();
// };

export const validate = (req: Request, res: Response, next: NextFunction): Response | void => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Collect just the user-facing messages (add param/value if you like)
        const messages = errors.array().map((err: ValidationError) => err.msg);

        // Return a **consistent** error envelope
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            error: {
                code: 'VALIDATION_ERROR',
                details: { messages }
            }
        });
    }
    
    // No problems → carry on
    return next();
}