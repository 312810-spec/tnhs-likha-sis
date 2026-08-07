import {
  calculatePercentage,
  calculateExaminationsPercent,
  calculateInitialGrade,
  lookupTransmutedGrade,
  computeFullGradeRecord,
  DEFAULT_SUBJECT_WEIGHTS,
  DEFAULT_TRANSMUTATION_TABLE,
} from "../src/lib/gradingEngine";

function assertEqual(actual: any, expected: any, message: string) {
  if (Math.abs(Number(actual) - Number(expected)) > 0.001) {
    console.error(`❌ FAIL: ${message} | Expected: ${expected}, Got: ${actual}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message} (${actual})`);
  }
}

console.log("=== RUNNING OFFLINE GRADING ENGINE TESTS (DO 015, s. 2026) ===");

// 1) Written Works % & Performance Tasks %
const wwPct = calculatePercentage(45, 50); // 90%
assertEqual(wwPct, 90, "Written Works % calculation (45/50)");

const ptPct = calculatePercentage(80, 100); // 80%
assertEqual(ptPct, 80, "Performance Tasks % calculation (80/100)");

// 2) Examinations % = (ST1 % * 0.30) + (ST2 % * 0.30) + (TE % * 0.40)
// ST1: 20/25 (80%), ST2: 27/30 (90%), TE: 40/50 (80%)
// EX % = (80 * 0.30) + (90 * 0.30) + (80 * 0.40) = 24 + 27 + 32 = 83%
const exRes = calculateExaminationsPercent(20, 25, 27, 30, 40, 50);
assertEqual(exRes.st1Pct, 80, "ST1 % calculation (20/25)");
assertEqual(exRes.st2Pct, 90, "ST2 % calculation (27/30)");
assertEqual(exRes.tePct, 80, "TE % calculation (40/50)");
assertEqual(exRes.exPct, 83, "Examinations % weighted calculation");

// 3) Initial Grade = (WW% * WW weight) + (PT% * PT weight) + (EX% * EX weight)
// For JHS Core: WW=20% (0.20), PT=50% (0.50), EX=30% (0.30)
// IG = (90 * 0.20) + (80 * 0.50) + (83 * 0.30) = 18 + 40 + 24.9 = 82.90
const jhsWeights = DEFAULT_SUBJECT_WEIGHTS.jhs_core;
const initialGrade = calculateInitialGrade(wwPct, ptPct, exRes.exPct, jhsWeights);
assertEqual(initialGrade, 82.90, "Initial Grade calculation for JHS Core");

// 4) Transmuted Grade
// Mode = adjusted_transmutation: IG 82.90 falls into range [82.40 - 83.99] -> 89
const transmutedAdjusted = lookupTransmutedGrade(initialGrade, "adjusted_transmutation", DEFAULT_TRANSMUTATION_TABLE);
assertEqual(transmutedAdjusted, 89, "Transmuted Grade lookup (adjusted_transmutation)");

// Mode = zero_based: Transmuted Grade equals Initial Grade, unrounded
const transmutedZeroBased = lookupTransmutedGrade(initialGrade, "zero_based", DEFAULT_TRANSMUTATION_TABLE);
assertEqual(transmutedZeroBased, 82.90, "Transmuted Grade in zero_based mode equals unrounded Initial Grade");

// Comprehensive Test for SHS Work Immersion (WW=20%, PT=80%, EX=0%)
const immersionWeights = DEFAULT_SUBJECT_WEIGHTS.shs_work_immersion;
const immersionResult = computeFullGradeRecord(
  {
    written_work_raw: 40,
    written_work_highest: 50, // 80%
    performance_task_raw: 95,
    performance_task_highest: 100, // 95%
  },
  immersionWeights,
  "adjusted_transmutation",
  DEFAULT_TRANSMUTATION_TABLE
);

// IG = (80 * 0.20) + (95 * 0.80) + (0 * 0) = 16 + 76 = 92.00
// IG 92.00 in transmutation table -> 95
assertEqual(immersionResult.initialGrade, 92.00, "SHS Work Immersion Initial Grade");
assertEqual(immersionResult.transmutedGrade, 95, "SHS Work Immersion Transmuted Grade");

console.log("ALL OFFLINE GRADING ENGINE TESTS PASSED SUCCESSFULLY! 🎉");
