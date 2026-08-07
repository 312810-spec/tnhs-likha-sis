import { db, LocalClassRecordGrade } from "./db";
import {
  computeFullGradeRecord,
  SubjectWeight,
  DEFAULT_SUBJECT_WEIGHTS,
  TransmutationEntry,
} from "./gradingEngine";
import { GradingModeEnum, SubjectClassification } from "@/types/database.types";

/**
 * Forms data layer for TNHS LIKHA-SIS.
 *
 * Sources the CSV-style DepEd forms (SF1, SF5, SF6, SF9, SF10) from the data
 * already in the system:
 *   - students / sections / subjects are read from the Dexie offline store
 *     (seeded with the school's demo learners),
 *   - quarterly grades are read from `class_record_grades`; any learner/subject/
 *     quarter cell that the school has not yet entered is filled with a
 *     deterministic sample value so every form previews complete (mirroring the
 *     demo-first approach used across this build).
 *
 * All grade math goes through `computeFullGradeRecord` + `lookupTransmutedGrade`
 * so the forms are guaranteed to agree with the DO 015 grading engine.
 */

export const SCHOOL_NAME = "Tingub National High School";
export const SCHOOL_ADDRESS = "Tingub, Mandaue City, Cebu";
export const SCHOOL_ID = "320390";
export const SCHOOL_YEAR = "2026-2027";

export const QUARTERS = [1, 2, 3, 4] as const;

// -----------------------------------------------------------------------------
// Canonical demo dataset (sections, learners, subjects)
// -----------------------------------------------------------------------------

export interface FormSection {
  id: string;
  grade_level: string;
  section_name: string;
  school_year: string;
}

export interface FormStudent {
  id: string;
  lrn: string;
  full_name: string;
  section_id: string;
  grade_level: string;
  sex?: string | null;
  birthdate?: string | null;
  address?: string | null;
  validation_token?: string | null;
}

export interface FormSubject {
  id: string;
  name: string;
  classification: SubjectClassification;
  grade_level: string;
}

export const DEMO_SECTIONS: FormSection[] = [
  { id: "sec-7a", grade_level: "Grade 7", section_name: "Sampaguita", school_year: SCHOOL_YEAR },
  { id: "sec-12a", grade_level: "Grade 12", section_name: "STEM Alpha", school_year: SCHOOL_YEAR },
];

export const DEMO_STUDENTS: FormStudent[] = [
  { id: "std-1", lrn: "109823471001", full_name: "Alvarez, Mateo Cruz", section_id: "sec-7a", grade_level: "Grade 7", sex: "Male", birthdate: "2012-03-14", address: "Purok 2, Tingub, Mandaue City", validation_token: "demo-token-std-1-1b3b8c" },
  { id: "std-2", lrn: "109823471002", full_name: "Bautista, Chloe Reyes", section_id: "sec-7a", grade_level: "Grade 7", sex: "Female", birthdate: "2011-11-02", address: "Purok 5, Tingub, Mandaue City", validation_token: "demo-token-std-2-1e6b3a" },
  { id: "std-3", lrn: "109823471003", full_name: "Dela Cruz, Juan Pedro", section_id: "sec-7a", grade_level: "Grade 7", sex: "Male", birthdate: "2012-01-27", address: "Purok 1, Tingub, Mandaue City", validation_token: "demo-token-std-3-f5a623" },
  { id: "std-4", lrn: "109823471004", full_name: "Garcia, Sophia Santos", section_id: "sec-7a", grade_level: "Grade 7", sex: "Female", birthdate: "2011-08-19", address: "Purok 3, Tingub, Mandaue City", validation_token: "demo-token-std-4-e8720c" },
  { id: "std-12-1", lrn: "112345678901", full_name: "Ramirez, Denise Lim", section_id: "sec-12a", grade_level: "Grade 12", sex: "Female", birthdate: "2007-05-21", address: "Purok 6, Tingub, Mandaue City", validation_token: "demo-token-std-12-1" },
  { id: "std-12-2", lrn: "112345678902", full_name: "Sotto, Renz Mar", section_id: "sec-12a", grade_level: "Grade 12", sex: "Male", birthdate: "2006-12-09", address: "Purok 4, Tingub, Mandaue City", validation_token: "demo-token-std-12-2" },
];

