

import { Router } from "express";
import TeltonikaController from "../controllers/teltonika.controller";


const router = Router();

router.post("/codec12/commands/:imei", TeltonikaController.addCodec12Command );


export default router;