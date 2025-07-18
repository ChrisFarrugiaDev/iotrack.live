
import express, {Response, Request, json}from "express";
import teltonikaRouter from "./teltonika.router"

// ---------------------------------------------------------------------

const router = express.Router();


router.use('/teltonika', teltonikaRouter);

// ---------------------------------------------------------------------

export default router;






