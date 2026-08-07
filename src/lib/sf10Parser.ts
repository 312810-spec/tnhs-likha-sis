/**
 * sf10Parser.ts
 *
 * Client-side parser for DepEd SF10 (Learner's Permanent Academic Record)
 * Excel (.xlsx) files. Uses SheetJS (xlsx) to read the workbook and a
 * label-scan strategy to locate field values without relying on hard-coded
 * cell addresses — making it resilient to minor template layout shifts
 * across school districts.
 *
 * Usage:
 *   const buf = await file.arrayBuffer();
 *   const data = parseSF10Xlsx(buf);
 */

import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// Exported Types
// ─────────────────────────────────────────────

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
  /** Assembled: "LAST NAME, First Name Middle Name" */
  fullName?: string;
  /** ISO date string YYYY-MM-DD */
  birthdate?: string;
  sex?: "Male" | "Female";
  address?: string;
  gradeLevel?: string;
  section?: string;
  elementarySchool?: string;
  academicHistory?: SF10AcademicRow[];
  /** Full sheet as 2-D string array — used for the preview table (max 80 rows) */
  rawRows?: string[][];
  /** Number of fields that were successfully extracted */
  filledCount: number;
}

// ─────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────

/** Normalise a raw cell value to a trimmed string. */
function cellStr(val: unknown): string {
  if (val == null) return "";
  return String(val).trim();
}

/** Case-insensitive, stripped-whitespace label match. */
function labelMatch(cell: string, ...candidates: string[]): boolean {
  const norm = cell.toLowerCase().replace(/[^a-z0-9]/g, "");
  return candidates.some((c) => norm.includes(c.toLowerCase().replace(/[^a-z0-9]/g, "")));
}

/**
 * Given a 2-D string array, find the value in the cell immediately to the
 * right of the first row whose first non-empty cell matches `candidates`.
 */
function findValueAfterLabel(
  rows: string[][],
  ...candidates: string[]
): string | undefined {
  for (const row of rows) {
    for (let c = 0; c < row.length; c++) {
      if (row[c] && labelMatch(row[c], ...candidates)) {
        // Walk right for the first non-empty value
        for (let k = c + 1; k < Math.min(row.length, c + 6); k++) {
          if (row[k]) return row[k];
        }
        // Also check next row, same column
        const rowIdx = rows.indexOf(row);
        if (rowIdx + 1 < rows.length && rows[rowIdx + 1][c]) {
          return rows[rowIdx + 1][c];
        }
      }
    }
  }
  return undefined;
}

/** Parse a date string into ISO YYYY-MM-DD. Handles several common formats. */
function toIsoDate(raw: string): string | undefined {
  if (!raw) return undefined;

  // Already ISO
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  // Excel serial number (number of days since 1899-12-30)
  const serial = Number(raw);
  if (!isNaN(serial) && serial > 1 && serial < 100000) {
    const d = XLSX.SSF.parse_date_code(serial);
    if (d) {
      const mm = String(d.m).padStart(2, "0");
      const dd = String(d.d).padStart(2, "0");
      return `${d.y}-${mm}-${dd}`;
    }
  }

  // Try JS Date parse (handles "January 1, 2010", "01/01/2010", etc.)
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return undefined;
}

/** Map common sex/gender strings to "Male" | "Female". */
function parseSex(raw: string): "Male" | "Female" | undefined {
  const n = raw.toLowerCase();
  if (n.startsWith("m") || n === "male" || n === "lalaki") return "Male";
  if (n.startsWith("f") || n === "female" || n === "babae") return "Female";
  return undefined;
}

/**
 * Attempt to recognise "Grade N" from a raw string. Accepts:
 *   "7", "Grade 7", "Gr. 7", "G7", "Grade VII", "11", "12"
 */
function parseGradeLevel(raw: string): string | undefined {
  const roman: Record<string, string> = {
    VII: "7", VIII: "8", IX: "9", X: "10", XI: "11", XII: "12",
  };
  const s = raw.trim().toUpperCase();
  // Roman numeral match
  for (const [r, n] of Object.entries(roman)) {
    if (s.includes(r)) return `Grade ${n}`;
  }
  // Numeric match
  const numMatch = s.match(/(\d{1,2})/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 7 && n <= 12) return `Grade ${n}`;
  }
  return undefined;
}

// ─────────────────────────────────────────────
// Main parser
// ─────────────────────────────────────────────

