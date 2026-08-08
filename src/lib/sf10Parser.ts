/**
 * sf10Parser.ts
 *
 * Client-side parser for DepEd SF10-JHS (Learner's Permanent Academic Record)
 * Excel (.xlsx) files. Uses SheetJS (xlsx) to read the workbook.
 *
 * Architecture (two entry points):
 *   parseSF10Full(buffer)  — Full structured output matching the SF10-JHS JSON schema.
 *                            Returns SF10FullOutput with learner_information,
 *                            jhs_eligibility, scholastic_records[G7..G10], certifications.
 *
 *   parseSF10Xlsx(buffer)  — Backward-compatible wrapper used by EnrollmentUploadForm.
 *                            Returns the legacy SF10ParsedData shape.
 *
 * Extraction strategy (two layers per sheet):
 *   1. Coordinate-based — targets the fixed cell layout of the standard DepEd
 *      SF10-JHS Excel template.
 *   2. Label-scan fallback — walks every row looking for known field labels and
 *      reads the adjacent value, used when coordinate extraction yields nothing.
 */

import * as XLSX from "xlsx";

// ─────────────────────────────────────────────────────────────────────────────
// ① FULL OUTPUT TYPES (new standardised schema)
// ─────────────────────────────────────────────────────────────────────────────

export interface SF10LearnerInformation {
  last_name: string | null;
  first_name: string | null;
  middle_name: string | null;
  name_extension: string | null;
  lrn: string | null;
  birthdate: string | null; // YYYY-MM-DD
  sex: string | null;
}

export interface SF10PeptPasser {
  is_passer: boolean;
  rating: number | null;
}

export interface SF10JhsEligibility {
  completer_type: string | null;
  general_average: number | null;
  citation: string | null;
  elementary_school_name: string | null;
  school_id: string | null;
  school_address: string | null;
  pept_passer: SF10PeptPasser;
  als_ae_passer: SF10PeptPasser;
  others: string | null;
  exam_date: string | null; // YYYY-MM-DD
  testing_center: string | null;
}

export interface SF10MapehComponent {
  subject: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
}

export interface SF10LearningArea {
  subject: string;
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  final_rating: number | null;
  remarks: string | null;
  /** Only present on the MAPEH row — holds Music/Arts/PE/Health sub-ratings */
  components: SF10MapehComponent[];
}

export interface SF10GeneralAverage {
  q1: number | null;
  q2: number | null;
  q3: number | null;
  q4: number | null;
  final: number | null;
}

export interface SF10RemedialRecord {
  subject: string;
  rating_before: number | null;
  rating_after: number | null;
  remarks: string | null;
}

export interface SF10RemedialClasses {
  conducted_from: string | null; // YYYY-MM-DD
  conducted_to: string | null;   // YYYY-MM-DD
  records: SF10RemedialRecord[];
}

export interface SF10ScholasticRecordFull {
  record_index: number;
  school_name: string | null;
  school_id: string | null;
  district: string | null;
  division: string | null;
  region: string | null;
  grade_level: number | null;
  section: string | null;
  school_year: string | null;
  adviser_name: string | null;
  adviser_signature: string | null;
  learning_areas: SF10LearningArea[];
  general_average: SF10GeneralAverage;
  remedial_classes: SF10RemedialClasses;
}

export interface SF10CertificationBlock {
  student_name: string | null;
  lrn: string | null;
  admission_to_grade: number | null;
  school_name: string | null;
  school_id: string | null;
  last_sy_attended: string | null;
  date_certified: string | null; // YYYY-MM-DD
  principal_name: string | null;
  has_seal: boolean;
}

