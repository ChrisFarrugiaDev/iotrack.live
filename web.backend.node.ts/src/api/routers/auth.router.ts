
import { Router } from "express";
import AuthController from "../controllers/auth.controller"
import { validateLogin } from "../validations/auth.validation";
import { validate } from "../validations/handleValidationErrors";
import { validateBody } from "../middleware/validate-body.middleware";
import { loginSchema } from "../schemas/auth.scheme";


const router = Router();


router.post("/login", validateBody(loginSchema), AuthController.login);
// router.post("/login", validateLogin, validate, AuthController.login);


export default router;