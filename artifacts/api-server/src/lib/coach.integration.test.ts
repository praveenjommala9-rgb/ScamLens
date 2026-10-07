import { describe, expect, it, vi } from "vitest";
import type { AttemptRow, ScenarioRow } from "./database.types";
import {
  generateCoachFeedback,
  GEMINI_MODEL,
} from "./coach";
import { gradeScenario } from "./grading";

const coachMocks = vi.hoisted(() => ({
  warn: vi.fn(),
}));

vi.mock("./logger", () => ({
  logger: { warn: coachMocks.warn },
}));

const enabled = process.env.SCAMLENS_LIVE_GEMINI_TEST === "1";
const scenario: ScenarioRow = {
  id: "00000000-0000-4000-8000-000000000301",
  title: "Training-only simulated sign-in notice",
  channel: "email",
  category: "Account Takeover",
  difficulty: "easy",
  sender_name: "Cloudleaf Security",
  sender_address: "security@cloudleaf.example",
  subject: "Review a new sign-in",
  body: "The message asks the recipient to use a supplied link and enter a password.",
  displayed_url: "signin.cloudleaf.example/review",
  correct_answer: "phishing",
  red_flags: ["Suspicious link/domain", "Credential request"],
  explanation: "Open the service directly instead of following a sign-in link.",
  active: true,
  created_at: "2026-10-07T00:00:00.000Z",
  updated_at: "2026-10-07T00:00:00.000Z",
};
const attempt: AttemptRow = {
  id: "00000000-0000-4000-8000-000000000302",
  session_id: "00000000-0000-4000-8000-000000000303",
  user_id: "00000000-0000-4000-8000-000000000304",
  scenario_id: scenario.id,
  answer: "phishing",
  selected_red_flags: ["Credential request"],
  is_correct: true,
  response_time_ms: 1500,
  reflection_note: null,
  created_at: "2026-10-07T00:00:00.000Z",
};

describe.skipIf(!enabled)("Gemini live integration", () => {
  it(
    `returns structured coaching from ${GEMINI_MODEL}`,
    async () => {
      coachMocks.warn.mockReset();
      expect(Boolean(process.env.GEMINI_API_KEY)).toBe(true);
      const grade = gradeScenario(
        scenario,
        attempt.answer,
        attempt.selected_red_flags,
      );
      const feedback = await generateCoachFeedback({
        scenario,
        attempt,
        grade,
        weakCategories: ["Account Takeover"],
      });

      expect(
        feedback,
        JSON.stringify(coachMocks.warn.mock.calls.map(([fields]) => fields)),
      ).not.toBeNull();
      expect(feedback?.focus_category).toBe(scenario.category);
      expect(feedback?.coaching_summary.length).toBeGreaterThan(0);
    },
    25_000,
  );
});
