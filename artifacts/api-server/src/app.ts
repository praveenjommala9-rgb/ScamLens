import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { apiErrorHandler, ErrorResponseSchema } from "./lib/errors";

const app: Express = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
const allowedOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin ?? false);
        return;
      }
      callback(null, false);
    },
    credentials: false,
  }),
);
app.use(express.json({ limit: "32kb" }));

app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json(
        ErrorResponseSchema.parse({
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests. Wait a moment and try again.",
          },
        }),
      );
    },
  }),
  router,
);
app.use((_req, res) => {
  res.status(404).json(
    ErrorResponseSchema.parse({
      error: { code: "NOT_FOUND", message: "The requested endpoint was not found." },
    }),
  );
});
app.use(apiErrorHandler());

export default app;
