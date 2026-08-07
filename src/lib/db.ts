import Dexie, { Table } from "dexie";
import { GradeStatusEnum, GradingModeEnum, SubjectClassification } from "@/types/database.types";
import { DEFAULT_SUBJECT_WEIGHTS, DEFAULT_TRANSMUTATION_TABLE, SubjectWeight, TransmutationEntry } from "./gradingEngine";

export interface LocalClassRecordGrade {
  id: string;
  student_id: string;
  subject_id: string;
  quarter: number;
  written_work_raw: number | null;
  written_work_highest: number | null;
  performance_task_raw: number | null;
  performance_task_highest: number | null;
  st1_raw: number | null;
  st1_highest: number | null;
  st2_raw: number | null;
  st2_highest: number | null;
  te_raw: number | null;
  te_highest: number | null;
  initial_grade: number | null;
  transmuted_grade: number | null;
  status: GradeStatusEnum;
  review_notes?: string | null;
  created_at?: string;
  updated_at: string;
  synced: 0 | 1; // 0 = unsynced, 1 = synced to Supabase
}

export interface SyncQueueItem {
  id?: number;
  table_name: string;
  action: "UPSERT" | "DELETE";
  payload: Record<string, unknown>;
  timestamp: string;
  status: "PENDING" | "SYNCING" | "FAILED" | "SUCCESS";
  retry_count: number;
  last_error?: string;
}

export interface LocalSchoolSettings {
  id: string;
  grading_mode: GradingModeEnum;
  updated_at: string;
}

export interface LocalStudent {
  id: string;
  lrn: string;
  full_name: string;
  section_id: string;
  grade_level: string;
  /** Opaque token rendered into the learner ID card QR code. */
  validation_token?: string | null;
  token_issued_at?: string | null;
  sex?: string | null;
  birthdate?: string | null;
  address?: string | null;
}

export interface LocalSubject {
  id: string;
  name: string;
  classification: SubjectClassification;
}

export interface LocalSection {
  id: string;
  section_name: string;
  grade_level: string;
  adviser_id?: string | null;
}

export class LikhaSISDatabase extends Dexie {
  class_record_grades!: Table<LocalClassRecordGrade, string>;
  sync_queue!: Table<SyncQueueItem, number>;
  subject_weights!: Table<SubjectWeight, SubjectClassification>;
  transmutation_table!: Table<TransmutationEntry, number>;
  school_settings!: Table<LocalSchoolSettings, string>;
  students!: Table<LocalStudent, string>;
  subjects!: Table<LocalSubject, string>;
  sections!: Table<LocalSection, string>;

  constructor() {
    super("TNHS_LIKHA_SIS_DB");

    this.version(1).stores({
      class_record_grades: "id, student_id, subject_id, quarter, [student_id+subject_id+quarter], status, synced",
      sync_queue: "++id, table_name, status, timestamp",
      subject_weights: "classification",
      transmutation_table: "++id, min_ig",
      school_settings: "id",
      students: "id, section_id, lrn",
      subjects: "id, classification",
      sections: "id",
    });
  }
}

export const db = new LikhaSISDatabase();

/**
 * Seed local Dexie tables with default DO 015, s. 2026 data if empty
 */
export async function initializeDexieDefaults() {
  if (typeof window === "undefined") return;

  try {
    // Seed Subject Weights if empty
    const weightsCount = await db.subject_weights.count();
    if (weightsCount === 0) {
      const defaultWeights = Object.values(DEFAULT_SUBJECT_WEIGHTS);
      await db.subject_weights.bulkAdd(defaultWeights);
    }

    // Seed Transmutation Table if empty
    const transmutationCount = await db.transmutation_table.count();
    if (transmutationCount === 0) {
      await db.transmutation_table.bulkAdd(DEFAULT_TRANSMUTATION_TABLE);
    }

    // Seed School Settings if empty
    const settingsCount = await db.school_settings.count();
    if (settingsCount === 0) {
      await db.school_settings.add({
        id: "default-settings-id",
        grading_mode: "adjusted_transmutation",
        updated_at: new Date().toISOString(),
      });
    }

    // Seed mock subjects & students if empty for instant offline local testing
    const subjectsCount = await db.subjects.count();
    if (subjectsCount === 0) {
      await db.subjects.bulkAdd([
        { id: "sub-math7", name: "Mathematics 7 (JHS Core)", classification: "jhs_core" },
        { id: "sub-science7", name: "Science 7 (JHS Core)", classification: "jhs_core" },
        { id: "sub-immersion12", name: "Work Immersion (SHS Immersion)", classification: "shs_work_immersion" },
        { id: "sub-research12", name: "Cap-Stone Research & Design (SHS Research)", classification: "shs_research_design" },
      ]);
    }

    const sectionsCount = await db.sections.count();
    if (sectionsCount === 0) {
      await db.sections.bulkAdd([
        { id: "sec-7a", section_name: "7 - Sampaguita", grade_level: "Grade 7", adviser_id: "teacher-maria-id" },
        { id: "sec-12a", section_name: "12 - STEM Alpha", grade_level: "Grade 12", adviser_id: "teacher-juan-id" },
      ]);
    }

    const studentsCount = await db.students.count();
    if (studentsCount === 0) {
      await db.students.bulkAdd([
        {
          id: "std-1",
          lrn: "109823471001",
          full_name: "Alvarez, Mateo Cruz",
          section_id: "sec-7a",
          grade_level: "Grade 7",
          sex: "Male",
          birthdate: "2012-03-14",
          address: "Purok 2, Tingub, Mandaue City",
          validation_token: "demo-token-std-1-1b3b8c",
          token_issued_at: new Date().toISOString(),
        },
        {
          id: "std-2",
          lrn: "109823471002",
          full_name: "Bautista, Chloe Reyes",
          section_id: "sec-7a",
          grade_level: "Grade 7",
          sex: "Female",
          birthdate: "2011-11-02",
          address: "Purok 5, Tingub, Mandaue City",
          validation_token: "demo-token-std-2-1e6b3a",
          token_issued_at: new Date().toISOString(),
        },
        {
          id: "std-3",
          lrn: "109823471003",
          full_name: "Dela Cruz, Juan Pedro",
          section_id: "sec-7a",
          grade_level: "Grade 7",
          sex: "Male",
          birthdate: "2012-01-27",
          address: "Purok 1, Tingub, Mandaue City",
          validation_token: "demo-token-std-3-f5a623",
          token_issued_at: new Date().toISOString(),
        },
        {
          id: "std-4",
          lrn: "109823471004",
          full_name: "Garcia, Sophia Santos",
          section_id: "sec-7a",
          grade_level: "Grade 7",
          sex: "Female",
          birthdate: "2011-08-19",
          address: "Purok 3, Tingub, Mandaue City",
          validation_token: "demo-token-std-4-e8720c",
          token_issued_at: new Date().toISOString(),
        },
      ]);
    }
  } catch (err) {
    console.error("Failed to initialize Dexie defaults:", err);
  }
}
