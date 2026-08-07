import { FormSubjectResult } from "./formsData";

/**
 * Optional Requirement 5: Awards Eligibility flag.
 *
 * A learner is flagged awards-eligible when:
 *   1. General Average (mean of all subject Final Grades) is 90 or higher,
 *   2. no subject Final Grade is below 80, and
 *   3. no disciplinary (behavior) entry exists in `anecdotal_records` for the
 *      awarding quarter.
 *
 * This is a pure, deterministic helper so the flag can be computed on the fly by
 * SF9, the learner profile, and the ID card without persisting a mutable column.
 */

export interface AwardsEligibilityInput {
  /** One entry per subject, each carrying its four quarterly grades + final grade. */
  subjectResults: FormSubjectResult[];
  /** 1-based quarter numbers that have a disciplinary (behavior) anecdote. */
  disciplinaryQuarters?: number[];
  /** Quarter being awarded; defaults to 4 (year-end General Average). */
  targetQuarter?: number;
}

export interface AwardsEligibilityResult {
  eligible: boolean;
  generalAverage: number | null;
  finalGrades: number[];
  reasons: string[];
}

/** Mean of a list of grades; null when there is nothing to average. */
export function averageOf(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

/** Mean of each subject's Final Grade (the General Average, DO 015). */
export function generalAverage(subjectResults: FormSubjectResult[]): number | null {
  const finals = subjectResults
    .map((s) => s.finalGrade)
    .filter((g): g is number => g !== null && g !== undefined);
  return averageOf(finals);
}

export function computeAwardsEligibility(
  input: AwardsEligibilityInput
): AwardsEligibilityResult {
  const { subjectResults, disciplinaryQuarters = [], targetQuarter = 4 } = input;

  const finalGrades = subjectResults
    .map((s) => s.finalGrade)
    .filter((g): g is number => g !== null && g !== undefined);

  const ga = generalAverage(subjectResults);
  const reasons: string[] = [];

  if (ga === null || finalGrades.length === 0) {
    return {
      eligible: false,
      generalAverage: ga,
      finalGrades,
      reasons: ["No finalized subject grades are available to compute the General Average."],
    };
  }

  if (ga < 90) {
    reasons.push(`General Average is ${ga.toFixed(2)} — must be at least 90.`);
  }

  const below80 = finalGrades.filter((g) => g < 80);
  if (below80.length > 0) {
    reasons.push(
      `Final Grade below 80 found: ${below80.map((g) => g.toFixed(0)).join(", ")} — no Final Grade may be below 80.`
    );
  }

  if (disciplinaryQuarters.includes(targetQuarter)) {
    reasons.push(
      `A disciplinary (behavior) anecdotal record exists for Quarter ${targetQuarter}.`
    );
  }

  const eligible =
    ga >= 90 && below80.length === 0 && !disciplinaryQuarters.includes(targetQuarter);

  return { eligible, generalAverage: ga, finalGrades, reasons };
}
