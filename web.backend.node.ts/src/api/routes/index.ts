
import express, {Response, Request, json}from "express";
import codec12Router from "./teltonika-codec12.router"

// ---------------------------------------------------------------------

const router = express.Router();

router.get("/", (req: Request, res: Response)=>{
    console.log("hello world")
    res.json({message: "hello world"});
    return;
})


router.use('/codec12', codec12Router);

// ---------------------------------------------------------------------

export default router;






