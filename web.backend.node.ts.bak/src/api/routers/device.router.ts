import { Router } from "express";
import DeviceController from "../controllers/device.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema } from "../schemas/device.scheme";



const router = Router();

router.delete("/", authMiddleware, validateBody(destroySchema),  DeviceController.destroy)
router.post("/", authMiddleware, validateBody(storeSchema),  DeviceController.store)


export default router;