export interface SF10FullOutput {
  form_type: "SF10-JHS";
  revision: "2017";
  learner_information: SF10LearnerInformation;
  jhs_eligibility: SF10JhsEligibility;
  scholastic_records: SF10ScholasticRecordFull[];
  certifications: {
    front_certification: SF10CertificationBlock;
    back_certification: SF10CertificationBlock;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ② LEGACY TYPES — kept for backward compatibility with EnrollmentUploadForm
// ─────────────────────────────────────────────────────────────────────────────

export interface SF10GradeRow {
  subject: string;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  finalGrade?: number;
}

export interface SF10ScholasticRecord {
  gradeLevel: string;
  section?: string;
  schoolYear?: string;
  adviserName?: string;
  grades: SF10GradeRow[];
}

export interface SF10AcademicRow {
  subject: string;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
}

export interface SF10ParsedData {
  lrn?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  extension?: string;
  fullName?: string;
  birthdate?: string;
  sex?: "Male" | "Female";
  address?: string;
  gradeLevel?: string;
  section?: string;
  elementarySchool?: string;
  elementarySchoolId?: string;
  elementaryGenAve?: number;
  scholasticRecord?: SF10ScholasticRecord;
  academicHistory?: SF10AcademicRow[];
  rawRows?: string[][];
  filledCount: number;
  /** Full SF10 output attached for extended UI usage */
  sf10Full?: SF10FullOutput;
}

// ─────────────────────────────────────────────────────────────────────────────
// ③ CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

/** The 8 core learning areas used for General Average computation */
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

type CoreSubject = (typeof CORE_SUBJECTS)[number];

const MAPEH_COMPONENTS = ["Music", "Arts", "Physical Education", "Health"] as const;

const SUBJECT_ALIAS: Record<string, string> = {
  filipino: "Filipino",
  english: "English",
  math: "Mathematics",
  mathematics: "Mathematics",
  science: "Science",
  "araling panlipunan": "Araling Panlipunan",
  ap: "Araling Panlipunan",
  "edukasyon sa pagpapakatao": "Edukasyon sa Pagpapakatao",
  esp: "Edukasyon sa Pagpapakatao",
  "edukasyon sa pagpapaka-tao": "Edukasyon sa Pagpapakatao",
  "technology and livelihood education": "Technology and Livelihood Education",
  tle: "Technology and Livelihood Education",
  "teknolohiya at kabuhayan": "Technology and Livelihood Education",
  music: "Music",
  arts: "Arts",
  "physical education": "Physical Education",
  pe: "Physical Education",
  health: "Health",
  mapeh: "MAPEH",
};

// ─────────────────────────────────────────────────────────────────────────────
// ④ LOW-LEVEL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function cellStr(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

function labelMatch(cell: string, ...candidates: string[]): boolean {
  const norm = cell.toLowerCase().replace(/[^a-z0-9]/g, "");
  return candidates.some((c) => norm.includes(c.toLowerCase().replace(/[^a-z0-9]/g, "")));
}

function readCell(sheet: XLSX.WorkSheet, addr: string): string {
  const cell = sheet[addr];
  if (!cell) return "";
  return cellStr(cell.w ?? cell.v);
}

function rc(rows: string[][], row: number, col: number): string {
  return rows[row]?.[col] ?? "";
}

function n(val: string | null | undefined): string | null {
  if (!val || !val.trim()) return null;
  return val.trim();
}

function toIsoDate(raw: string): string | null {
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const serial = Number(raw);
  if (!isNaN(serial) && serial > 1 && serial < 100000) {
    const d = XLSX.SSF.parse_date_code(serial);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  return null;
}

function parseSex(raw: string): string | null {
  const norm = raw.toLowerCase().trim();
  if (norm.startsWith("m") || norm === "lalaki") return "Male";
  if (norm.startsWith("f") || norm === "babae") return "Female";
  return null;
}

function parseGrade(raw: string): number | null {
  if (!raw) return null;
  const s = raw.replace(/[^\d.]/g, "");
  const n = parseFloat(s);
  if (isNaN(n)) return null;
  if (n >= 60 && n <= 100) return n;
  return null;
}

function canonicalSubject(raw: string): string {
  const key = raw.toLowerCase().trim().replace(/\s+/g, " ");
  return SUBJECT_ALIAS[key] ?? raw;
}

function parseGradeLevel(raw: string): number | null {
  const roman: Record<string, number> = { VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 };
  const s = raw.trim().toUpperCase();
  for (const [r, nv] of Object.entries(roman)) {
    if (s.includes(r)) return nv;
  }
  const numMatch = s.match(/(\d{1,2})/);
  if (numMatch) {
    const nv = parseInt(numMatch[1], 10);
    if (nv >= 7 && nv <= 12) return nv;
  }
  return null;
}

function findValueAfterLabel(rows: string[][], ...candidates: string[]): string | undefined {
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      if (row[c] && labelMatch(row[c], ...candidates)) {
        for (let k = c + 1; k < Math.min(row.length, c + 6); k++) {
          if (row[k]) return row[k];
        }
        const rowIdx = rows.indexOf(row);
        if (rowIdx + 1 < rows.length && rows[rowIdx + 1][c]) return rows[rowIdx + 1][c];
      }
    }
  }
  return undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑤ GRADE COMPUTATION HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute the MAPEH quarterly rating by averaging its four sub-components.
 * Returns null when any component is missing.
 */
function computeMAPEH(
  music: number | null,
  arts: number | null,
  pe: number | null,
  health: number | null
): number | null {
  if (music == null || arts == null || pe == null || health == null) return null;
  return Math.round((music + arts + pe + health) / 4);
}

/**
 * Compute the quarterly General Average across the 8 core learning areas.
 * Returns null when ANY of the 8 subjects is missing its quarterly rating.
 */
function computeQuarterlyGA(
  areas: SF10LearningArea[],
  quarter: "q1" | "q2" | "q3" | "q4"
): number | null {
  const bySubject = new Map<string, number | null>();
  for (const area of areas) bySubject.set(area.subject, area[quarter]);

  const grades: number[] = [];
  for (const subj of CORE_SUBJECTS) {
    const g = bySubject.get(subj);
    if (g == null) return null; // partial quarter → do not compute
    grades.push(g);
  }
  if (grades.length !== 8) return null;
  return Math.round(grades.reduce((a, b) => a + b, 0) / 8);
}

/**
 * Final Rating for a subject: round((Q1+Q2+Q3+Q4)/4).
 * Returns null when any quarter is missing.
 */
function computeFinalRating(
  q1: number | null,
  q2: number | null,
  q3: number | null,
  q4: number | null
): number | null {
  if (q1 == null || q2 == null || q3 == null || q4 == null) return null;
  return Math.round((q1 + q2 + q3 + q4) / 4);
}

/** Derive remarks from final rating: PASSED / FAILED / null */
function deriveRemarks(finalRating: number | null): string | null {
  if (finalRating == null) return null;
  return finalRating >= 75 ? "PASSED" : "FAILED";
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑥ SCHOLASTIC BLOCK EXTRACTOR (shared for G7–G10)
// ─────────────────────────────────────────────────────────────────────────────

interface BlockExtractOptions {
  gradeLevel: number;
  recordIndex: number;
  rows: string[][];
  sheet: XLSX.WorkSheet;
  /** Row index (0-based) where this grade block header was found */
  blockStartRow: number;
}

function extractScholasticBlock(opts: BlockExtractOptions): SF10ScholasticRecordFull {
  const { gradeLevel, recordIndex, rows, sheet, blockStartRow } = opts;

  // ── School metadata ──────────────────────────────────────────────────────
  let schoolName: string | null = null;
  let schoolId: string | null = null;
  let district: string | null = null;
  let division: string | null = null;
  let region: string | null = null;
  let section: string | null = null;
  let schoolYear: string | null = null;
  let adviserName: string | null = null;

  // Scan rows in a window around the block header for metadata
  const scanStart = Math.max(0, blockStartRow - 3);
  const scanEnd = Math.min(rows.length - 1, blockStartRow + 8);
  for (let r = scanStart; r <= scanEnd; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) continue;

      if (labelMatch(cell, "School", "Name of School") && !schoolName) {
        for (let k = c + 1; k < Math.min(row.length, c + 6); k++) {
          if (row[k] && !labelMatch(row[k], "School", "Name")) { schoolName = row[k]; break; }
        }
      }
      if (labelMatch(cell, "School ID", "SchoolID") && !schoolId) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && /\d/.test(row[k])) { schoolId = row[k]; break; }
        }
      }
      if (labelMatch(cell, "District") && !district) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "District")) { district = row[k]; break; }
        }
      }
      if (labelMatch(cell, "Division") && !division) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Division")) { division = row[k]; break; }
        }
      }
      if (labelMatch(cell, "Region") && !region) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Region")) { region = row[k]; break; }
        }
      }
      if (labelMatch(cell, "Section", "Seksiyon") && !section) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Section")) { section = row[k]; break; }
        }
      }
      if (labelMatch(cell, "School Year", "SY") && !schoolYear) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "School Year", "SY")) { schoolYear = row[k]; break; }
        }
      }
      if (labelMatch(cell, "Adviser", "Class Adviser") && !adviserName) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Adviser")) { adviserName = row[k]; break; }
        }
      }
    }
  }

  // Fallback school name from direct cells near the grade block
  if (!schoolName) {
    const ref = sheet[`B${blockStartRow + 1}`] ?? sheet[`C${blockStartRow + 1}`];
    if (ref) schoolName = n(cellStr(ref.w ?? ref.v));
  }

  // ── Quarter column positions ─────────────────────────────────────────────
  let q1Col = -1, q2Col = -1, q3Col = -1, q4Col = -1, finalCol = -1, remarksCol = -1;

  for (let r = blockStartRow; r <= Math.min(rows.length - 1, blockStartRow + 8); r++) {
    const row = rows[r];
    const hasQLabel = row.some((c) => /q[1-4]|quarter|1st|2nd|3rd|4th/i.test(c));
    if (hasQLabel) {
      row.forEach((cell, ci) => {
        const s = cell.toLowerCase();
        if ((s.includes("q1") || s.includes("1st") || s === "1") && q1Col < 0) q1Col = ci;
        else if ((s.includes("q2") || s.includes("2nd") || s === "2") && q2Col < 0) q2Col = ci;
        else if ((s.includes("q3") || s.includes("3rd") || s === "3") && q3Col < 0) q3Col = ci;
        else if ((s.includes("q4") || s.includes("4th") || s === "4") && q4Col < 0) q4Col = ci;
        if (labelMatch(cell, "Final", "Final Rating", "Average") && finalCol < 0) finalCol = ci;
        if (labelMatch(cell, "Remarks") && remarksCol < 0) remarksCol = ci;
      });
      if (q1Col >= 0) break;
    }
  }

  // Default column layout used in the standard DepEd SF10-JHS template
  if (q1Col < 0) { q1Col = 4; q2Col = 6; q3Col = 8; q4Col = 10; finalCol = 12; remarksCol = 13; }

  // ── Subject rows ─────────────────────────────────────────────────────────
  const mapehComponents: Map<string, { q1: number|null; q2: number|null; q3: number|null; q4: number|null }> = new Map();
  const rawAreas: Map<string, { q1: number|null; q2: number|null; q3: number|null; q4: number|null; remarks: string|null }> = new Map();

  const subjectRowStart = blockStartRow + 1;
  const subjectRowEnd = Math.min(rows.length - 1, blockStartRow + 30);

  for (let r = subjectRowStart; r <= subjectRowEnd; r++) {
    const row = rows[r];
    if (!row || row.every((c) => !c)) continue;

    // Subject candidate: first non-empty cell that is not purely numeric and not a label
    const subjectRaw = row.find(
      (c) =>
        c &&
        !/^\d+$/.test(c) &&
        c.length > 2 &&
        !labelMatch(c, "Q1", "Q2", "Q3", "Q4", "Quarter", "Subject", "Grade", "Final", "Remarks", "Learning Area")
    );
    if (!subjectRaw) continue;

    const canonical = canonicalSubject(subjectRaw);
    const isKnownSubject =
      Object.values(SUBJECT_ALIAS).includes(canonical) ||
      MAPEH_COMPONENTS.some((m) =>
        subjectRaw.toLowerCase().includes(m.toLowerCase().split(" ")[0].toLowerCase())
      ) ||
      /^(Fil|Eng|Math|Sci|AP|EsP|TLE|Music|Arts|PE|Health|MAPEH|Araling|Eduk|Teknolohiya)/i.test(subjectRaw);

    if (!isKnownSubject) continue;

    const q1 = q1Col >= 0 ? parseGrade(row[q1Col] ?? "") : null;
    const q2 = q2Col >= 0 ? parseGrade(row[q2Col] ?? "") : null;
    const q3 = q3Col >= 0 ? parseGrade(row[q3Col] ?? "") : null;
    const q4 = q4Col >= 0 ? parseGrade(row[q4Col] ?? "") : null;
    const remarks = remarksCol >= 0 ? n(row[remarksCol] ?? "") : null;

    // At least one grade must be present to accept the row
    if (q1 == null && q2 == null && q3 == null && q4 == null) continue;

    // Segregate MAPEH components vs. core subjects
    const isMapehComponent = (MAPEH_COMPONENTS as readonly string[]).includes(canonical);

    if (isMapehComponent) {
      mapehComponents.set(canonical, { q1, q2, q3, q4 });
    } else {
      if (!rawAreas.has(canonical)) {
        rawAreas.set(canonical, { q1, q2, q3, q4, remarks });
      }
    }
  }

  // ── Assemble MAPEH row ───────────────────────────────────────────────────
  const musicData = mapehComponents.get("Music") ?? { q1: null, q2: null, q3: null, q4: null };
  const artsData  = mapehComponents.get("Arts")  ?? { q1: null, q2: null, q3: null, q4: null };
  const peData    = mapehComponents.get("Physical Education") ?? { q1: null, q2: null, q3: null, q4: null };
  const healthData= mapehComponents.get("Health") ?? { q1: null, q2: null, q3: null, q4: null };

  const mapehQ1 = computeMAPEH(musicData.q1, artsData.q1, peData.q1, healthData.q1);
  const mapehQ2 = computeMAPEH(musicData.q2, artsData.q2, peData.q2, healthData.q2);
  const mapehQ3 = computeMAPEH(musicData.q3, artsData.q3, peData.q3, healthData.q3);
  const mapehQ4 = computeMAPEH(musicData.q4, artsData.q4, peData.q4, healthData.q4);

  // If the spreadsheet has a combined MAPEH row (no components), accept it as-is
  const existingMapeh = rawAreas.get("MAPEH");
  const resolvedMapehQ1 = mapehQ1 ?? existingMapeh?.q1 ?? null;
  const resolvedMapehQ2 = mapehQ2 ?? existingMapeh?.q2 ?? null;
  const resolvedMapehQ3 = mapehQ3 ?? existingMapeh?.q3 ?? null;
  const resolvedMapehQ4 = mapehQ4 ?? existingMapeh?.q4 ?? null;

  const mapehFinal = computeFinalRating(resolvedMapehQ1, resolvedMapehQ2, resolvedMapehQ3, resolvedMapehQ4);

  const mapehLearningArea: SF10LearningArea = {
    subject: "MAPEH",
    q1: resolvedMapehQ1,
    q2: resolvedMapehQ2,
    q3: resolvedMapehQ3,
    q4: resolvedMapehQ4,
    final_rating: mapehFinal,
    remarks: deriveRemarks(mapehFinal),
    components: (MAPEH_COMPONENTS as readonly string[])
      .filter((m) => mapehComponents.has(m))
      .map((m) => {
        const d = mapehComponents.get(m)!;
        return { subject: m, q1: d.q1, q2: d.q2, q3: d.q3, q4: d.q4 };
      }),
  };

  // ── Build final learning_areas array ─────────────────────────────────────
  const learning_areas: SF10LearningArea[] = [];

  // Order: Filipino, English, Math, Science, AP, EsP, TLE, MAPEH
  const orderedCoreSubjects: CoreSubject[] = [...CORE_SUBJECTS];

  for (const subj of orderedCoreSubjects) {
    if (subj === "MAPEH") {
      learning_areas.push(mapehLearningArea);
    } else {
      const d = rawAreas.get(subj);
      const q1 = d?.q1 ?? null;
      const q2 = d?.q2 ?? null;
      const q3 = d?.q3 ?? null;
      const q4 = d?.q4 ?? null;
      const finalRating = computeFinalRating(q1, q2, q3, q4);
      learning_areas.push({
        subject: subj,
        q1,
        q2,
        q3,
        q4,
        final_rating: finalRating,
        remarks: d ? deriveRemarks(finalRating) : null,
        components: [],
      });
    }
  }

  // ── General Average ──────────────────────────────────────────────────────
  const gaQ1 = computeQuarterlyGA(learning_areas, "q1");
  const gaQ2 = computeQuarterlyGA(learning_areas, "q2");
  const gaQ3 = computeQuarterlyGA(learning_areas, "q3");
  const gaQ4 = computeQuarterlyGA(learning_areas, "q4");

  let gaFinal: number | null = null;
  if (gaQ1 != null && gaQ2 != null && gaQ3 != null && gaQ4 != null) {
    gaFinal = Math.round((gaQ1 + gaQ2 + gaQ3 + gaQ4) / 4);
  }

  const general_average: SF10GeneralAverage = { q1: gaQ1, q2: gaQ2, q3: gaQ3, q4: gaQ4, final: gaFinal };

  return {
    record_index: recordIndex,
    school_name: n(schoolName),
    school_id: n(schoolId),
    district: n(district),
    division: n(division),
    region: n(region),
    grade_level: gradeLevel,
    section: n(section),
    school_year: n(schoolYear),
    adviser_name: n(adviserName),
    adviser_signature: null,
    learning_areas,
    general_average,
    remedial_classes: {
      conducted_from: null,
      conducted_to: null,
      records: [],
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑦ JHS ELIGIBILITY EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

function extractJhsEligibility(rows: string[][], sheet: XLSX.WorkSheet): SF10JhsEligibility {
  void sheet; // reserved for direct-cell fallbacks

  // Find the eligibility block — usually near rows 13–20 on the Front sheet
  let completer_type: string | null = null;
  let general_average: number | null = null;
  let citation: string | null = null;
  let elementary_school_name: string | null = null;
  let school_id: string | null = null;
  let school_address: string | null = null;
  let pept_is_passer = false;
  let pept_rating: number | null = null;
  let als_is_passer = false;
  let als_rating: number | null = null;
  let others: string | null = null;
  let exam_date: string | null = null;
  let testing_center: string | null = null;

  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) continue;

      // Completer type: "Elementary Graduate", "PEPT Passer", "ALS/AE Passer", "Others"
      if (labelMatch(cell, "Elementary Graduate", "Elem Graduate", "Elementary Completer")) {
        completer_type = "Elementary Graduate";
      }

      // General Average
      if (labelMatch(cell, "General Average", "Gen Ave", "General Ave") && !general_average) {
        for (let k = c + 1; k < Math.min(row.length, c + 5); k++) {
          const ave = parseFloat((row[k] ?? "").replace(/[^\d.]/g, ""));
          if (!isNaN(ave) && ave >= 60 && ave <= 100) { general_average = ave; break; }
        }
      }

      // Elementary school name
      if (
        labelMatch(cell, "Elementary", "Elementarya", "Primary School") &&
        !elementary_school_name
      ) {
        for (let k = c + 1; k < Math.min(row.length, c + 6); k++) {
          if (row[k] && !labelMatch(row[k], "Elementary", "School")) {
            elementary_school_name = row[k]; break;
          }
        }
      }

      // School ID (eligibility block)
      if (labelMatch(cell, "School ID", "SchoolID") && !school_id) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && /\d/.test(row[k])) { school_id = row[k]; break; }
        }
      }

      // School address
      if (labelMatch(cell, "Address", "School Address") && !school_address) {
        for (let k = c + 1; k < Math.min(row.length, c + 6); k++) {
          if (row[k] && !labelMatch(row[k], "Address")) { school_address = row[k]; break; }
        }
      }

      // PEPT passer checkbox / rating
      if (labelMatch(cell, "PEPT", "Philippine Educational Placement Test")) {
        pept_is_passer = true;
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          const rating = parseFloat((row[k] ?? "").replace(/[^\d.]/g, ""));
          if (!isNaN(rating) && rating >= 60 && rating <= 100) { pept_rating = rating; break; }
        }
      }

      // ALS/AE passer
      if (labelMatch(cell, "ALS", "Alternative Learning System", "ALS/AE")) {
        als_is_passer = true;
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          const rating = parseFloat((row[k] ?? "").replace(/[^\d.]/g, ""));
          if (!isNaN(rating) && rating >= 60 && rating <= 100) { als_rating = rating; break; }
        }
      }

      // Others
      if (labelMatch(cell, "Others") && !others) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Others")) { others = row[k]; break; }
        }
      }

      // Exam date
      if (labelMatch(cell, "Date of Exam", "Exam Date", "Date of Test") && !exam_date) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          const iso = toIsoDate(row[k] ?? "");
          if (iso) { exam_date = iso; break; }
        }
      }

      // Testing center
      if (labelMatch(cell, "Testing Center", "Center") && !testing_center) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Testing", "Center")) { testing_center = row[k]; break; }
        }
      }

      // Citation / Honor
      if (labelMatch(cell, "Citation", "Award", "Honor", "With Honors") && !citation) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Citation", "Award")) { citation = row[k]; break; }
        }
      }
    }
  }

  // If PEPT or ALS passer found, mark completer type
  if (!completer_type && pept_is_passer) completer_type = "PEPT Passer";
  if (!completer_type && als_is_passer) completer_type = "ALS/AE Passer";

  return {
    completer_type,
    general_average,
    citation,
    elementary_school_name,
    school_id,
    school_address,
    pept_passer: { is_passer: pept_is_passer, rating: pept_rating },
    als_ae_passer: { is_passer: als_is_passer, rating: als_rating },
    others,
    exam_date,
    testing_center,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑧ CERTIFICATION BLOCK EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

function extractCertificationBlock(rows: string[][], startRow: number): SF10CertificationBlock {
  let student_name: string | null = null;
  let lrn: string | null = null;
  let admission_to_grade: number | null = null;
  let school_name: string | null = null;
  let school_id: string | null = null;
  let last_sy_attended: string | null = null;
  let date_certified: string | null = null;
  let principal_name: string | null = null;

  const scanEnd = Math.min(rows.length - 1, startRow + 15);
  for (let r = startRow; r <= scanEnd; r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (!cell) continue;

      if (labelMatch(cell, "Name of Learner", "Student Name", "Pupil Name") && !student_name) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Name")) { student_name = row[k]; break; }
        }
      }
      if (labelMatch(cell, "LRN", "Learner Reference") && !lrn) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          const digits = (row[k] ?? "").replace(/\D/g, "");
          if (digits.length === 12) { lrn = digits; break; }
        }
      }
      if (labelMatch(cell, "Admitted to Grade", "Admission to Grade") && !admission_to_grade) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          const g = parseGradeLevel(row[k] ?? "");
          if (g != null) { admission_to_grade = g; break; }
        }
      }
      if (labelMatch(cell, "School", "Name of School") && !school_name) {
        for (let k = c + 1; k < Math.min(row.length, c + 6); k++) {
          if (row[k] && !labelMatch(row[k], "School", "Name")) { school_name = row[k]; break; }
        }
      }
      if (labelMatch(cell, "School ID") && !school_id) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && /\d/.test(row[k])) { school_id = row[k]; break; }
        }
      }
      if (labelMatch(cell, "Last School Year", "SY Attended", "Last SY") && !last_sy_attended) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Last", "School Year")) { last_sy_attended = row[k]; break; }
        }
      }
      if (labelMatch(cell, "Date", "Date Certified", "Certified") && !date_certified) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          const iso = toIsoDate(row[k] ?? "");
          if (iso) { date_certified = iso; break; }
        }
      }
      if (labelMatch(cell, "Principal", "School Head", "Signed") && !principal_name) {
        for (let k = c + 1; k < Math.min(row.length, c + 4); k++) {
          if (row[k] && !labelMatch(row[k], "Principal", "School")) { principal_name = row[k]; break; }
        }
      }
    }
  }

  return {
    student_name: n(student_name),
    lrn: n(lrn),
    admission_to_grade,
    school_name: n(school_name),
    school_id: n(school_id),
    last_sy_attended: n(last_sy_attended),
    date_certified,
    principal_name: n(principal_name),
    has_seal: false, // cannot be detected from XLSX data
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑨ SHEET-LEVEL EXTRACTOR HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function sheetToRows(sheet: XLSX.WorkSheet, maxRows = 120): string[][] {
  const raw2d: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: true,
  });
  return raw2d.slice(0, maxRows).map((row) => (row as unknown[]).map(cellStr));
}

