import { Router, type IRouter } from "express";
import { authenticate, getRequestAuth } from "../lib/auth";
import { buildDashboard, buildProgress, loadUserProgressData } from "../lib/progress";

const router: IRouter = Router();
router.use(authenticate);

router.get("/dashboard", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const data = await loadUserProgressData(auth.userId, auth.token);
  res.json(buildDashboard(data));
});

router.get("/progress", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const data = await loadUserProgressData(auth.userId, auth.token);
  res.json(buildProgress(data));
});

export default router;
