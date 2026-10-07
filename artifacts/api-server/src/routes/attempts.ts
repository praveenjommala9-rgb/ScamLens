import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import {
  GetAttemptParams,
  GetAttemptResponse,
  ListAttemptsQueryParams,
  ListAttemptsResponse,
  SubmitAttemptBody,
  SubmitAttemptResponse,
  UpdateAttemptBody,
  UpdateAttemptParams,
  UpdateAttemptResponse,
} from "@workspace/api-zod";
import { z } from "zod";
import { summarizeRecentCategoryStats } from "../lib/adaptive";
import { authenticate, getRequestAuth } from "../lib/auth";
import {
  CoachFeedbackSchema,
  GEMINI_MODEL,
  generateCoachFeedback,
} from "../lib/coach";
import {
  RED_FLAG_VALUES,
  SCENARIO_CATEGORIES,
  type AttemptRow,
  type ScenarioCategory,
  type ScenarioRow,
  type SessionRow,
} from "../lib/database.types";
import {
  ErrorResponseSchema,
  HttpError,
  throwIfSupabaseError,
} from "../lib/errors";
import { gradeScenario } from "../lib/grading";
import {
  assessmentReport,
  attemptSummary,
  latestBaselineScore,
  loadUserProgressData,
  publicScenario,
  publicSession,
  type AttemptContext,
} from "../lib/progress";
import {
  createUserSupabaseClient,
  getSupabaseServiceClient,
} from "../lib/supabase";

const router: IRouter = Router();
router.use(authenticate);
const attemptSubmitLimit = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => req.auth?.userId ?? "unauthenticated",
  handler: (_req, res) => {
    res.status(429).json(
      ErrorResponseSchema.parse({
        error: {
          code: "RATE_LIMITED",
          message: "Too many responses were submitted. Wait a moment and try again.",
        },
      }),
    );
  },
});

const CommitResultSchema = z.object({
  attempt: z.object({
    id: z.string().uuid(),
    session_id: z.string().uuid(),
    user_id: z.string().uuid(),
    scenario_id: z.string().uuid(),
    answer: z.enum(["phishing", "legitimate", "unsure"]),
    selected_red_flags: z.array(z.enum(RED_FLAG_VALUES)),
    is_correct: z.boolean(),
    response_time_ms: z.number().int(),
    reflection_note: z.string().nullable(),
    created_at: z.string(),
  }),
  session: z.object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    type: z.enum(["baseline", "training", "final"]),
    status: z.enum(["in_progress", "completed"]),
    total_questions: z.number().int(),
    answered_questions: z.number().int(),
    score: z.number().int().nullable(),
    scenario_ids: z.array(z.string().uuid()),
    started_at: z.string(),
    completed_at: z.string().nullable(),
  }),
});

function mapSubmitError(error: { code?: string; message?: string }): HttpError {
  const message = error.message ?? "";
  if (message.includes("SESSION_NOT_FOUND")) {
    return new HttpError(404, "NOT_FOUND", "The requested session was not found.");
  }
  if (message.includes("SESSION_COMPLETED")) {
    return new HttpError(409, "SESSION_COMPLETED", "This session is already complete.");
  }
  if (message.includes("SCENARIO_OUT_OF_ORDER") || error.code === "23505") {
    return new HttpError(
      409,
      "SCENARIO_OUT_OF_ORDER",
      "This response is no longer current. Refresh the scenario and try again.",
    );
  }
  return new HttpError(500, "ATTEMPT_SAVE_FAILED", "Your response could not be saved.");
}

function safeScenarioFromRow(row: ScenarioRow) {
  return publicScenario({
    id: row.id,
    title: row.title,
    channel: row.channel,
    category: row.category,
    difficulty: row.difficulty,
    sender_name: row.sender_name,
    sender_address: row.sender_address,
    subject: row.subject,
    body: row.body,
    displayed_url: row.displayed_url,
  });
}

