import { Router } from "express";
import { AccessProfileController } from "../controllers/access-profile.controller";
import { authMiddleware } from "../middleware/auth.middleware";


const router = Router();

router.use(authMiddleware);
router.get("/", AccessProfileController.getAccessProfile );


export default router;