/** Find all row indices where a grade-level block header appears */
function findGradeBlockRows(rows: string[][], targetGrades: number[]): Map<number, number> {
  const result = new Map<number, number>(); // gradeLevel → rowIndex
  const gradeRomanMap: Record<string, number> = {
    VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12,
  };

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (const cell of row) {
      const s = cell.toUpperCase().replace(/\s+/g, " ").trim();
      for (const [roman, numGrade] of Object.entries(gradeRomanMap)) {
        if (targetGrades.includes(numGrade) && !result.has(numGrade)) {
          if (
            (s.includes(`GRADE ${roman}`) || s.includes(`GRADE ${numGrade}`) || s === `G${numGrade}`) &&
            !s.includes("GRADE " + (numGrade + 1))
          ) {
            result.set(numGrade, r);
          }
        }
      }
      // Also catch numeric labels
      for (const numGrade of targetGrades) {
        if (!result.has(numGrade)) {
          if (s === `GRADE ${numGrade}` || s === `G${numGrade}` || s === `GRADE ${numGrade}`) {
            result.set(numGrade, r);
          }
        }
      }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑩ LEARNER INFORMATION EXTRACTOR
// ─────────────────────────────────────────────────────────────────────────────

function extractLearnerInformation(
  sheet: XLSX.WorkSheet,
  rows: string[][]
): SF10LearnerInformation {
  // ── LRN ──────────────────────────────────────────────────────────────────
  let lrn: string | null = null;
  const lrnCandidates = [
    readCell(sheet, "C7"), readCell(sheet, "D7"),
    readCell(sheet, "M7"), readCell(sheet, "N7"),
    rc(rows, 6, 2), rc(rows, 6, 3), rc(rows, 6, 12), rc(rows, 6, 13),
  ];
  for (const candidate of lrnCandidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length === 12) { lrn = digits; break; }
  }
  if (!lrn) {
    for (let r = 4; r <= 10; r++) {
      for (const cell of (rows[r] ?? [])) {
        const digits = cell.replace(/\D/g, "");
        if (digits.length === 12 && /^\d+$/.test(cell.trim())) { lrn = digits; break; }
      }
      if (lrn) break;
    }
  }

  // ── Names ─────────────────────────────────────────────────────────────────
  let last_name: string | null = null;
  let first_name: string | null = null;
  let middle_name: string | null = null;
  let name_extension: string | null = null;

  const nameHeaderRow = rows.findIndex(
    (r, i) =>
      i >= 7 && i <= 14 &&
      r.some((c) => labelMatch(c, "Last Name", "Surname", "Apelyido"))
  );

  if (nameHeaderRow >= 0) {
    const headerCols = rows[nameHeaderRow];
    let lastCol = -1, firstCol = -1, midCol = -1, extCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Last Name", "Surname")) lastCol = ci;
      else if (labelMatch(cell, "First Name", "Given Name", "Pangalan")) firstCol = ci;
      else if (labelMatch(cell, "Middle Name", "Gitnang")) midCol = ci;
      else if (labelMatch(cell, "Extension", "Ext", "Name Ext")) extCol = ci;
    });

    for (let delta = 1; delta <= 3; delta++) {
      const valueRow = rows[nameHeaderRow + delta];
      if (!valueRow) continue;
      const candidateLast = lastCol >= 0 ? valueRow[lastCol] : "";
      const candidateFirst = firstCol >= 0 ? valueRow[firstCol] : "";
      if (
        (candidateLast && !labelMatch(candidateLast, "Last Name", "Surname")) ||
        (candidateFirst && !labelMatch(candidateFirst, "First Name", "Given Name"))
      ) {
        if (candidateLast && !labelMatch(candidateLast, "Last Name")) last_name = candidateLast;
        if (candidateFirst && !labelMatch(candidateFirst, "First Name", "Pangalan")) first_name = candidateFirst;
        if (midCol >= 0 && valueRow[midCol] && !labelMatch(valueRow[midCol], "Middle Name")) middle_name = valueRow[midCol];
        if (extCol >= 0 && valueRow[extCol] && !labelMatch(valueRow[extCol], "Extension", "Ext")) name_extension = valueRow[extCol];
        break;
      }
    }
  }

  // Fallback: direct cells
  if (!last_name) {
    for (const addr of ["A10","B10","A11","B11"]) {
      const v = readCell(sheet, addr);
      if (v && !labelMatch(v, "Last Name", "Surname", "Name")) { last_name = v; break; }
    }
  }
  if (!first_name) {
    for (const addr of ["E10","F10","E11","F11"]) {
      const v = readCell(sheet, addr);
      if (v && !labelMatch(v, "First Name", "Given Name", "Pangalan")) { first_name = v; break; }
    }
  }
  if (!middle_name) {
    for (const addr of ["I10","J10","I11","J11"]) {
      const v = readCell(sheet, addr);
      if (v && !labelMatch(v, "Middle Name", "Gitnang")) { middle_name = v; break; }
    }
  }

  // ── Birthdate ─────────────────────────────────────────────────────────────
  let birthdate: string | null = null;
  const dobRow = rows.findIndex(
    (r, i) => i >= 9 && i <= 18 && r.some((c) => labelMatch(c, "Date of Birth", "Birthdate", "Petsa ng Kapanganakan"))
  );
  if (dobRow >= 0) {
    const headerCols = rows[dobRow];
    let dobCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Date of Birth", "Birthdate", "DOB", "Petsa")) dobCol = ci;
    });
    if (dobCol >= 0) {
      for (let delta = 1; delta <= 3; delta++) {
        const val = rows[dobRow + delta]?.[dobCol];
        if (val && !labelMatch(val, "Date of Birth", "Birthdate")) {
          const iso = toIsoDate(val);
          if (iso) { birthdate = iso; break; }
        }
      }
    }
  }
  if (!birthdate) {
    for (const addr of ["D12","E12","D13","E13"]) {
      const iso = toIsoDate(readCell(sheet, addr));
      if (iso) { birthdate = iso; break; }
    }
  }

  // ── Sex ───────────────────────────────────────────────────────────────────
  let sex: string | null = null;
  const sexRow = rows.findIndex(
    (r, i) => i >= 9 && i <= 18 && r.some((c) => labelMatch(c, "Sex", "Gender", "Kasarian"))
  );
  if (sexRow >= 0) {
    const headerCols = rows[sexRow];
    let sexCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Sex", "Gender", "Kasarian")) sexCol = ci;
    });
    if (sexCol >= 0) {
      for (let delta = 1; delta <= 3; delta++) {
        const val = rows[sexRow + delta]?.[sexCol];
        if (val && !labelMatch(val, "Sex", "Gender")) {
          const parsed = parseSex(val);
          if (parsed) { sex = parsed; break; }
        }
      }
    }
  }

  return {
    last_name: n(last_name),
    first_name: n(first_name),
    middle_name: n(middle_name),
    name_extension: n(name_extension),
    lrn,
    birthdate,
    sex,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑪ FULL FRONT / BACK SHEET PROCESSORS
// ─────────────────────────────────────────────────────────────────────────────

interface FrontSheetResult {
  learner_information: SF10LearnerInformation;
  jhs_eligibility: SF10JhsEligibility;
  /** G7 and G8 records */
  scholastic_records: SF10ScholasticRecordFull[];
  front_certification: SF10CertificationBlock;
  /** Raw rows for legacy wrapper */
  rows: string[][];
}

function processFrontSheet(sheet: XLSX.WorkSheet): FrontSheetResult {
  const rows = sheetToRows(sheet, 120);

  const learner_information = extractLearnerInformation(sheet, rows);
  const jhs_eligibility = extractJhsEligibility(rows, sheet);

  // Find grade 7 and 8 block header rows
  const gradeBlocks = findGradeBlockRows(rows, [7, 8]);
  const scholastic_records: SF10ScholasticRecordFull[] = [];

  for (const [gradeLevel, startRow] of Array.from(gradeBlocks.entries()).sort(([a], [b]) => a - b)) {
    const record = extractScholasticBlock({
      gradeLevel,
      recordIndex: gradeLevel === 7 ? 0 : 1,
      rows,
      sheet,
      blockStartRow: startRow,
    });
    scholastic_records.push(record);
  }

  // If no grade blocks found at all (single-grade files), try to extract Grade 7
  if (scholastic_records.length === 0) {
    const fallbackRow = rows.findIndex(
      (r) => r.some((c) => /q[1-4]|quarter|1st quarter/i.test(c))
    );
    if (fallbackRow >= 0) {
      scholastic_records.push(
        extractScholasticBlock({ gradeLevel: 7, recordIndex: 0, rows, sheet, blockStartRow: fallbackRow })
      );
    }
  }

  // Certification block — look for "CERTIFICATION" label in lower half of sheet
  const certRow = rows.findIndex(
    (r, i) => i >= 60 && r.some((c) => labelMatch(c, "Certification", "Certify"))
  );
  const front_certification = extractCertificationBlock(rows, certRow >= 0 ? certRow : 80);

  return { learner_information, jhs_eligibility, scholastic_records, front_certification, rows };
}

interface BackSheetResult {
  scholastic_records: SF10ScholasticRecordFull[];
  back_certification: SF10CertificationBlock;
}

function processBackSheet(sheet: XLSX.WorkSheet): BackSheetResult {
  const rows = sheetToRows(sheet, 120);

  const gradeBlocks = findGradeBlockRows(rows, [9, 10]);
  const scholastic_records: SF10ScholasticRecordFull[] = [];

  for (const [gradeLevel, startRow] of Array.from(gradeBlocks.entries()).sort(([a], [b]) => a - b)) {
    const record = extractScholasticBlock({
      gradeLevel,
      recordIndex: gradeLevel === 9 ? 2 : 3,
      rows,
      sheet,
      blockStartRow: startRow,
    });
    scholastic_records.push(record);
  }

  const certRow = rows.findIndex(
    (r, i) => i >= 60 && r.some((c) => labelMatch(c, "Certification", "Certify"))
  );
  const back_certification = extractCertificationBlock(rows, certRow >= 0 ? certRow : 80);

  return { scholastic_records, back_certification };
}

// ─────────────────────────────────────────────────────────────────────────────
// ⑫ MAIN PUBLIC ENTRY POINTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a DepEd SF10-JHS Excel file and return the full standardised JSON output.
 * Processes both the Front sheet (G7/G8 + eligibility) and the Back sheet (G9/G10).
 */
export function parseSF10Full(buffer: ArrayBuffer): SF10FullOutput {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  // ── Front sheet ───────────────────────────────────────────────────────────
  const frontName =
    workbook.SheetNames.find((n) => n.toLowerCase().trim() === "front") ??
    workbook.SheetNames.find((n) => n.toLowerCase().includes("front")) ??
    workbook.SheetNames[0];
  const frontSheet = workbook.Sheets[frontName];
  const front = processFrontSheet(frontSheet);

  // ── Back sheet ────────────────────────────────────────────────────────────
  const backName =
    workbook.SheetNames.find((n) => n.toLowerCase().trim() === "back") ??
    workbook.SheetNames.find((n) => n.toLowerCase().includes("back"));

  let back: BackSheetResult = {
    scholastic_records: [],
    back_certification: {
      student_name: null, lrn: null, admission_to_grade: null, school_name: null,
      school_id: null, last_sy_attended: null, date_certified: null,
      principal_name: null, has_seal: false,
    },
  };
  if (backName) {
    back = processBackSheet(workbook.Sheets[backName]);
  }

  // ── Combine all scholastic records ────────────────────────────────────────
  const allRecords: SF10ScholasticRecordFull[] = [
    ...front.scholastic_records,
    ...back.scholastic_records,
  ].sort((a, b) => (a.grade_level ?? 0) - (b.grade_level ?? 0));

  // Re-index
  allRecords.forEach((rec, i) => { rec.record_index = i; });

  return {
    form_type: "SF10-JHS",
    revision: "2017",
    learner_information: front.learner_information,
    jhs_eligibility: front.jhs_eligibility,
    scholastic_records: allRecords,
    certifications: {
      front_certification: front.front_certification,
      back_certification: back.back_certification,
    },
  };
}

/**
 * Backward-compatible wrapper used by EnrollmentUploadForm.tsx.
 * Returns the legacy SF10ParsedData shape, augmented with `sf10Full`.
 */
export function parseSF10Xlsx(buffer: ArrayBuffer): SF10ParsedData {
  const full = parseSF10Full(buffer);

  const li = full.learner_information;
  const g7record = full.scholastic_records.find((r) => r.grade_level === 7);

  // Assemble legacy scholasticRecord from G7 data
  let scholasticRecord: SF10ScholasticRecord | undefined;
  if (g7record) {
    const grades: SF10GradeRow[] = g7record.learning_areas.map((la) => ({
      subject: la.subject,
      q1: la.q1 ?? undefined,
      q2: la.q2 ?? undefined,
      q3: la.q3 ?? undefined,
      q4: la.q4 ?? undefined,
      finalGrade: la.final_rating ?? undefined,
    }));
    scholasticRecord = {
      gradeLevel: `Grade ${g7record.grade_level}`,
      section: g7record.section ?? undefined,
      schoolYear: g7record.school_year ?? undefined,
      adviserName: g7record.adviser_name ?? undefined,
      grades,
    };
  }

  const lastName = li.last_name ?? undefined;
  const firstName = li.first_name ?? undefined;
  const middleName = li.middle_name ?? undefined;
  const extension = li.name_extension ?? undefined;

  let fullName: string | undefined;
  if (lastName || firstName) {
    const parts = [
      lastName ? lastName.toUpperCase() : "",
      firstName ? `, ${firstName}` : "",
      middleName ? ` ${middleName}` : "",
      extension ? ` ${extension}` : "",
    ].join("").trim().replace(/^,\s*/, "");
    if (parts) fullName = parts;
  }

  const eligibility = full.jhs_eligibility;

  const filled = [
    li.lrn, fullName, li.birthdate, li.sex,
    eligibility.elementary_school_name,
    scholasticRecord,
  ].filter(Boolean);

  return {
    lrn: li.lrn ?? undefined,
    lastName,
    firstName,
    middleName,
    extension,
    fullName,
    birthdate: li.birthdate ?? undefined,
    sex: (li.sex as "Male" | "Female") ?? undefined,
    gradeLevel: g7record ? `Grade ${g7record.grade_level}` : undefined,
    section: g7record?.section ?? undefined,
    elementarySchool: eligibility.elementary_school_name ?? undefined,
    elementarySchoolId: eligibility.school_id ?? undefined,
    elementaryGenAve: eligibility.general_average ?? undefined,
    scholasticRecord,
    academicHistory: undefined,
    rawRows: undefined,
    filledCount: filled.length,
    sf10Full: full,
  };
}
