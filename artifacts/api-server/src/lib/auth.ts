import type { NextFunction, Request, Response } from "express";
import { HttpError, throwIfSupabaseError } from "./errors";
import {
  createUserSupabaseClient,
  getSupabasePublicClient,
  getSupabaseServiceClient,
} from "./supabase";

export interface AuthContext {
  userId: string;
  token: string;
  email: string | null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/i);
  if (!match) {
    next(new HttpError(401, "UNAUTHORIZED", "Sign in to continue."));
    return;
  }

  try {
    const token = match[1];
    const { data, error } = await getSupabasePublicClient().auth.getUser(token);
    if (error || !data.user) {
      next(new HttpError(401, "UNAUTHORIZED", "Your session is invalid or has expired."));
      return;
    }
    req.auth = {
      userId: data.user.id,
      token,
      email: data.user.email ?? null,
    };
    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
      return;
    }
    req.log.error({ err: error }, "Authentication provider request failed");
    next(new HttpError(503, "AUTH_UNAVAILABLE", "Authentication is temporarily unavailable."));
  }
}

export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const context = req.auth;
    if (!context) {
      next(new HttpError(401, "UNAUTHORIZED", "Sign in to continue."));
      return;
    }
    const { data, error } = await createUserSupabaseClient(context.token)
      .from("profiles")
      .select("role")
      .eq("id", context.userId)
      .maybeSingle();
    throwIfSupabaseError(error);
    if (data?.role !== "admin") {
      next(new HttpError(403, "FORBIDDEN", "Administrator access is required."));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function getRequestAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new HttpError(401, "UNAUTHORIZED", "Sign in to continue.");
  }
  return req.auth;
}

export function assertServiceAvailable(): void {
  getSupabaseServiceClient();
}
