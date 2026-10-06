import { Router, type IRouter } from "express";
import { GetMeResponse, UpdateMeBody, UpdateMeResponse } from "@workspace/api-zod";
import { authenticate, getRequestAuth } from "../lib/auth";
import { HttpError, throwIfSupabaseError } from "../lib/errors";
import { createUserSupabaseClient } from "../lib/supabase";

const router: IRouter = Router();
router.use(authenticate);

router.get("/me", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const { data, error } = await createUserSupabaseClient(auth.token)
    .from("profiles")
    .select("*")
    .eq("id", auth.userId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (!data) {
    throw new HttpError(404, "PROFILE_NOT_FOUND", "Your profile is not ready yet.");
  }
  res.json(GetMeResponse.parse(data));
});

router.patch("/me", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const input = UpdateMeBody.parse(req.body);
  const fullName = input.full_name.trim();
  if (!fullName) {
    throw new HttpError(400, "VALIDATION_ERROR", "Enter a name before saving.");
  }
  const { data, error } = await createUserSupabaseClient(auth.token)
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", auth.userId)
    .select("*")
    .single();
  throwIfSupabaseError(error);
  res.json(UpdateMeResponse.parse(data));
});

export default router;
