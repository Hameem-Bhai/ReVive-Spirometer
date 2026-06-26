import { Router, type IRouter } from "express";
import healthRouter from "./health";
import spirometerRouter from "./spirometer";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(spirometerRouter);
router.use(chatRouter);

export default router;
