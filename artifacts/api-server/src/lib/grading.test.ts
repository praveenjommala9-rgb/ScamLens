import { describe, expect, it } from "vitest";
import type { ScenarioRow } from "./database.types";
import { calculateScore, gradeScenario } from "./grading";

const scenario: Pick<ScenarioRow, "correct_answer" | "red_flags" | "explanation"> = {
  correct_answer: "phishing",
  red_flags: ["Urgency", "Suspicious link/domain", "Credential request"],
  explanation: "Pause and verify the sender using a known channel.",
};

describe("deterministic scenario grading", () => {
  it("checks the answer key and intersects selected flags with authoritative flags", () => {
    expect(
      gradeScenario(scenario, "phishing", [
        "Urgency",
        "Payment request",
        "Credential request",
      ]),
    ).toEqual({
      is_correct: true,
      explanation: scenario.explanation,
      detected_red_flags: ["Urgency", "Credential request"],
      missed_signals: ["Suspicious link/domain"],
    });
  });

  it("marks unsure as incorrect when the scenario has a definitive answer", () => {
    expect(gradeScenario(scenario, "unsure", []).is_correct).toBe(false);
  });

  it("rounds scores consistently and handles an empty denominator", () => {
    expect(calculateScore(1, 8)).toBe(13);
    expect(calculateScore(0, 8)).toBe(0);
    expect(calculateScore(0, 0)).toBe(0);
  });
});