export const DEMO_SUBJECTS: FormSubject[] = [
  { id: "sub-math7", name: "Mathematics 7", classification: "jhs_core", grade_level: "Grade 7" },
  { id: "sub-science7", name: "Science 7", classification: "jhs_core", grade_level: "Grade 7" },
  { id: "sub-immersion12", name: "Work Immersion", classification: "shs_work_immersion", grade_level: "Grade 12" },
  { id: "sub-research12", name: "Cap-Stone Research & Design", classification: "shs_research_design", grade_level: "Grade 12" },
];

/** Deterministic per-learner baseline performance used to synthesize sample grades. */
const DEMO_PROFILE: Record<string, number> = {
  "std-1": 94,   // high achiever -> awards-eligible in the demo
  "std-2": 88,
  "std-3": 84,
  "std-4": 70,   // low performer -> produces a failing subject in the demo
  "std-12-1": 91,
  "std-12-2": 80,
};

/** Deterministic sample percentage for one learner/subject/quarter cell. */
function demoPercent(studentId: string, subjectIndex: number, quarter: number): number {
  const base = DEMO_PROFILE[studentId] ?? 80;
  // Small stable wobble so the four quarters differ per subject without randomness.
  const wobble = ((subjectIndex * 3 + quarter * 5) % 13) - 6;
  return Math.max(40, Math.min(100, base + wobble));
}

// -----------------------------------------------------------------------------
// Runtime data loaders (merge Dexie with the demo set)
// -----------------------------------------------------------------------------

export async function getSections(): Promise<FormSection[]> {
  const local = await db.sections.toArray();
  if (local.length > 0) {
    return local.map((s) => ({
      id: s.id,
      grade_level: s.grade_level,
      section_name: s.section_name,
      school_year: SCHOOL_YEAR,
    }));
  }
  return DEMO_SECTIONS;
}

export async function getStudents(): Promise<FormStudent[]> {
  const local = await db.students.toArray();
  // Always include the demo Grade 12 learners so every section previews populated;
  // Dexie-seeded Grade 7 learners win over their demo twins by id.
  const byId = new Map<string, FormStudent>();
  for (const s of DEMO_STUDENTS) byId.set(s.id, s);
  for (const s of local) {
    byId.set(s.id, {
      id: s.id,
      lrn: s.lrn,
      full_name: s.full_name,
      section_id: s.section_id,
      grade_level: s.grade_level,
      sex: s.sex ?? null,
      birthdate: s.birthdate ?? null,
      address: s.address ?? null,
      validation_token: s.validation_token ?? null,
    });
  }
  return Array.from(byId.values());
}

export async function getSubjects(): Promise<FormSubject[]> {
  const local = await db.subjects.toArray();
  if (local.length > 0) {
    return local.map((s) => ({
      id: s.id,
      name: s.name,
      classification: s.classification,
      grade_level:
        s.id.includes("immersion") || s.id.includes("research") ? "Grade 12" : "Grade 7",
    }));
  }
  return DEMO_SUBJECTS;
}

async function getWeight(classification: SubjectClassification): Promise<SubjectWeight> {
  const row = await db.subject_weights.where("classification").equals(classification).first();
  return row ?? DEFAULT_SUBJECT_WEIGHTS[classification];
}

async function getGradingMode(): Promise<GradingModeEnum> {
  const settings = await db.school_settings.toArray();
  return settings && settings.length > 0 ? settings[0].grading_mode : "adjusted_transmutation";
}

interface GradeCell {
  quarter: number;
  initial: number | null;
  transmuted: number | null;
}

