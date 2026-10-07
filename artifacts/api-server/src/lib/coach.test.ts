import { describe, expect, it } from "vitest";
import { validateCoachFeedback } from "./coach";

const detected = ["Urgency"] as const;
const missed = ["Suspicious link/domain"] as const;
const goodFeedback = {
  coaching_summary: "You paused before responding to the urgent request.",
  what_you_did_well: ["You noticed Urgency in the request."],
  missed_signals: ["Check the Suspicious link/domain before opening it."],
  next_rule: "Open the official app or type its known address yourself.",
  focus_category: "Banking & Payment",
};

describe("AI coaching validation", () => {
  it("accepts schema-valid, scenario-specific feedback", () => {
    expect(
      validateCoachFeedback(
        goodFeedback,
        "Banking & Payment",
        [...detected],
        [...missed],
      ),
    ).toEqual(goodFeedback);
  });

  it("rejects coaching that invents detected or missed signals", () => {
    expect(
      validateCoachFeedback(
        {
          ...goodFeedback,
          what_you_did_well: ["You noticed Credential request."],
        },
        "Banking & Payment",
        [...detected],
        [...missed],
      ),
    ).toBeNull();
    expect(
      validateCoachFeedback(
        {
          ...goodFeedback,
          missed_signals: ["You missed an unusual sender."],
        },
        "Banking & Payment",
        [...detected],
        [...missed],
      ),
    ).toBeNull();
  });

  it("rejects a focus category that differs from the scenario", () => {
    expect(
      validateCoachFeedback(
        { ...goodFeedback, focus_category: "Tech Support" },
        "Banking & Payment",
        [...detected],
        [...missed],
      ),
    ).toBeNull();
  });
});
