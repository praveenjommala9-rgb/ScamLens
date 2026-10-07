import { describe, expect, it } from "vitest";
import type { AttemptRow, SessionRow } from "./database.types";
import { attemptSummary } from "./progress";

const assessmentAttempt: AttemptRow = {
  id: "00000000-0000-4000-8000-000000000101",
  session_id: "00000000-0000-4000-8000-000000000102",
  user_id: "00000000-0000-4000-8000-000000000103",
  scenario_id: "00000000-0000-4000-8000-000000000104",
  answer: "phishing",
  selected_red_flags: ["Urgency"],
  is_correct: true,
  response_time_ms: 900,
  reflection_note: null,
  created_at: "2026-10-07T00:00:00.000Z",
};
const assessmentSession: SessionRow = {
  id: assessmentAttempt.session_id,
  user_id: assessmentAttempt.user_id,
  type: "baseline",
  status: "completed",
  total_questions: 8,
  answered_questions: 8,
  score: 75,
  scenario_ids: [],
  started_at: "2026-10-07T00:00:00.000Z",
  completed_at: "2026-10-07T00:10:00.000Z",
};

describe("attempt history projection", () => {
  it("labels assessment items without exposing correctness or answer fields", () => {
    const item = attemptSummary({
      attempt: assessmentAttempt,
      session: assessmentSession,
      scenario: {
        id: assessmentAttempt.scenario_id,
        title: "A safe simulated message",
        channel: "email",
        category: "Banking & Payment",
        difficulty: "easy",
      },
    });

    expect(item.result_label).toBe("assessment_item");
    expect(item).not.toHaveProperty("is_correct");
    expect(item).not.toHaveProperty("answer");
    expect(item).not.toHaveProperty("selected_red_flags");
  });
});
