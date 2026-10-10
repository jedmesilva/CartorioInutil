import { Router, type IRouter } from "express";
import healthRouter from "./health";
import carimboRouter from "./carimbar";

const router: IRouter = Router();

router.use(healthRouter);
router.use(carimboRouter);

export default router;
