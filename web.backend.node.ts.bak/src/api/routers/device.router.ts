import { Router } from "express";
import DeviceController from "../controllers/device.controller";
import { authMiddleware } from "../middleware/auth.middleware";



const router = Router();

router.delete("/", authMiddleware,  DeviceController.destroy)


export default router;