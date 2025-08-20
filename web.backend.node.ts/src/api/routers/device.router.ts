import { Router } from "express";
import DeviceController from "../controllers/device.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, storeSchema } from "../schemas/device.scheme";



const router = Router();

router.get("/", authMiddleware,  DeviceController.index);
router.post("/", authMiddleware, validateBody(storeSchema),  DeviceController.store);
router.delete("/", authMiddleware, validateBody(destroySchema),  DeviceController.destroy);


export default router;