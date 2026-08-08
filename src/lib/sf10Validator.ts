/**
 * sf10Validator.ts
 *
 * Validation layer for SF10FullOutput objects produced by sf10Parser.ts.
 * Performs structural and semantic checks without modifying the parsed data.
 *
 * Usage:
 *   import { validateSF10 } from "@/lib/sf10Validator";
 *   const result = validateSF10(sf10Full);
 *   if (!result.valid) console.error(result.errors);
 */

import type { SF10FullOutput, SF10LearningArea } from "./sf10Parser";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type SF10ErrorCode =
  | "LRN_MISSING"
  | "LRN_INVALID_FORMAT"
  | "NAME_MISSING"
  | "BIRTHDATE_MISSING"
  | "BIRTHDATE_INVALID"
  | "SEX_MISSING"
  | "GRADE_OUT_OF_RANGE"
  | "MAPEH_COMPONENT_MISMATCH"
  | "GENERAL_AVERAGE_MISMATCH"
  | "FINAL_RATING_MISMATCH";

export type SF10WarningCode =
  | "MISSING_SCHOLASTIC_RECORDS"
  | "PARTIAL_QUARTER"
  | "ELIGIBILITY_INCOMPLETE"
  | "FINAL_RATING_NOT_COMPUTED"
  | "MAPEH_NO_COMPONENTS"
  | "CERTIFICATION_EMPTY";

export interface SF10ValidationError {
  code: SF10ErrorCode;
  message: string;
  /** Optional location for easier debugging */
  path?: string;
}

export interface SF10ValidationWarning {
  code: SF10WarningCode;
  message: string;
  path?: string;
}

