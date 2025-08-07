
import express, {Response, Request, json}from "express";
import authRouter from "./auth.router"
import teltonikaRouter from "./teltonika.router"

// ---------------------------------------------------------------------

const router = express.Router();

router.use("/auth", authRouter);
router.use('/teltonika', teltonikaRouter);


// ---------------------------------------------------------------------

export default router;