async function loadAttemptDetail(
  attemptId: string,
  userId: string,
  token: string,
) {
  const progress = await loadUserProgressData(userId, token);
  const context = progress.attempts.find((item) => item.attempt.id === attemptId);
  if (!context) throw new HttpError(404, "NOT_FOUND", "The requested response was not found.");
  const { data: detailScenario, error: detailScenarioError } =
    await createUserSupabaseClient(token)
      .from("scenarios")
      .select(
        "id,title,channel,category,difficulty,sender_name,sender_address,subject,body,displayed_url",
      )
      .eq("id", context.attempt.scenario_id)
      .maybeSingle();
  throwIfSupabaseError(detailScenarioError);
  if (!detailScenario) {
    throw new HttpError(
      503,
      "SCENARIO_UNAVAILABLE",
      "The scenario review is temporarily unavailable.",
    );
  }

  let grading = null;
  let feedback = null;
  let aiStatus: "available" | "unavailable" | "not_applicable" = "not_applicable";

  if (context.session.type === "training") {
    const { data: answerKey, error: scenarioError } = await getSupabaseServiceClient()
      .from("scenarios")
      .select("*")
      .eq("id", context.attempt.scenario_id)
      .maybeSingle();
    throwIfSupabaseError(scenarioError);
    if (!answerKey) {
      throw new HttpError(503, "SCENARIO_UNAVAILABLE", "The scenario review is temporarily unavailable.");
    }
    grading = gradeScenario(
      answerKey,
      context.attempt.answer,
      context.attempt.selected_red_flags,
    );

    const { data: savedFeedback, error: feedbackError } =
      await createUserSupabaseClient(token)
        .from("ai_feedback")
        .select("*")
        .eq("attempt_id", attemptId)
        .maybeSingle();
    throwIfSupabaseError(feedbackError);
    if (savedFeedback) {
      feedback = CoachFeedbackSchema.parse(savedFeedback);
      aiStatus = "available";
    } else {
      aiStatus = "unavailable";
    }
  }

  let assessment = null;
  if (
    context.session.status === "completed" &&
    (context.session.type === "baseline" || context.session.type === "final")
  ) {
    assessment = assessmentReport(
      context.session,
      progress.attempts,
      context.session.type === "final" ? latestBaselineScore(progress) : null,
    );
  }

  return GetAttemptResponse.parse({
    attempt: attemptSummary(context),
    answer: context.attempt.answer,
    selected_red_flags: context.attempt.selected_red_flags,
    scenario: publicScenario(detailScenario),
    session: publicSession(context.session),
    grading,
    feedback,
    ai_status: aiStatus,
    assessment,
  });
}

router.get("/attempts", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const query = ListAttemptsQueryParams.parse(req.query);
  const progress = await loadUserProgressData(auth.userId, auth.token);
  const needle = query.search?.trim().toLocaleLowerCase();
  const filtered = progress.attempts
    .filter((context) => {
      if (query.category && context.scenario.category !== query.category) return false;
      if (query.channel && context.scenario.channel !== query.channel) return false;
      if (query.session_type && context.session.type !== query.session_type) return false;
      if (
        needle &&
        !`${context.scenario.title} ${context.scenario.category}`
          .toLocaleLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      return true;
    })
    .slice(0, query.limit)
    .map(attemptSummary);
  res.json(ListAttemptsResponse.parse(filtered));
});

