import { Router } from "express";
import DeviceController from "../controllers/device.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validate-body.middleware";
import { destroySchema, getSchema, storeSchema, updateSchema } from "../schemas/device.scheme";
import { validateParams } from "../middleware/validate-params.middleware";



const router = Router();

router.get("/", authMiddleware,  DeviceController.index);
router.get("/:id", authMiddleware, validateParams(getSchema),  DeviceController.get);
router.post("/", authMiddleware, validateBody(storeSchema),  DeviceController.store);
router.patch("/:id", authMiddleware, validateBody(updateSchema), validateParams(getSchema), DeviceController.update);
router.delete("/", authMiddleware, validateBody(destroySchema),  DeviceController.destroy);


export default router;