/** Produce the four quarterly grades for one learner in one subject. */
async function buildGradeCells(
  studentId: string,
  subject: FormSubject,
  subjectIndex: number,
  graders: Map<string, LocalClassRecordGrade>
): Promise<GradeCell[]> {
  const weight = await getWeight(subject.classification);
  const gradingMode = await getGradingMode();
  const transmutation: TransmutationEntry[] = await db.transmutation_table.toArray();

  return QUARTERS.map((quarter) => {
    const persisted = graders.get(`${studentId}::${subject.id}::${quarter}`);
    if (persisted && persisted.initial_grade != null && persisted.transmuted_grade != null) {
      return {
        quarter,
        initial: persisted.initial_grade,
        transmuted: persisted.transmuted_grade,
      };
    }

    const pct = demoPercent(studentId, subjectIndex, quarter);
    const computed = computeFullGradeRecord(
      {
        written_work_raw: pct,
        written_work_highest: 100,
        performance_task_raw: pct,
        performance_task_highest: 100,
        st1_raw: pct,
        st1_highest: 100,
        st2_raw: pct,
        st2_highest: 100,
        te_raw: pct,
        te_highest: 100,
      },
      weight,
      gradingMode,
      transmutation
    );
    return {
      quarter,
      initial: computed.initialGrade,
      transmuted: computed.transmutedGrade,
    };
  });
}


// -----------------------------------------------------------------------------
// Public result shapes
// -----------------------------------------------------------------------------

export interface FormSubjectResult {
  subject: FormSubject;
  quarters: GradeCell[];
  /** Mean of the four quarterly Transmuted grades (the official DO 015 final). */
  finalGrade: number | null;
  remarks: string;
}

export interface FormLearnerResult {
  student: FormStudent;
  section: FormSection | undefined;
  subjects: FormSubjectResult[];
  generalAverage: number | null;
  quarterlyGeneralAverages: (number | null)[];
}

export interface Sf5Row {
  student: FormStudent;
  subject: FormSubject;
  quarters: GradeCell[];
  finalGrade: number | null;
  remarks: string;
}

/** Mean of grades, rounded to 2 decimals. */
function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 100) / 100;
}

function finalRemarks(finalGrade: number | null): string {
  if (finalGrade === null) return "No grade";
  return finalGrade >= 75 ? "Promoted" : "Failed";
}

async function loadGraders(): Promise<Map<string, LocalClassRecordGrade>> {
  const rows = await db.class_record_grades.toArray();
  const map = new Map<string, LocalClassRecordGrade>();
  for (const row of rows) {
    map.set(`${row.student_id}::${row.subject_id}::${row.quarter}`, row);
  }
  return map;
}

// -----------------------------------------------------------------------------
// Form builders
// -----------------------------------------------------------------------------

/** Build one learner's full subject-grade profile (used by SF9, SF10). */
export async function buildLearnerResults(student: FormStudent): Promise<FormLearnerResult> {
  const sections = await getSections();
  const subjects = await getSubjects();
  const graders = await loadGraders();
  const section = sections.find((s) => s.id === student.section_id);

  const subjectResults: FormSubjectResult[] = [];
  for (let i = 0; i < subjects.length; i++) {
    const subject = subjects[i];
    if (subject.grade_level !== student.grade_level) continue;

    const cells = await buildGradeCells(student.id, subject, i, graders);
    const finalGrade = mean(cells.map((c) => c.transmuted).filter((g): g is number => g !== null));
    subjectResults.push({
      subject,
      quarters: cells,
      finalGrade,
      remarks: finalRemarks(finalGrade),
    });
  }
  subjectResults.sort((a, b) => a.subject.name.localeCompare(b.subject.name));

  const finalGrades = subjectResults
    .map((r) => r.finalGrade)
    .filter((g): g is number => g !== null && g !== undefined);

  const quarterlyGeneralAverages: (number | null)[] = QUARTERS.map((q) => {
    const values = subjectResults
      .map((r) => r.quarters.find((c) => c.quarter === q)?.transmuted)
      .filter((g): g is number => g !== null && g !== undefined);
    return mean(values);
  });

  return {
    student,
    section,
    subjects: subjectResults,
    generalAverage: mean(finalGrades),
    quarterlyGeneralAverages,
  };
}