router.post("/attempts", attemptSubmitLimit, async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const input = SubmitAttemptBody.parse(req.body);
  const userClient = createUserSupabaseClient(auth.token);
  const { data: session, error: sessionError } = await userClient
    .from("sessions")
    .select("*")
    .eq("id", input.session_id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  throwIfSupabaseError(sessionError);
  if (!session) throw new HttpError(404, "NOT_FOUND", "The requested session was not found.");
  if (session.status !== "in_progress") {
    throw new HttpError(409, "SESSION_COMPLETED", "This session is already complete.");
  }
  if (session.scenario_ids[session.answered_questions] !== input.scenario_id) {
    throw new HttpError(
      409,
      "SCENARIO_OUT_OF_ORDER",
      "This response is no longer current. Refresh the scenario and try again.",
    );
  }

  const { data: scenario, error: scenarioError } = await getSupabaseServiceClient()
    .from("scenarios")
    .select("*")
    .eq("id", input.scenario_id)
    .maybeSingle();
  throwIfSupabaseError(scenarioError);
  if (!scenario) {
    throw new HttpError(404, "SCENARIO_NOT_FOUND", "The requested scenario was not found.");
  }

  const grade = gradeScenario(scenario, input.answer, input.selected_red_flags);
  const { data: committed, error: submitError } = await getSupabaseServiceClient()
    .rpc("submit_scam_attempt", {
      p_session_id: input.session_id,
      p_user_id: auth.userId,
      p_scenario_id: input.scenario_id,
      p_answer: input.answer,
      p_selected_red_flags: input.selected_red_flags,
      p_is_correct: grade.is_correct,
      p_response_time_ms: input.response_time_ms,
      p_reflection_note: input.reflection_note ?? null,
    });
  if (submitError) throw mapSubmitError(submitError);
  const parsedCommit = CommitResultSchema.safeParse(committed);
  if (!parsedCommit.success) {
    throw new HttpError(500, "ATTEMPT_SAVE_FAILED", "Your response could not be saved.");
  }
  const attempt: AttemptRow = parsedCommit.data.attempt;
  const updatedSession: SessionRow = parsedCommit.data.session;
  const candidate: AttemptContext = {
    attempt,
    session: updatedSession,
    scenario: {
      id: scenario.id,
      title: scenario.title,
      channel: scenario.channel,
      category: scenario.category,
      difficulty: scenario.difficulty,
    },
  };

  let feedback = null;
  let aiStatus: "available" | "unavailable" | "not_applicable" =
    updatedSession.type === "training" ? "unavailable" : "not_applicable";
  let assessment = null;

  if (updatedSession.type === "training") {
    const progress = await loadUserProgressData(auth.userId, auth.token);
    const stats = summarizeRecentCategoryStats(
      progress.attempts.map((item) => ({
        category: item.scenario.category,
        is_correct: item.attempt.is_correct,
      })),
    );
    const weakCategories = stats
      .filter((item) => item.attempts > 0)
      .sort(
        (left, right) =>
          left.accuracy - right.accuracy ||
          left.category.localeCompare(right.category),
      )
      .slice(0, 3)
      .map((item) => item.category);
    const generated = await generateCoachFeedback({
      scenario,
      attempt,
      grade,
      weakCategories,
    });
    if (generated) {
      const { error: saveFeedbackError } = await getSupabaseServiceClient()
        .from("ai_feedback")
        .insert({
          attempt_id: attempt.id,
          coaching_summary: generated.coaching_summary,
          what_you_did_well: generated.what_you_did_well,
          missed_signals: generated.missed_signals,
          next_rule: generated.next_rule,
          focus_category: generated.focus_category as ScenarioCategory,
          model: GEMINI_MODEL,
        });
      if (!saveFeedbackError) {
        feedback = generated;
        aiStatus = "available";
      } else {
        req.log.warn(
          { code: saveFeedbackError.code },
          "Gemini feedback could not be persisted",
        );
      }
    }
  } else if (updatedSession.status === "completed") {
    const progress = await loadUserProgressData(auth.userId, auth.token);
    assessment = assessmentReport(
      updatedSession,
      progress.attempts,
      updatedSession.type === "final" ? latestBaselineScore(progress) : null,
    );
  }

  res.status(201).json(
    SubmitAttemptResponse.parse({
      attempt: attemptSummary(candidate),
      answer: attempt.answer,
      selected_red_flags: attempt.selected_red_flags,
      scenario: safeScenarioFromRow(scenario),
      session: publicSession(updatedSession),
      grading: updatedSession.type === "training" ? grade : null,
      feedback,
      ai_status: aiStatus,
      assessment,
    }),
  );
});

router.get("/attempts/:id", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const params = GetAttemptParams.parse(req.params);
  res.json(await loadAttemptDetail(params.id, auth.userId, auth.token));
});

router.patch("/attempts/:id", async (req, res): Promise<void> => {
  const auth = getRequestAuth(req);
  const params = UpdateAttemptParams.parse(req.params);
  const input = UpdateAttemptBody.parse(req.body);
  const service = getSupabaseServiceClient();
  const { data: ownedAttempt, error: attemptError } = await service
    .from("attempts")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", auth.userId)
    .maybeSingle();
  throwIfSupabaseError(attemptError);
  if (!ownedAttempt) {
    throw new HttpError(404, "NOT_FOUND", "The requested response was not found.");
  }

  const { error: updateError } = await service
    .from("attempts")
    .update({ reflection_note: input.reflection_note })
    .eq("id", params.id)
    .eq("user_id", auth.userId);
  throwIfSupabaseError(updateError);
  res.json(
    UpdateAttemptResponse.parse(
      await loadAttemptDetail(params.id, auth.userId, auth.token),
    ),
  );
});

export default router;
