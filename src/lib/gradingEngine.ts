import { SubjectClassification, GradingMode, GradingModeEnum } from "@/types/database.types";

export interface SubjectWeight {
  classification: SubjectClassification;
  written_work_weight: number;
  performance_task_weight: number;
  examination_weight: number;
}

export interface TransmutationEntry {
  id?: number;
  min_ig: number;
  max_ig: number;
  transmuted_grade: number;
}

export interface GradeInput {
  written_work_raw?: number | null;
  written_work_highest?: number | null;
  performance_task_raw?: number | null;
  performance_task_highest?: number | null;
  st1_raw?: number | null;
  st1_highest?: number | null;
  st2_raw?: number | null;
  st2_highest?: number | null;
  te_raw?: number | null;
  te_highest?: number | null;
}

export interface GradeComputationResult {
  wwPct: number;
  ptPct: number;
  st1Pct: number;
  st2Pct: number;
  tePct: number;
  exPct: number;
  initialGrade: number;
  transmutedGrade: number;
}

/**
 * 1) Raw Percentage Calculation
 * Raw Score % = (Learner Total Raw Score / Highest Possible Score) * 100
 */
export function calculatePercentage(
  rawTotal: number | null | undefined,
  highestPossible: number | null | undefined
): number {
  if (!highestPossible || highestPossible <= 0 || rawTotal === null || rawTotal === undefined) {
    return 0;
  }
  const pct = (rawTotal / highestPossible) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * 2) Examinations % = (ST1 % * 0.30) + (ST2 % * 0.30) + (TE % * 0.40)
 */
export function calculateExaminationsPercent(
  st1Raw?: number | null,
  st1Highest?: number | null,
  st2Raw?: number | null,
  st2Highest?: number | null,
  teRaw?: number | null,
  teHighest?: number | null
): { st1Pct: number; st2Pct: number; tePct: number; exPct: number } {
  const st1Pct = calculatePercentage(st1Raw, st1Highest);
  const st2Pct = calculatePercentage(st2Raw, st2Highest);
  const tePct = calculatePercentage(teRaw, teHighest);

  const exPct = (st1Pct * 0.30) + (st2Pct * 0.30) + (tePct * 0.40);
  return { st1Pct, st2Pct, tePct, exPct };
}

/**
 * Default DO 015, s. 2026 weights fallback mapping
 */
export const DEFAULT_SUBJECT_WEIGHTS: Record<SubjectClassification, SubjectWeight> = {
  jhs_core: { classification: "jhs_core", written_work_weight: 0.20, performance_task_weight: 0.50, examination_weight: 0.30 },
  jhs_tle_mapeh: { classification: "jhs_tle_mapeh", written_work_weight: 0.20, performance_task_weight: 0.50, examination_weight: 0.30 },
  shs_core: { classification: "shs_core", written_work_weight: 0.20, performance_task_weight: 0.50, examination_weight: 0.30 },
  shs_field_exposure: { classification: "shs_field_exposure", written_work_weight: 0.15, performance_task_weight: 0.70, examination_weight: 0.15 },
  shs_arts_sports_wellness: { classification: "shs_arts_sports_wellness", written_work_weight: 0.15, performance_task_weight: 0.70, examination_weight: 0.15 },
  shs_research_design: { classification: "shs_research_design", written_work_weight: 0.40, performance_task_weight: 0.60, examination_weight: 0.00 },
  shs_techpro: { classification: "shs_techpro", written_work_weight: 0.20, performance_task_weight: 0.50, examination_weight: 0.30 },
  shs_work_immersion: { classification: "shs_work_immersion", written_work_weight: 0.20, performance_task_weight: 0.80, examination_weight: 0.00 },
};

/**
 * 3) Initial Grade = (WW % * WW weight) + (PT % * PT weight) + (EX % * EX weight)
 */
export function calculateInitialGrade(
  wwPct: number,
  ptPct: number,
  exPct: number,
  weights: SubjectWeight
): number {
  const initialGrade =
    (wwPct * weights.written_work_weight) +
    (ptPct * weights.performance_task_weight) +
    (exPct * weights.examination_weight);

  // Round to 2 decimal places as standard for Initial Grade
  return Math.round((initialGrade + Number.EPSILON) * 100) / 100;
}

/**
 * Default DepEd 40-row Transmutation Table (min_ig, max_ig, transmuted_grade)
 */
