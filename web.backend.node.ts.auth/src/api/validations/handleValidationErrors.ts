const { validationResult } = require('express-validator');
import { Request, Response, NextFunction} from "express";
import { ValidationError } from "express-validator";

export const validate = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const messages = errors.array().map((err: ValidationError) => err.msg)      
        return res.status(400).json({ok: false, messages});
    }
    next();
};

