import {
  SCENARIO_CATEGORIES,
  type ScenarioCategory,
  type ScenarioRow,
} from "./database.types";

export interface CategoryStat {
  category: ScenarioCategory;
  accuracy: number;
  attempts: number;
}

export type ScenarioCandidate = Pick<
  ScenarioRow,
  "id" | "title" | "category" | "difficulty" | "active"
>;

const difficultyRank: Record<ScenarioRow["difficulty"], number> = {
  easy: 0,
  medium: 1,
  hard: 2,
};

function orderedCandidates(
  scenarios: ScenarioCandidate[],
  category: ScenarioCategory,
  accuracy: number,
  recentIds: ReadonlySet<string>,
): ScenarioCandidate[] {
  const difficultyOrder =
    accuracy < 60
      ? ["easy", "medium", "hard"]
      : accuracy <= 80
        ? ["medium", "easy", "hard"]
        : ["hard", "medium", "easy"];
  const rank = new Map(difficultyOrder.map((difficulty, index) => [difficulty, index]));
  return scenarios
    .filter((scenario) => scenario.category === category && scenario.active)
    .sort(
      (left, right) =>
        Number(recentIds.has(left.id)) - Number(recentIds.has(right.id)) ||
        (rank.get(left.difficulty) ?? difficultyRank[left.difficulty]) -
          (rank.get(right.difficulty) ?? difficultyRank[right.difficulty]) ||
        left.title.localeCompare(right.title) ||
        left.id.localeCompare(right.id),
    );
}

function categoryOrder(stats: CategoryStat[]): CategoryStat[] {
  const byCategory = new Map(stats.map((item) => [item.category, item]));
  return SCENARIO_CATEGORIES.map(
    (category) =>
      byCategory.get(category) ?? { category, accuracy: 50, attempts: 0 },
  ).sort((left, right) => {
    const leftBand = left.accuracy < 60 ? 0 : left.accuracy <= 80 ? 1 : 2;
    const rightBand = right.accuracy < 60 ? 0 : right.accuracy <= 80 ? 1 : 2;
    if (leftBand !== rightBand) return leftBand - rightBand;
    if (leftBand === 2 && left.accuracy !== right.accuracy) {
      return right.accuracy - left.accuracy;
    }
    return left.accuracy - right.accuracy || left.category.localeCompare(right.category);
  });
}

export function chooseBalancedAssessmentScenarios(
  scenarios: ScenarioCandidate[],
  excludedIds: ReadonlySet<string>,
  preferredDifficulty: "easy" | "medium",
  count = SCENARIO_CATEGORIES.length,
): ScenarioCandidate[] {
  const selected: ScenarioCandidate[] = [];
  for (const category of SCENARIO_CATEGORIES) {
    const candidates = scenarios
      .filter(
        (scenario) =>
          scenario.active &&
          scenario.category === category &&
          !excludedIds.has(scenario.id),
      )
      .sort(
        (left, right) =>
          Number(left.difficulty !== preferredDifficulty) -
            Number(right.difficulty !== preferredDifficulty) ||
          left.difficulty.localeCompare(right.difficulty) ||
          left.title.localeCompare(right.title) ||
          left.id.localeCompare(right.id),
      );
    const candidate = candidates[0];
    if (!candidate) {
      throw new Error(`Insufficient active assessment scenarios for ${category}.`);
    }
    selected.push(candidate);
  }
  return selected.slice(0, count);
}

export function chooseAdaptiveTrainingScenarios(
  scenarios: ScenarioCandidate[],
  stats: CategoryStat[],
  recentScenarioIds: ReadonlySet<string>,
  count = 8,
): ScenarioCandidate[] {
  const ordered = categoryOrder(stats);
  const selected: ScenarioCandidate[] = [];
  const usedIds = new Set<string>();
  const addFromCategory = (stat: CategoryStat, limit: number) => {
    const candidates = orderedCandidates(
      scenarios,
      stat.category,
      stat.accuracy,
      recentScenarioIds,
    );
    for (const candidate of candidates) {
      if (selected.length >= count || usedIds.has(candidate.id)) break;
      selected.push(candidate);
      usedIds.add(candidate.id);
      if (selected.filter((item) => item.category === stat.category).length >= limit) {
        break;
      }
    }
  };

  for (const stat of ordered.slice(0, 4)) addFromCategory(stat, 2);
  for (const stat of ordered.slice(4)) addFromCategory(stat, 1);

  if (selected.length < count) {
    const remaining = scenarios
      .filter((scenario) => scenario.active && !usedIds.has(scenario.id))
      .sort(
        (left, right) =>
          Number(recentScenarioIds.has(left.id)) -
            Number(recentScenarioIds.has(right.id)) ||
          left.title.localeCompare(right.title) ||
          left.id.localeCompare(right.id),
      );
    selected.push(...remaining.slice(0, count - selected.length));
  }

  if (selected.length < count) {
    throw new Error("The active scenario library cannot fill a training session.");
  }
  return selected.slice(0, count);
}

export function summarizeCategoryStats(
  rows: Array<{ category: ScenarioCategory; is_correct: boolean }>,
): CategoryStat[] {
  const counts = new Map<ScenarioCategory, { attempts: number; correct: number }>();
  for (const row of rows) {
    const current = counts.get(row.category) ?? { attempts: 0, correct: 0 };
    current.attempts += 1;
    if (row.is_correct) current.correct += 1;
    counts.set(row.category, current);
  }
  return SCENARIO_CATEGORIES.map((category) => {
    const current = counts.get(category);
    return {
      category,
      attempts: current?.attempts ?? 0,
      accuracy: current ? Math.round((current.correct / current.attempts) * 100) : 0,
    };
  });
}
