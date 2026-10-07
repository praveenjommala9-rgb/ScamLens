import { describe, expect, it } from "vitest";
import {
  SCENARIO_CATEGORIES,
  type Difficulty,
} from "./database.types";
import {
  chooseAdaptiveTrainingScenarios,
  chooseBalancedAssessmentScenarios,
  summarizeRecentCategoryStats,
} from "./adaptive";

const difficulties: Difficulty[] = ["easy", "easy", "medium", "medium", "hard"];
const scenarios = SCENARIO_CATEGORIES.flatMap((category, categoryIndex) =>
  difficulties.map((difficulty, index) => ({
    id: `scenario-${categoryIndex}-${index}`,
    title: `${category} ${difficulty} ${index}`,
    category,
    difficulty,
    active: true,
  })),
);

describe("scenario selection", () => {
  it("selects one scenario per category and keeps final assessment items distinct", () => {
    const baseline = chooseBalancedAssessmentScenarios(scenarios, new Set(), "easy");
    const final = chooseBalancedAssessmentScenarios(
      scenarios,
      new Set(baseline.map((item) => item.id)),
      "medium",
    );

    expect(baseline).toHaveLength(8);
    expect(final).toHaveLength(8);
    expect(new Set(baseline.map((item) => item.category)).size).toBe(8);
    expect(new Set(final.map((item) => item.category)).size).toBe(8);
    expect(final.every((item) => !baseline.some((base) => base.id === item.id))).toBe(true);
    expect(baseline.every((item) => item.difficulty === "easy")).toBe(true);
    expect(final.every((item) => item.difficulty === "medium")).toBe(true);
  });

  it("starts adaptive training with the weakest category and adapts difficulty", () => {
    const stats = SCENARIO_CATEGORIES.map((category, index) => ({
      category,
      accuracy: index === 0 ? 45 : index === 1 ? 78 : 90,
      attempts: 5,
    }));
    const selected = chooseAdaptiveTrainingScenarios(scenarios, stats, new Set());

    expect(selected).toHaveLength(8);
    expect(selected[0]?.category).toBe(SCENARIO_CATEGORIES[0]);
    expect(selected[0]?.difficulty).toBe("easy");
    expect(new Set(selected.map((item) => item.id)).size).toBe(8);
  });

  it("uses harder items for high accuracy and avoids a recently seen scenario when possible", () => {
    const stats = SCENARIO_CATEGORIES.map((category) => ({
      category,
      accuracy: 90,
      attempts: 8,
    }));
    const withoutRecent = chooseAdaptiveTrainingScenarios(scenarios, stats, new Set());
    const recentId = withoutRecent[0]!.id;
    const withRecent = chooseAdaptiveTrainingScenarios(
      scenarios,
      stats,
      new Set([recentId]),
    );

    expect(withoutRecent[0]?.difficulty).toBe("hard");
    expect(withRecent[0]?.id).not.toBe(recentId);
    expect(new Set(withRecent.map((item) => item.id)).size).toBe(8);
  });

  it("bases adaptive accuracy on the latest three outcomes for each category", () => {
    const rows = [
      { category: SCENARIO_CATEGORIES[0], is_correct: false },
      { category: SCENARIO_CATEGORIES[0], is_correct: false },
      { category: SCENARIO_CATEGORIES[0], is_correct: false },
      { category: SCENARIO_CATEGORIES[0], is_correct: true },
      { category: SCENARIO_CATEGORIES[0], is_correct: true },
    ];
    const stats = summarizeRecentCategoryStats(rows);

    expect(stats[0]).toEqual({
      category: SCENARIO_CATEGORIES[0],
      accuracy: 0,
      attempts: 3,
    });
    expect(stats[1]?.accuracy).toBe(50);
    expect(stats[1]?.attempts).toBe(0);
  });
});
