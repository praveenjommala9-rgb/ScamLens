import { Router, type IRouter } from "express";
import {
  CreateSessionBody,
  CreateSessionResponse,
  GetNextScenarioParams,
  GetNextScenarioResponse,
  GetSessionParams,
  GetSessionResponse,
} from "@workspace/api-zod";
import {
  chooseAdaptiveTrainingScenarios,
  chooseBalancedAssessmentScenarios,
  summarizeRecentCategoryStats,
} from "../lib/adaptive";
import { authenticate, getRequestAuth } from "../lib/auth";
import {
  HttpError,
  throwIfSupabaseError,
} from "../lib/errors";
import {
  loadUserProgressData,
  publicScenario,
  publicSession,
} from "../lib/progress";
import {
  createUserSupabaseClient,
  getSupabaseServiceClient,
} from "../lib/supabase";

const QUESTION_COUNT = 8;
const router: IRouter = Router();
router.use(authenticate);

router.post("/sessions", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const input = CreateSessionBody.parse(req.body);
  const userClient = createUserSupabaseClient(auth.token);
  const { sessions, attempts } = await loadUserProgressData(auth.userId, auth.token);

  if (sessions.some((session) => session.status === "in_progress")) {
    throw new HttpError(
      409,
      "SESSION_IN_PROGRESS",
      "Finish your active session before starting another.",
    );
  }
  const baselineCompleted = sessions.some(
    (session) => session.type === "baseline" && session.status === "completed",
  );
  if (input.type === "baseline" && baselineCompleted) {
    throw new HttpError(409, "BASELINE_EXISTS", "Your baseline assessment is already complete.");
  }
  if (input.type !== "baseline" && !baselineCompleted) {
    throw new HttpError(
      409,
      "BASELINE_REQUIRED",
      "Complete your baseline assessment before training or taking the final assessment.",
    );
  }

  const { data: candidates, error: scenarioError } = await userClient
    .from("scenarios")
    .select("id,title,category,difficulty,active")
    .eq("active", true);
  throwIfSupabaseError(scenarioError);

  let selected;
  try {
    if (input.type === "baseline") {
      selected = chooseBalancedAssessmentScenarios(
        candidates ?? [],
        new Set(),
        "easy",
        QUESTION_COUNT,
      );
    } else if (input.type === "final") {
      const baselineSession = sessions.find(
        (session) => session.type === "baseline" && session.status === "completed",
      );
      const baselineIds = new Set(baselineSession?.scenario_ids ?? []);
      selected = chooseBalancedAssessmentScenarios(
        candidates ?? [],
        baselineIds,
        "medium",
        QUESTION_COUNT,
      );
    } else {
      const categoryStats = summarizeRecentCategoryStats(
        attempts.map((item) => ({
          category: item.scenario.category,
          is_correct: item.attempt.is_correct,
        })),
      );
      const recentScenarioIds = new Set(
        attempts
          .slice(0, QUESTION_COUNT)
          .map((item) => item.attempt.scenario_id),
      );
      selected = chooseAdaptiveTrainingScenarios(
        candidates ?? [],
        categoryStats,
        recentScenarioIds,
        QUESTION_COUNT,
      );
    }
  } catch {
    throw new HttpError(
      503,
      "SCENARIO_POOL_UNAVAILABLE",
      "There are not enough active scenarios to start this session.",
    );
  }

  const { data, error } = await getSupabaseServiceClient()
    .from("sessions")
    .insert({
      user_id: auth.userId,
      type: input.type,
      status: "in_progress",
      total_questions: QUESTION_COUNT,
      answered_questions: 0,
      score: null,
      scenario_ids: selected.map((scenario) => scenario.id),
    })
    .select("*")
    .single();
  if (error?.code === "23505") {
    throw new HttpError(
      409,
      "SESSION_IN_PROGRESS",
      "Finish your active session before starting another.",
    );
  }
  throwIfSupabaseError(error);
  if (!data) {
    throw new HttpError(503, "SESSION_CREATE_FAILED", "Your session could not be created.");
  }
  res.status(201).json(CreateSessionResponse.parse(publicSession(data)));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const params = GetSessionParams.parse(req.params);
  const { data, error } = await createUserSupabaseClient(auth.token)
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  throwIfSupabaseError(error);
  if (!data) throw new HttpError(404, "NOT_FOUND", "The requested session was not found.");
  res.json(GetSessionResponse.parse(publicSession(data)));
});

router.get("/sessions/:id/next", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const params = GetNextScenarioParams.parse(req.params);
  const client = createUserSupabaseClient(auth.token);
  const { data: session, error: sessionError } = await client
    .from("sessions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  throwIfSupabaseError(sessionError);
  if (!session) throw new HttpError(404, "NOT_FOUND", "The requested session was not found.");

  const scenarioId = session.scenario_ids[session.answered_questions];
  if (!scenarioId || session.status === "completed") {
    res.json(
      GetNextScenarioResponse.parse({
        session: publicSession(session),
        scenario: null,
      }),
    );
    return;
  }

  const { data: scenario, error: scenarioError } = await client
    .from("scenarios")
    .select("id,title,channel,category,difficulty,sender_name,sender_address,subject,body,displayed_url")
    .eq("id", scenarioId)
    .maybeSingle();
  throwIfSupabaseError(scenarioError);
  if (!scenario) {
    throw new HttpError(
      503,
      "SCENARIO_UNAVAILABLE",
      "The next scenario is temporarily unavailable.",
    );
  }
  res.json(
    GetNextScenarioResponse.parse({
      session: publicSession(session),
      scenario: publicScenario(scenario),
    }),
  );
});

export default router;
