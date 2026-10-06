import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import progressRouter from "./progress";
import sessionsRouter from "./sessions";
import attemptsRouter from "./attempts";
import adminScenariosRouter from "./admin-scenarios";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(progressRouter);
router.use(sessionsRouter);
router.use(attemptsRouter);
router.use(adminScenariosRouter);

export default router;
