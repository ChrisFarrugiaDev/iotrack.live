
import { Router } from "express";
import AuthController from "../controllers/auth.controller"
import { validateLogin } from "../validations/auth.validation";
import { validate } from "../validations/handleValidationErrors";


const router = Router();


router.post("/login", validateLogin, validate, AuthController.login)


export default router;