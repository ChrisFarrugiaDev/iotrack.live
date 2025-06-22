

import { Router } from "express";
import Codec12Controller from "../controllers/Code12Controller";


const router = Router();

router.post("/commands/:imei", Codec12Controller.addCommand );


export default router;