/** SF1 — School Register: every learner in a section, ordered by surname. */
export async function buildSF1(sectionId: string): Promise<{
  section: FormSection | undefined;
  students: FormStudent[];
  classCount: number;
  male: number;
  female: number;
}> {
  const sections = await getSections();
  const students = await getStudents();
  const section = sections.find((s) => s.id === sectionId);
  const roster = students
    .filter((s) => s.section_id === sectionId)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  return {
    section,
    students: roster,
    classCount: roster.length,
    male: roster.filter((s) => s.sex === "Male").length,
    female: roster.filter((s) => s.sex === "Female").length,
  };
}

/** SF5 — Report on Promotion & Level of Proficiency for one section + subject. */
export async function buildSF5(
  sectionId: string,
  subjectId: string
): Promise<{
  section: FormSection | undefined;
  subject: FormSubject | undefined;
  rows: Sf5Row[];
}> {
  const sections = await getSections();
  const students = await getStudents();
  const subjects = await getSubjects();
  const graders = await loadGraders();

  const section = sections.find((s) => s.id === sectionId);
  const subject = subjects.find((s) => s.id === subjectId);
  if (!subject) return { section, subject, rows: [] };

  const subjectIndex = subjects.findIndex((s) => s.id === subjectId);
  const roster = students
    .filter((s) => s.section_id === sectionId && s.grade_level === subject.grade_level)
    .sort((a, b) => a.full_name.localeCompare(b.full_name));

  const rows: Sf5Row[] = [];
  for (const student of roster) {
    const cells = await buildGradeCells(student.id, subject, subjectIndex, graders);
    const finalGrade = mean(cells.map((c) => c.transmuted).filter((g): g is number => g !== null));
    rows.push({
      student,
      subject,
      quarters: cells,
      finalGrade,
      remarks: finalRemarks(finalGrade),
    });
  }

  return { section, subject, rows };
}

/** SF6 — Summarized Promotion Report: school-wide roll-up of every SF5. */
export async function buildSF6(): Promise<{
  sections: FormSection[];
  subjectGroups: {
    subject: FormSubject;
    sections: { section: FormSection; rows: Sf5Row[] }[];
  }[];
}> {
  const sections = await getSections();
  const students = await getStudents();
  const subjects = await getSubjects();
  const graders = await loadGraders();
  const roster = students;

  const groups: {
    subject: FormSubject;
    sections: { section: FormSection; rows: Sf5Row[] }[];
  }[] = [];

  for (let si = 0; si < subjects.length; si++) {
    const subject = subjects[si];
    const sectionEntries: { section: FormSection; rows: Sf5Row[] }[] = [];

    for (const section of sections) {
      if (section.grade_level !== subject.grade_level) continue;
      const sectionRows: Sf5Row[] = [];
      const sectionStudents = roster
        .filter((s) => s.section_id === section.id)
        .sort((a, b) => a.full_name.localeCompare(b.full_name));

      for (const student of sectionStudents) {
        const cells = await buildGradeCells(student.id, subject, si, graders);
        const finalGrade = mean(
          cells.map((c) => c.transmuted).filter((g): g is number => g !== null)
        );
        sectionRows.push({
          student,
          subject,
          quarters: cells,
          finalGrade,
          remarks: finalRemarks(finalGrade),
        });
      }
      if (sectionRows.length > 0) {
        sectionEntries.push({ section, rows: sectionRows });
      }
    }

    if (sectionEntries.length > 0) {
      groups.push({ subject, sections: sectionEntries });
    }
  }

  return { sections, subjectGroups: groups };
}

/** SF10 — Learner's Permanent Record: learner profile + grade history. */
export async function buildSF10(studentId: string) {
  const students = await getStudents();
  const student = students.find((s) => s.id === studentId) || students[0];
  return buildLearnerResults(student);
}