export interface SF10ValidationResult {
  valid: boolean;
  errors: SF10ValidationError[];
  warnings: SF10ValidationWarning[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

const CORE_SUBJECTS = [
  "Filipino",
  "English",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "Edukasyon sa Pagpapakatao",
  "Technology and Livelihood Education",
  "MAPEH",
] as const;

function gradeInRange(g: number | null): boolean {
  return g == null || (g >= 60 && g <= 100);
}

function roundHalf(v: number): number {
  return Math.round(v);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main validator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate an SF10FullOutput object.
 *
 * Returns `valid: true` only when there are zero errors (warnings are allowed).
 */
export function validateSF10(output: SF10FullOutput): SF10ValidationResult {
  const errors: SF10ValidationError[] = [];
  const warnings: SF10ValidationWarning[] = [];

  const li = output.learner_information;

  // ── Learner Information ───────────────────────────────────────────────────

  if (!li.lrn) {
    errors.push({ code: "LRN_MISSING", message: "LRN is missing.", path: "learner_information.lrn" });
  } else if (!/^\d{12}$/.test(li.lrn)) {
    errors.push({
      code: "LRN_INVALID_FORMAT",
      message: `LRN "${li.lrn}" must be exactly 12 digits.`,
      path: "learner_information.lrn",
    });
  }

  if (!li.last_name && !li.first_name) {
    errors.push({ code: "NAME_MISSING", message: "Both last name and first name are missing.", path: "learner_information" });
  }

  if (!li.birthdate) {
    warnings.push({ code: "ELIGIBILITY_INCOMPLETE", message: "Birthdate is missing.", path: "learner_information.birthdate" });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(li.birthdate)) {
    errors.push({
      code: "BIRTHDATE_INVALID",
      message: `Birthdate "${li.birthdate}" is not a valid YYYY-MM-DD date.`,
      path: "learner_information.birthdate",
    });
  } else {
    const dob = new Date(li.birthdate);
    const now = new Date();
    const age = now.getFullYear() - dob.getFullYear();
    if (age < 10 || age > 30) {
      warnings.push({
        code: "ELIGIBILITY_INCOMPLETE",
        message: `Birthdate ${li.birthdate} implies an unusual age (${age} years) for a JHS learner.`,
        path: "learner_information.birthdate",
      });
    }
  }

  if (!li.sex) {
    warnings.push({ code: "ELIGIBILITY_INCOMPLETE", message: "Sex field is missing.", path: "learner_information.sex" });
  }

  // ── JHS Eligibility ───────────────────────────────────────────────────────

  const elig = output.jhs_eligibility;
  if (!elig.completer_type && !elig.elementary_school_name) {
    warnings.push({
      code: "ELIGIBILITY_INCOMPLETE",
      message: "JHS eligibility block appears to be blank (no completer type or elementary school).",
      path: "jhs_eligibility",
    });
  }

  // ── Scholastic Records ────────────────────────────────────────────────────

  if (output.scholastic_records.length === 0) {
    warnings.push({
      code: "MISSING_SCHOLASTIC_RECORDS",
      message: "No scholastic records were extracted from the file.",
      path: "scholastic_records",
    });
  }

  output.scholastic_records.forEach((rec, ri) => {
    const path = `scholastic_records[${ri}]`;

    rec.learning_areas.forEach((la: SF10LearningArea, li_idx: number) => {
      const laPath = `${path}.learning_areas[${li_idx}] (${la.subject})`;

      // Grade range checks
      for (const q of ["q1", "q2", "q3", "q4", "final_rating"] as const) {
        const g = la[q];
        if (!gradeInRange(g)) {
          errors.push({
            code: "GRADE_OUT_OF_RANGE",
            message: `${la.subject} ${q.toUpperCase()} grade ${g} is outside valid range 60–100.`,
            path: `${laPath}.${q}`,
          });
        }
      }

      // MAPEH sub-component cross-check
      if (la.subject === "MAPEH" && la.components.length > 0) {
        const compsByQuarter = (q: "q1" | "q2" | "q3" | "q4"): number | null => {
          const vals = la.components.map((c) => c[q]);
          if (vals.some((v) => v == null)) return null;
          return roundHalf((vals as number[]).reduce((a, b) => a + b, 0) / vals.length);
        };

        for (const q of ["q1", "q2", "q3", "q4"] as const) {
          const recomputed = compsByQuarter(q);
          const stored = la[q];
          if (recomputed != null && stored != null && recomputed !== stored) {
            errors.push({
              code: "MAPEH_COMPONENT_MISMATCH",
              message: `MAPEH ${q.toUpperCase()} stored as ${stored} but components average to ${recomputed}.`,
              path: `${laPath}.${q}`,
            });
          }
        }
      }

      if (la.subject === "MAPEH" && la.components.length === 0) {
        warnings.push({
          code: "MAPEH_NO_COMPONENTS",
          message: `MAPEH row for ${path} has no Music/Arts/PE/Health component rows — combined rating only.`,
          path: laPath,
        });
      }

      // Final rating cross-check
      if (la.q1 != null && la.q2 != null && la.q3 != null && la.q4 != null) {
        const expected = roundHalf((la.q1 + la.q2 + la.q3 + la.q4) / 4);
        if (la.final_rating != null && la.final_rating !== expected) {
          errors.push({
            code: "FINAL_RATING_MISMATCH",
            message: `${la.subject} final rating ${la.final_rating} does not match computed ${expected}.`,
            path: `${laPath}.final_rating`,
          });
        }
      } else if (la.final_rating == null) {
        warnings.push({
          code: "FINAL_RATING_NOT_COMPUTED",
          message: `${la.subject} has one or more missing quarterly grades; final rating not computed.`,
          path: `${laPath}.final_rating`,
        });
      }
    });

    // Quarterly General Average cross-check
    const ga = rec.general_average;
    for (const q of ["q1", "q2", "q3", "q4"] as const) {
      if (ga[q] != null) {
        // Verify against core subjects
        const coreGrades: number[] = [];
        let allPresent = true;
        for (const subj of CORE_SUBJECTS) {
          const la = rec.learning_areas.find((l) => l.subject === subj);
          const grade = la ? la[q] : null;
          if (grade == null) { allPresent = false; break; }
          coreGrades.push(grade);
        }
        if (allPresent && coreGrades.length === 8) {
          const expected = roundHalf(coreGrades.reduce((a, b) => a + b, 0) / 8);
          if (ga[q] !== expected) {
            errors.push({
              code: "GENERAL_AVERAGE_MISMATCH",
              message: `${path} GA ${q.toUpperCase()} stored as ${ga[q]} but recomputed as ${expected}.`,
              path: `${path}.general_average.${q}`,
            });
          }
        }
      } else {
        // Warn if some but not all quarters have grades
        const anyHasGrade = rec.learning_areas.some((la) => la[q] != null);
        if (anyHasGrade) {
          warnings.push({
            code: "PARTIAL_QUARTER",
            message: `${path} ${q.toUpperCase()} has some subject grades but not all 8 core subjects — GA set to null.`,
            path: `${path}.general_average.${q}`,
          });
        }
      }
    }
  });

  // ── Certifications ────────────────────────────────────────────────────────

  const certFields = [
    output.certifications.front_certification,
    output.certifications.back_certification,
  ];
  const certNames = ["front_certification", "back_certification"] as const;
  certFields.forEach((cert, ci) => {
    const hasAny = cert.student_name || cert.lrn || cert.principal_name || cert.date_certified;
    if (!hasAny) {
      warnings.push({
        code: "CERTIFICATION_EMPTY",
        message: `certifications.${certNames[ci]} appears to be blank.`,
        path: `certifications.${certNames[ci]}`,
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
