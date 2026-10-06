import type { ErrorRequestHandler } from "express";
import { z, ZodError } from "zod";

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function apiErrorHandler(): ErrorRequestHandler {
  return (error, req, res, _next) => {
    if (error instanceof ZodError) {
      res.status(400).json(
        ErrorResponseSchema.parse({
          error: { code: "VALIDATION_ERROR", message: "The request is invalid." },
        }),
      );
      return;
    }

    if (
      error instanceof SyntaxError &&
      typeof error === "object" &&
      error !== null &&
      "status" in error &&
      error.status === 400
    ) {
      res.status(400).json(
        ErrorResponseSchema.parse({
          error: { code: "INVALID_JSON", message: "The request body is not valid JSON." },
        }),
      );
      return;
    }

    if (error instanceof HttpError) {
      res.status(error.status).json(
        ErrorResponseSchema.parse({
          error: { code: error.code, message: error.message },
        }),
      );
      return;
    }

    req.log.error({ err: error }, "Unhandled API error");
    res.status(500).json(
      ErrorResponseSchema.parse({
        error: { code: "INTERNAL_ERROR", message: "An unexpected server error occurred." },
      }),
    );
  };
}

export function throwIfSupabaseError(error: { code?: string; message?: string } | null): void {
  if (!error) return;
  if (error.code === "PGRST116") {
    throw new HttpError(404, "NOT_FOUND", "The requested resource was not found.");
  }
  throw new HttpError(500, "DATABASE_ERROR", "A database operation could not be completed.");
}
