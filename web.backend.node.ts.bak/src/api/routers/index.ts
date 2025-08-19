
import express, {Response, Request, json}from "express";
import authRouter from "./auth.router";
import teltonikaRouter from "./teltonika.router";
import accessProfileRouter from "./access-profile.router";
import deviceRouter from "./device.router";

// ---------------------------------------------------------------------

const router = express.Router();

router.use("/auth", authRouter);
router.use('/teltonika', teltonikaRouter);
router.use('/access-profile', accessProfileRouter);
router.use('/device', deviceRouter);


// ---------------------------------------------------------------------

export default router;

