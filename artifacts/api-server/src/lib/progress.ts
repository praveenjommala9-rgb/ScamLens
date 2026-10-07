import {
  GetDashboardResponse,
  GetProgressResponse,
  GetSessionResponse,
  type CategoryPerformance,
  type DashboardSummary,
  type ProgressSummary,
  type AssessmentReport,
  type Session,
  type SafeScenario,
  type AttemptSummary,
} from "@workspace/api-zod";
import type {
  AttemptRow,
  ScenarioCategory,
  SessionRow,
} from "./database.types";
import { summarizeCategoryStats } from "./adaptive";
import { calculateScore } from "./grading";
import { HttpError, throwIfSupabaseError } from "./errors";
import {
  createUserSupabaseClient,
  getSupabaseServiceClient,
} from "./supabase";

export interface ScenarioDisplay {
  id: string;
  title: string;
  channel: SafeScenario["channel"];
  category: ScenarioCategory;
  difficulty: SafeScenario["difficulty"];
}

export interface AttemptContext {
  attempt: AttemptRow;
  session: SessionRow;
  scenario: ScenarioDisplay;
}

export interface UserProgressData {
  sessions: SessionRow[];
  attempts: AttemptContext[];
}

export function publicSession(row: SessionRow): Session {
  return GetSessionResponse.parse({
    id: row.id,
    type: row.type,
    status: row.status,
    total_questions: row.total_questions,
    answered_questions: row.answered_questions,
    score: row.score,
    started_at: row.started_at,
    completed_at: row.completed_at,
  });
}

export function publicScenario(
  row: ScenarioDisplay & Pick<
    SafeScenario,
    "sender_name" | "sender_address" | "subject" | "body" | "displayed_url"
  >,
): SafeScenario {
  return {
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
  };
}

export function attemptSummary(context: AttemptContext): AttemptSummary {
  return {
    id: context.attempt.id,
    session_id: context.attempt.session_id,
    session_type: context.session.type,
    scenario_title: context.scenario.title,
    channel: context.scenario.channel,
    category: context.scenario.category,
    difficulty: context.scenario.difficulty,
    result_label:
      context.session.type === "training"
        ? context.attempt.is_correct
          ? "correct"
          : "incorrect"
        : "assessment_item",
    created_at: new Date(context.attempt.created_at),
    reflection_note: context.attempt.reflection_note,
  };
}

