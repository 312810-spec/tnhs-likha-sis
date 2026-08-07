import { SubjectClassification } from "@/types/database.types";
import { LocalClassRecordGrade } from "@/lib/db";
import { DEFAULT_SUBJECT_WEIGHTS, SubjectWeight } from "@/lib/gradingEngine";

/**
 * Validation flags surfaced by the Master Teacher review dashboard before the
 * sign-off decision. Each flag maps to one of the Prompt 3 verification checks:
 *  - missing summative assessment scores
 *  - component weightings that do not match DO 015 / subject_weights
 *  - missing performance tasks
 */

export type ReviewFlagType =
  | "MISSING_SCORES"
  | "MISSING_PERFORMANCE_TASK"
  | "WEIGHT_MISMATCH";

export interface ReviewFlag {
  type: ReviewFlagType;
  label: string;
  detail: string;
}

const EPSILON = 0.005;

/** True when a numeric score field is absent or not filled in. */
export function isMissingScore(value: number | null | undefined): boolean {
  return value === null || value === undefined || value <= 0 || Number.isNaN(value);
}

/**
 * Per-row validation for one student's class record.
 * Reports missing component scores and missing performance tasks.
 */
export function validateRecordFlags(record: LocalClassRecordGrade): ReviewFlag[] {
  const flags: ReviewFlag[] = [];

  const fields: Array<[keyof LocalClassRecordGrade, string]> = [
    ["written_work_raw", "Written Works raw score"],
    ["written_work_highest", "Written Works highest possible score"],
    ["performance_task_raw", "Performance Tasks raw score"],
    ["performance_task_highest", "Performance Tasks highest possible score"],
    ["st1_raw", "Summative Test 1 raw score"],
    ["st1_highest", "Summative Test 1 highest possible score"],
    ["st2_raw", "Summative Test 2 raw score"],
    ["st2_highest", "Summative Test 2 highest possible score"],
    ["te_raw", "Teacher-Made Exam raw score"],
    ["te_highest", "Teacher-Made Exam highest possible score"],
  ];

  const missingNames = fields
    .filter(([key]) => isMissingScore(record[key] as number | null | undefined))
    .map(([, label]) => label);

  if (missingNames.length > 0) {
    flags.push({
      type: "MISSING_SCORES",
      label: "Missing scores",
      detail: `Unfilled: ${missingNames.join(", ")}.`,
    });
  }

  if (
    isMissingScore(record.performance_task_raw) ||
    isMissingScore(record.performance_task_highest)
  ) {
    flags.push({
      type: "MISSING_PERFORMANCE_TASK",
      label: "Missing Performance Tasks",
      detail:
        "Performance Tasks (PT) carry the highest DO 015 weight and must be recorded before approval.",
    });
  }

  return flags;
}

export interface WeightValidation {
  matches: boolean;
  flag?: ReviewFlag;
}

/**
 * Group-level validation: the subject's active `subject_weights` configuration
 * must match the DO 015, s. 2026 spec exactly and must total 100% (1.00).
 */
export function validateWeights(
  classification: SubjectClassification,
  activeWeight?: SubjectWeight | null
): WeightValidation {
  const expected = DEFAULT_SUBJECT_WEIGHTS[classification];
  if (!activeWeight) {
    return {
      matches: false,
      flag: {
        type: "WEIGHT_MISMATCH",
        label: "Weights missing",
        detail: `No subject_weights row exists for classification "${classification}".`,
      },
    };
  }

  const close = (a: number, b: number) => Math.abs(a - b) <= EPSILON;

  const sum =
    activeWeight.written_work_weight +
    activeWeight.performance_task_weight +
    activeWeight.examination_weight;

  const weightMismatch =
    !close(activeWeight.written_work_weight, expected.written_work_weight) ||
    !close(activeWeight.performance_task_weight, expected.performance_task_weight) ||
    !close(activeWeight.examination_weight, expected.examination_weight);

  if (weightMismatch || Math.abs(sum - 1) > EPSILON) {
    return {
      matches: false,
      flag: {
        type: "WEIGHT_MISMATCH",
        label: "Weights mismatch",
        detail: `Configured WW/PT/EX = ${(
          activeWeight.written_work_weight * 100
        ).toFixed(0)}% / ${(
          activeWeight.performance_task_weight * 100
        ).toFixed(0)}% / ${(
          activeWeight.examination_weight * 100
        ).toFixed(0)}% (sum ${(sum * 100).toFixed(0)}%). DO 015 requires ${(
          expected.written_work_weight * 100
        ).toFixed(0)}% / ${(expected.performance_task_weight * 100).toFixed(
          0
        )}% / ${(expected.examination_weight * 100).toFixed(0)}%.`,
      },
    };
  }

  return { matches: true };
}