/**
 * Parse a DepEd SF10 Excel file (ArrayBuffer) and return extracted learner data.
 * All fields are optional — any field that cannot be reliably located is omitted.
 */
export function parseSF10Xlsx(buffer: ArrayBuffer): SF10ParsedData {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: false });

  // Work with the first sheet (SF10 data is always on sheet 1)
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to 2-D array of strings for label scanning
  const raw2d: unknown[][] = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: "",
    blankrows: true,
  });

  // Limit preview to first 80 rows for performance
  const rows: string[][] = raw2d.slice(0, 80).map((row) =>
    (row as unknown[]).map(cellStr)
  );

  // ── Field extraction ──────────────────────────────────────────────────────

  // LRN (12-digit DepEd reference)
  let lrn: string | undefined;
  const rawLrn = findValueAfterLabel(rows, "LRN", "Learner Reference", "LearnerRef");
  if (rawLrn) {
    const digits = rawLrn.replace(/\D/g, "");
    if (digits.length === 12) lrn = digits;
  }
  // Fallback: scan all cells for a standalone 12-digit number
  if (!lrn) {
    for (const row of rows) {
      for (const cell of row) {
        const digits = cell.replace(/\D/g, "");
        if (digits.length === 12 && /^\d+$/.test(cell.trim())) {
          lrn = digits;
          break;
        }
      }
      if (lrn) break;
    }
  }

  // Name components
  const lastName = findValueAfterLabel(rows, "Last Name", "LastName", "Surname", "Apelyido");
  const firstName = findValueAfterLabel(rows, "First Name", "FirstName", "Given Name", "Pangalan");
  const middleName = findValueAfterLabel(rows, "Middle Name", "MiddleName", "Gitnang Pangalan");
  const extension = findValueAfterLabel(rows, "Name Extension", "Extension", "Ext", "Jr", "Sr");

  // Assembled full name
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

  // Birthdate
  const rawBirth = findValueAfterLabel(
    rows,
    "Date of Birth", "Birthdate", "Birth Date", "DOB", "Petsa ng Kapanganakan"
  );
  const birthdate = rawBirth ? toIsoDate(rawBirth) : undefined;

  // Sex
  const rawSex = findValueAfterLabel(rows, "Sex", "Gender", "Kasarian");
  const sex = rawSex ? parseSex(rawSex) : undefined;

  // Address
  const address = findValueAfterLabel(
    rows,
    "Address", "Home Address", "Residential Address", "Tirahan"
  );

  // Grade Level
  const rawGrade = findValueAfterLabel(
    rows,
    "Grade", "Grade Level", "Baitang"
  );
  const gradeLevel = rawGrade ? parseGradeLevel(rawGrade) : undefined;

  // Section
  const section = findValueAfterLabel(rows, "Section", "Seksiyon", "Class Section");

  // Elementary school
  const elementarySchool = findValueAfterLabel(
    rows,
    "Elementary", "Elem School", "Paaralang Elementarya", "Primary School"
  );

  // Academic history — rows that look like subject + numeric grades
  const academicHistory: SF10AcademicRow[] = [];
  const gradeNumRe = /^(\d{2,3}(\.\d+)?)$/;
  for (const row of rows) {
    const nonEmpty = row.filter(Boolean);
    if (nonEmpty.length < 2) continue;
    // Subject column is a text cell followed by 1–4 numeric grade cells
    const subjectCandidate = nonEmpty[0];
    const numericCells = nonEmpty.slice(1).filter((c) => gradeNumRe.test(c));
    if (
      numericCells.length >= 1 &&
      numericCells.length <= 4 &&
      !/^\d+$/.test(subjectCandidate) &&
      subjectCandidate.length > 2
    ) {
      const [q1, q2, q3, q4] = numericCells.map(Number);
      academicHistory.push({ subject: subjectCandidate, q1, q2, q3, q4 });
    }
  }

  // ── Count filled fields ───────────────────────────────────────────────────
  const filled = [lrn, fullName, birthdate, sex, address, gradeLevel, section].filter(Boolean);

  return {
    lrn,
    lastName,
    firstName,
    middleName,
    extension,
    fullName,
    birthdate,
    sex,
    address,
    gradeLevel,
    section,
    elementarySchool,
    academicHistory: academicHistory.length > 0 ? academicHistory : undefined,
    rawRows: rows,
    filledCount: filled.length,
  };
}