export const DEFAULT_TRANSMUTATION_TABLE: TransmutationEntry[] = [
  { min_ig: 100.00, max_ig: 100.00, transmuted_grade: 100 },
  { min_ig: 98.40, max_ig: 99.99, transmuted_grade: 99 },
  { min_ig: 96.80, max_ig: 98.39, transmuted_grade: 98 },
  { min_ig: 95.20, max_ig: 96.79, transmuted_grade: 97 },
  { min_ig: 93.60, max_ig: 95.19, transmuted_grade: 96 },
  { min_ig: 92.00, max_ig: 93.59, transmuted_grade: 95 },
  { min_ig: 90.40, max_ig: 91.99, transmuted_grade: 94 },
  { min_ig: 88.80, max_ig: 90.39, transmuted_grade: 93 },
  { min_ig: 87.20, max_ig: 88.79, transmuted_grade: 92 },
  { min_ig: 85.60, max_ig: 87.19, transmuted_grade: 91 },
  { min_ig: 84.00, max_ig: 85.59, transmuted_grade: 90 },
  { min_ig: 82.40, max_ig: 83.99, transmuted_grade: 89 },
  { min_ig: 80.80, max_ig: 82.39, transmuted_grade: 88 },
  { min_ig: 79.20, max_ig: 80.79, transmuted_grade: 87 },
  { min_ig: 77.60, max_ig: 79.19, transmuted_grade: 86 },
  { min_ig: 76.00, max_ig: 77.59, transmuted_grade: 85 },
  { min_ig: 74.40, max_ig: 75.99, transmuted_grade: 84 },
  { min_ig: 72.80, max_ig: 74.39, transmuted_grade: 83 },
  { min_ig: 71.20, max_ig: 72.79, transmuted_grade: 82 },
  { min_ig: 69.60, max_ig: 71.19, transmuted_grade: 81 },
  { min_ig: 68.00, max_ig: 69.59, transmuted_grade: 80 },
  { min_ig: 66.40, max_ig: 67.99, transmuted_grade: 79 },
  { min_ig: 64.80, max_ig: 66.39, transmuted_grade: 78 },
  { min_ig: 63.20, max_ig: 64.79, transmuted_grade: 77 },
  { min_ig: 61.60, max_ig: 63.19, transmuted_grade: 76 },
  { min_ig: 60.00, max_ig: 61.59, transmuted_grade: 75 },
  { min_ig: 56.00, max_ig: 59.99, transmuted_grade: 74 },
  { min_ig: 52.00, max_ig: 55.99, transmuted_grade: 73 },
  { min_ig: 48.00, max_ig: 51.99, transmuted_grade: 72 },
  { min_ig: 44.00, max_ig: 47.99, transmuted_grade: 71 },
  { min_ig: 40.00, max_ig: 43.99, transmuted_grade: 70 },
  { min_ig: 36.00, max_ig: 39.99, transmuted_grade: 69 },
  { min_ig: 32.00, max_ig: 35.99, transmuted_grade: 68 },
  { min_ig: 28.00, max_ig: 31.99, transmuted_grade: 67 },
  { min_ig: 24.00, max_ig: 27.99, transmuted_grade: 66 },
  { min_ig: 20.00, max_ig: 23.99, transmuted_grade: 65 },
  { min_ig: 16.00, max_ig: 19.99, transmuted_grade: 64 },
  { min_ig: 12.00, max_ig: 15.99, transmuted_grade: 63 },
  { min_ig: 8.00, max_ig: 11.99, transmuted_grade: 62 },
  { min_ig: 0.00, max_ig: 7.99, transmuted_grade: 60 },
];

/**
 * 4) Transmuted Grade Calculation based on school_settings.grading_mode
 */
export function lookupTransmutedGrade(
  initialGrade: number,
  gradingMode: GradingModeEnum,
  table: TransmutationEntry[] = DEFAULT_TRANSMUTATION_TABLE
): number {
  if (gradingMode === "zero_based") {
    // When zero_based, Transmuted Grade equals Initial Grade, unrounded.
    return initialGrade;
  }

  // Adjusted Transmutation lookup
  if (initialGrade >= 100) return 100;
  if (initialGrade <= 0) return 60;

  const found = table.find(
    (entry) => initialGrade >= entry.min_ig && initialGrade <= entry.max_ig
  );

  if (found) {
    return found.transmuted_grade;
  }

  // Fallback rounding safety if fractional bounds gap occurs
  for (const entry of table) {
    if (initialGrade >= entry.min_ig - 0.005 && initialGrade <= entry.max_ig + 0.005) {
      return entry.transmuted_grade;
    }
  }

  return Math.round(initialGrade);
}

/**
 * Comprehensive Grading Computation Handler
 */
export function computeFullGradeRecord(
  input: GradeInput,
  weights: SubjectWeight,
  gradingMode: GradingModeEnum,
  transmutationTable: TransmutationEntry[] = DEFAULT_TRANSMUTATION_TABLE
): GradeComputationResult {
  const wwPct = calculatePercentage(input.written_work_raw, input.written_work_highest);
  const ptPct = calculatePercentage(input.performance_task_raw, input.performance_task_highest);
  const { st1Pct, st2Pct, tePct, exPct } = calculateExaminationsPercent(
    input.st1_raw,
    input.st1_highest,
    input.st2_raw,
    input.st2_highest,
    input.te_raw,
    input.te_highest
  );

  const initialGrade = calculateInitialGrade(wwPct, ptPct, exPct, weights);
  const transmutedGrade = lookupTransmutedGrade(initialGrade, gradingMode, transmutationTable);

  return {
    wwPct,
    ptPct,
    st1Pct,
    st2Pct,
    tePct,
    exPct,
    initialGrade,
    transmutedGrade,
  };
}
