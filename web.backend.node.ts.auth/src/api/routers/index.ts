
import express, {Response, Request, json}from "express";
import authRouter from "./auth.router"

// ---------------------------------------------------------------------

const router = express.Router();

router.use("/auth", authRouter)


// ---------------------------------------------------------------------

export default router;

