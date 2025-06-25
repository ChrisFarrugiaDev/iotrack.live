

import { Router } from "express";
import TeltonikaCodec12Controller from "../controllers/teltonika-code12.controller";


const router = Router();

router.post("/commands/:imei", TeltonikaCodec12Controller.addCommand );


export default router;