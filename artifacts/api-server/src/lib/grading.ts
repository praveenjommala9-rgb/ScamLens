import type { Answer, RedFlag, ScenarioRow } from "./database.types";

export interface DeterministicGrade {
  is_correct: boolean;
  explanation: string;
  detected_red_flags: RedFlag[];
  missed_signals: RedFlag[];
}

export function gradeScenario(
  scenario: Pick<ScenarioRow, "correct_answer" | "red_flags" | "explanation">,
  answer: Answer,
  selectedRedFlags: RedFlag[],
): DeterministicGrade {
  const selected = new Set(selectedRedFlags);
  return {
    is_correct: answer === scenario.correct_answer,
    explanation: scenario.explanation,
    detected_red_flags: scenario.red_flags.filter((flag) => selected.has(flag)),
    missed_signals: scenario.red_flags.filter((flag) => !selected.has(flag)),
  };
}

export function calculateScore(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 100);
}
