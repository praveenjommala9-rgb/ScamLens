import { Router, type IRouter } from "express";
import {
  CreateAdminScenarioBody,
  CreateAdminScenarioResponse,
  ListAdminScenariosResponse,
  UpdateAdminScenarioBody,
  UpdateAdminScenarioParams,
  UpdateAdminScenarioResponse,
  DeleteAdminScenarioParams,
} from "@workspace/api-zod";
import { authenticate, requireAdmin } from "../lib/auth";
import { HttpError, throwIfSupabaseError } from "../lib/errors";
import { getSupabaseServiceClient } from "../lib/supabase";

const router: IRouter = Router();
router.use(authenticate, requireAdmin);

function assertSafeScenarioAddresses(input: {
  sender_address?: string | null;
  displayed_url?: string | null;
}): void {
  const safeAddress = /^[^\s@]+@(?:[a-z0-9-]+\.)*example$/i;
  const safeUrl = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)*example(?:[/:?#].*)?$/i;
  if (input.sender_address && !safeAddress.test(input.sender_address)) {
    throw new HttpError(
      400,
      "UNSAFE_SCENARIO_ADDRESS",
      "Use a fictional sender address ending in .example.",
    );
  }
  if (input.displayed_url && !safeUrl.test(input.displayed_url)) {
    throw new HttpError(
      400,
      "UNSAFE_SCENARIO_ADDRESS",
      "Displayed scenario addresses must use a fictional .example domain.",
    );
  }
}

router.get("/admin/scenarios", async (_req, res): Promise<void> => {
  const { data, error } = await getSupabaseServiceClient()
    .from("scenarios")
    .select("*")
    .order("category")
    .order("difficulty")
    .order("title");
  throwIfSupabaseError(error);
  res.json(ListAdminScenariosResponse.parse(data ?? []));
});

router.post("/admin/scenarios", async (req, res): Promise<void> => {
  const input = CreateAdminScenarioBody.parse(req.body);
  assertSafeScenarioAddresses(input);
  const { data, error } = await getSupabaseServiceClient()
    .from("scenarios")
    .insert(input)
    .select("*")
    .single();
  throwIfSupabaseError(error);
  res.status(201).json(CreateAdminScenarioResponse.parse(data));
});

router.patch("/admin/scenarios/:id", async (req, res): Promise<void> => {
  const params = UpdateAdminScenarioParams.parse(req.params);
  const input = UpdateAdminScenarioBody.parse(req.body);
  if (Object.keys(input).length === 0) {
    throw new HttpError(400, "VALIDATION_ERROR", "Choose at least one scenario field to update.");
  }

  const service = getSupabaseServiceClient();
  const { data: existing, error: existingError } = await service
    .from("scenarios")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  throwIfSupabaseError(existingError);
  if (!existing) {
    throw new HttpError(404, "NOT_FOUND", "The requested scenario was not found.");
  }

  const changesContent = Object.keys(input).some((key) => key !== "active");
  if (changesContent) {
    const { count, error: attemptsError } = await service
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("scenario_id", params.id);
    throwIfSupabaseError(attemptsError);
    if ((count ?? 0) > 0) {
      throw new HttpError(
        409,
        "SCENARIO_HAS_HISTORY",
        "Scenario content cannot change after a user has answered it. You can deactivate it instead.",
      );
    }
  }

  assertSafeScenarioAddresses({
    sender_address: input.sender_address ?? existing.sender_address,
    displayed_url: input.displayed_url ?? existing.displayed_url,
  });
  const { data, error } = await service
    .from("scenarios")
    .update(input)
    .eq("id", params.id)
    .select("*")
    .single();
  throwIfSupabaseError(error);
  res.json(UpdateAdminScenarioResponse.parse(data));
});

router.delete("/admin/scenarios/:id", async (req, res): Promise<void> => {
  const params = DeleteAdminScenarioParams.parse(req.params);
  const { data, error } = await getSupabaseServiceClient()
    .from("scenarios")
    .update({ active: false })
    .eq("id", params.id)
    .select("id")
    .maybeSingle();
  throwIfSupabaseError(error);
  if (!data) throw new HttpError(404, "NOT_FOUND", "The requested scenario was not found.");
  res.status(204).end();
});

export default router;