export async function loadUserProgressData(
  userId: string,
  token: string,
): Promise<UserProgressData> {
  const client = createUserSupabaseClient(token);
  const service = getSupabaseServiceClient();
  const [sessionResult, attemptResult] = await Promise.all([
    service
      .from("sessions")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(200),
    service
      .from("attempts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1000),
  ]);
  throwIfSupabaseError(sessionResult.error);
  throwIfSupabaseError(attemptResult.error);

  const sessions = sessionResult.data ?? [];
  const attempts = attemptResult.data ?? [];
  const sessionById = new Map(sessions.map((row) => [row.id, row]));
  const scenarioIds = [...new Set(attempts.map((row) => row.scenario_id))];
  let scenarios: ScenarioDisplay[] = [];
  if (scenarioIds.length > 0) {
    const scenarioResult = await client
      .from("scenarios")
      .select("id,title,channel,category,difficulty")
      .in("id", scenarioIds);
    throwIfSupabaseError(scenarioResult.error);
    scenarios = scenarioResult.data ?? [];
  }
  const scenarioById = new Map(scenarios.map((row) => [row.id, row]));
  const contexts = attempts.flatMap((attempt) => {
    const session = sessionById.get(attempt.session_id);
    const scenario = scenarioById.get(attempt.scenario_id);
    return session && scenario ? [{ attempt, session, scenario }] : [];
  });
  return { sessions, attempts: contexts };
}

function completedSessions(data: UserProgressData, type: SessionRow["type"]): SessionRow[] {
  return data.sessions
    .filter((session) => session.type === type && session.status === "completed")
    .sort((left, right) => left.started_at.localeCompare(right.started_at));
}

function categoryPerformance(contexts: AttemptContext[]): CategoryPerformance[] {
  return summarizeCategoryStats(
    contexts.map((context) => ({
      category: context.scenario.category,
      is_correct: context.attempt.is_correct,
    })),
  );
}

export function latestBaselineScore(data: UserProgressData): number | null {
  return completedSessions(data, "baseline").at(-1)?.score ?? null;
}

export function assessmentReport(
  session: SessionRow,
  attempts: AttemptContext[],
  baselineScore: number | null,
): AssessmentReport {
  const sessionAttempts = attempts.filter(
    (context) => context.session.id === session.id,
  );
  const score =
    session.score ??
    calculateScore(
      sessionAttempts.filter((context) => context.attempt.is_correct).length,
      session.total_questions,
    );
  const performance = categoryPerformance(sessionAttempts);
  const measured = performance.filter((item) => item.attempts > 0);
  const strongest = [...measured].sort(
    (left, right) =>
      right.accuracy - left.accuracy ||
      left.category.localeCompare(right.category),
  )[0];
  const weakest = [...measured].sort(
    (left, right) =>
      left.accuracy - right.accuracy ||
      left.category.localeCompare(right.category),
  )[0];
  const improvement = baselineScore === null ? null : score - baselineScore;
  const explanation =
    improvement === null
      ? `You completed ${sessionAttempts.length} scenarios with a final score of ${score}%.`
      : improvement > 0
        ? `Your final assessment improved by ${improvement} percentage points from baseline.`
        : improvement < 0
          ? `Your final score was ${Math.abs(improvement)} percentage points below baseline. Review the category results and continue practicing.`
          : "Your final score matched your baseline. Continue practicing the categories with the most missed signals.";
  return {
    baseline_score: baselineScore,
    final_score: score,
    improvement,
    category_performance: performance,
    strongest_category: strongest?.category ?? null,
    weakest_category: weakest?.category ?? null,
    scenarios_completed: sessionAttempts.length,
    explanation,
  };
}

function currentTrainingScore(data: UserProgressData): number | null {
  const trainingAttempts = data.attempts.filter(
    (context) => context.session.type === "training",
  );
  if (trainingAttempts.length === 0) return null;
  return calculateScore(
    trainingAttempts.filter((context) => context.attempt.is_correct).length,
    trainingAttempts.length,
  );
}

export function buildDashboard(
  data: UserProgressData,
): DashboardSummary {
  const baselineScore = latestBaselineScore(data);
  const finalScore = completedSessions(data, "final").at(-1)?.score ?? null;
  const trainingScore = currentTrainingScore(data);
  const currentScore = finalScore ?? trainingScore ?? baselineScore;
  const improvement =
    currentScore === null || baselineScore === null
      ? null
      : currentScore - baselineScore;
  const performance = categoryPerformance(data.attempts);
  const measured = performance.filter((item) => item.attempts > 0);
  const sortedAccuracy = [...measured].sort(
    (left, right) =>
      right.accuracy - left.accuracy ||
      left.category.localeCompare(right.category),
  );
  const recentAttempts = data.attempts
    .slice()
    .sort((left, right) =>
      right.attempt.created_at.localeCompare(left.attempt.created_at),
    )
    .slice(0, 5)
    .map(attemptSummary);
  const activeSession =
    data.sessions
      .filter((session) => session.status === "in_progress")
      .sort((left, right) =>
        right.started_at.localeCompare(left.started_at),
      )[0] ?? null;
  const correct = data.attempts.filter((item) => item.attempt.is_correct).length;

  return GetDashboardResponse.parse({
    awareness_score: currentScore,
    baseline_score: baselineScore,
    current_score: currentScore,
    improvement,
    scenarios_completed: data.sessions.reduce(
      (sum, session) => sum + session.answered_questions,
      0,
    ),
    total_attempts: data.attempts.length,
    total_completed_sessions: data.sessions.filter(
      (session) => session.status === "completed",
    ).length,
    total_correct: correct,
    overall_accuracy:
      data.attempts.length > 0
        ? calculateScore(correct, data.attempts.length)
        : null,
    has_baseline: baselineScore !== null,
    has_final: finalScore !== null,
    active_session: activeSession ? publicSession(activeSession) : null,
    category_performance: performance,
    strengths: sortedAccuracy.slice(0, 3).map((item) => item.category),
    weak_areas: sortedAccuracy
      .slice(-3)
      .reverse()
      .map((item) => item.category),
    recent_attempts: recentAttempts,
  });
}

export function buildProgress(data: UserProgressData): ProgressSummary {
  const baselineScore = latestBaselineScore(data);
  const finalScore = completedSessions(data, "final").at(-1)?.score ?? null;
  const currentScore = finalScore ?? currentTrainingScore(data) ?? baselineScore;
  return GetProgressResponse.parse({
    baseline_score: baselineScore,
    current_score: currentScore,
    improvement:
      baselineScore === null || currentScore === null
        ? null
        : currentScore - baselineScore,
    category_performance: categoryPerformance(data.attempts),
    completed_sessions: data.sessions.filter(
      (session) => session.status === "completed",
    ).length,
    total_attempts: data.attempts.length,
  });
}

export function requireOwnedSession(
  sessions: SessionRow[],
  sessionId: string,
): SessionRow {
  const session = sessions.find((candidate) => candidate.id === sessionId);
  if (!session) throw new HttpError(404, "NOT_FOUND", "The requested session was not found.");
  return session;
}
