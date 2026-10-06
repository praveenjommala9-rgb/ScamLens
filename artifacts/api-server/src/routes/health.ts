import { Router, type IRouter } from "express";
import {
  GetAppConfigResponse,
  GetHealthResponse,
  HealthCheckResponse,
} from "@workspace/api-zod";
import { ErrorResponseSchema } from "../lib/errors";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
  SupabaseConfigurationError,
} from "../lib/supabase";

const router: IRouter = Router();

router.get("/healthz", (_req, res): void => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/health", (_req, res): void => {
  res.json(GetHealthResponse.parse({ status: "ok" }));
});

router.get("/config", (_req, res): void => {
  try {
    res.json(
      GetAppConfigResponse.parse({
        supabaseUrl: getSupabaseUrl(),
        supabasePublishableKey: getSupabasePublishableKey(),
      }),
    );
  } catch (error) {
    if (!(error instanceof SupabaseConfigurationError)) throw error;
    res.status(503).json(
      ErrorResponseSchema.parse({
        error: {
          code: "CONFIGURATION_UNAVAILABLE",
          message: "Authentication configuration is unavailable.",
        },
      }),
    );
  }
});

export default router;
