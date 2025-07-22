
import express, {Response, Request, json}from "express";
import authRouter from "./auth.router"

// ---------------------------------------------------------------------

const router = express.Router();

router.get("/", (req: Request, res: Response)=>{
    console.log("hello world")
    res.json({message: "hello world"});
    return;
})


router.use("/auth", authRouter)


// ---------------------------------------------------------------------

export default router;

