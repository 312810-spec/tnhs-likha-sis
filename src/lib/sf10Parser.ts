/**
 * sf10Parser.ts
 *
 * Client-side parser for DepEd SF10 (Learner's Permanent Academic Record)
 * Excel (.xlsx) files. Uses SheetJS (xlsx) to read the workbook.
 *
 * Strategy (two-layer):
 *   1. Coordinate-based extraction — targets the fixed cell layout of the
 *      standard DepEd SF10-JHS Excel template (e.g. ADOLFO.xlsx, "Front" sheet).
 *      LRN is in C7/M7, names in rows 9–10, Grade 7 table starts at row 20.
 *   2. Label-scan fallback — for non-standard templates, walks every row
 *      looking for known field label text and reads the adjacent value.
 *
 * Usage:
 *   const buf = await file.arrayBuffer();
 *   const data = parseSF10Xlsx(buf);
 */

import * as XLSX from "xlsx";

// ─────────────────────────────────────────────
// Exported Types
// ─────────────────────────────────────────────

export interface SF10GradeRow {
  subject: string;
  q1?: number;
  q2?: number;
  q3?: number;
  q4?: number;
  finalGrade?: number;
}

/** Structured Grade 7 scholastic record block extracted from the SF10 template */
export interface SF10ScholasticRecord {
  gradeLevel: string;
  section?: string;
  schoolYear?: string;
  adviserName?: string;
  /** Keyed by subject name, ordered as they appear on the form */
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
  /** Assembled: "LAST NAME, First Name Middle Name" */
  fullName?: string;
  /** ISO date string YYYY-MM-DD */
  birthdate?: string;
  sex?: "Male" | "Female";
  address?: string;
  gradeLevel?: string;
  section?: string;

  // Elementary school block
  elementarySchool?: string;
  elementarySchoolId?: string;
  elementaryGenAve?: number;

  // Grade 7 structured scholastic record
  scholasticRecord?: SF10ScholasticRecord;

  /** Legacy flat academic history — used when coordinate-layer is not applicable */
  academicHistory?: SF10AcademicRow[];

  /** Full "Front" sheet as 2-D string array — used for the preview table (max 80 rows) */
  rawRows?: string[][];
  /** Number of fields that were successfully extracted */
  filledCount: number;
}

// ─────────────────────────────────────────────
// JHS Subject List (canonical order on SF10)
// ─────────────────────────────────────────────

/** Standard JHS subjects on the SF10 Grade 7 record. MAPEH is broken out. */
const JHS_SUBJECTS_G7 = [
  "Filipino",
  "English",
  "Mathematics",
  "Science",
  "Araling Panlipunan",
  "Edukasyon sa Pagpapakatao",
  "Technology and Livelihood Education",
  "Music",
  "Arts",
  "Physical Education",
  "Health",
] as const;

/** Loose match map: what labels appear in the spreadsheet → canonical name */
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
  "technology and livelihood education": "Technology and Livelihood Education",
  tle: "Technology and Livelihood Education",
  music: "Music",
  arts: "Arts",
  "physical education": "Physical Education",
  pe: "Physical Education",
  health: "Health",
  mapeh: "MAPEH",
};

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

/**
 * Read a cell by Excel address (e.g. "C7") and return its string value.
 * Returns "" when the cell is empty or missing.
 */
function readCell(sheet: XLSX.WorkSheet, addr: string): string {
  const cell = sheet[addr];
  if (!cell) return "";
  // Use formatted text if available, otherwise raw value
  return cellStr(cell.w ?? cell.v);
}

/**
 * Read a specific row/col (0-indexed) from the 2-D rows array.
 * Returns "" when out of bounds.
 */
function rc(rows: string[][], row: number, col: number): string {
  return rows[row]?.[col] ?? "";
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

/** Parse a numeric grade from a raw cell string. Returns undefined when not a valid grade. */
function parseGrade(raw: string): number | undefined {
  if (!raw) return undefined;
  const n = parseFloat(raw.replace(/[^\d.]/g, ""));
  if (isNaN(n)) return undefined;
  // Sanity: SF10 quarterly grades are 60–100
  if (n >= 60 && n <= 100) return n;
  return undefined;
}

/** Normalise a subject string using the SUBJECT_ALIAS map. */
function canonicalSubject(raw: string): string {
  const key = raw.toLowerCase().trim().replace(/\s+/g, " ");
  return SUBJECT_ALIAS[key] ?? raw;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1: Coordinate-based extraction for DepEd SF10-JHS template
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Try to extract learner demographics and Grade 7 scholastic record using the
 * fixed-cell layout of the standard DepEd SF10-JHS Excel template.
 *
 * The "Front" sheet layout (1-indexed Excel rows, 0-indexed in sheet_to_json):
 *
 *   Row 6  (idx 5)  — "LEARNER REFERENCE NUMBER (LRN):" label
 *   Row 7  (idx 6)  — LRN value: C7 (col 2) or M7 (col 12)
 *   Row 9  (idx 8)  — LAST NAME | FIRST NAME | MIDDLE NAME | NAME EXT
 *   Row 10 (idx 9)  — values for name fields
 *   Row 11 (idx 10) — DATE OF BIRTH label (D11) | SEX label | ADDRESS label
 *   Row 12 (idx 11) — birthdate value | sex value | address value
 *   Row 13-14       — elementary school block
 *   Row 20+         — Grade 7 scholastic record table (subject rows)
 *
 * Column layout for names (approx, using 0-index):
 *   A(0) = Last Name, E(4) = First Name, I(8) = Middle Name, M(12) = Ext
 *
 * Column layout for Grade 7 quarterly grades:
 *   Subject in col 0-1, Q1 ≈ col 4, Q2 ≈ col 6, Q3 ≈ col 8, Q4 ≈ col 10,
 *   Final ≈ col 12
 */
interface CoordResult {
  lrn?: string;
  lastName?: string;
  firstName?: string;
  middleName?: string;
  extension?: string;
  birthdate?: string;
  sex?: "Male" | "Female";
  address?: string;
  elementarySchool?: string;
  elementarySchoolId?: string;
  elementaryGenAve?: number;
  scholasticRecord?: SF10ScholasticRecord;
  /** True when at least the LRN was found via coordinate extraction */
  coordinateHit: boolean;
}

function extractByCoordinates(
  sheet: XLSX.WorkSheet,
  rows: string[][]
): CoordResult {
  const result: CoordResult = { coordinateHit: false };

  // ── LRN ──────────────────────────────────────────────────────────────────
  // Try multiple candidate cells: C7, M7, also scan row 6 (idx 5) and 7 (idx 6)
  const lrnCandidates = [
    readCell(sheet, "C7"), readCell(sheet, "D7"),
    readCell(sheet, "M7"), readCell(sheet, "N7"),
    rc(rows, 6, 2), rc(rows, 6, 3), rc(rows, 6, 12), rc(rows, 6, 13),
  ];
  for (const candidate of lrnCandidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length === 12) {
      result.lrn = digits;
      result.coordinateHit = true;
      break;
    }
  }
  // Broader scan of rows 5-8 if still not found
  if (!result.lrn) {
    for (let r = 4; r <= 8; r++) {
      for (const cell of (rows[r] ?? [])) {
        const digits = cell.replace(/\D/g, "");
        if (digits.length === 12 && /^\d+$/.test(cell.trim())) {
          result.lrn = digits;
          result.coordinateHit = true;
          break;
        }
      }
      if (result.lrn) break;
    }
  }

  // ── Name fields ───────────────────────────────────────────────────────────
  // Row 9 (idx 8) contains the column headers LAST NAME, FIRST NAME, etc.
  // Row 10 (idx 9) or row 11 (idx 10) has the actual values.
  // We scan rows 8–12 looking for a non-label, non-empty name row.
  const nameHeaderRow = rows.findIndex(
    (r, i) =>
      i >= 7 && i <= 12 &&
      r.some((c) => labelMatch(c, "Last Name", "Surname", "Apelyido"))
  );

  if (nameHeaderRow >= 0) {
    // Find column indices of each name field from the header row
    const headerCols = rows[nameHeaderRow];
    let lastCol = -1, firstCol = -1, midCol = -1, extCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Last Name", "Surname")) lastCol = ci;
      else if (labelMatch(cell, "First Name", "Given Name", "Pangalan")) firstCol = ci;
      else if (labelMatch(cell, "Middle Name", "Gitnang")) midCol = ci;
      else if (labelMatch(cell, "Extension", "Ext", "Name Ext")) extCol = ci;
    });

    // Check the row(s) immediately below the header row for values
    for (let delta = 1; delta <= 3; delta++) {
      const valueRow = rows[nameHeaderRow + delta];
      if (!valueRow) continue;
      const candidateLast = lastCol >= 0 ? valueRow[lastCol] : "";
      const candidateFirst = firstCol >= 0 ? valueRow[firstCol] : "";
      // Only accept if at least one name field is a real word (not a label)
      if (
        (candidateLast && !labelMatch(candidateLast, "Last Name", "Surname")) ||
        (candidateFirst && !labelMatch(candidateFirst, "First Name", "Given Name"))
      ) {
        if (candidateLast && !labelMatch(candidateLast, "Last Name")) result.lastName = candidateLast;
        if (candidateFirst && !labelMatch(candidateFirst, "First Name", "Pangalan")) result.firstName = candidateFirst;
        if (midCol >= 0 && valueRow[midCol] && !labelMatch(valueRow[midCol], "Middle Name")) result.middleName = valueRow[midCol];
        if (extCol >= 0 && valueRow[extCol] && !labelMatch(valueRow[extCol], "Extension", "Ext")) result.extension = valueRow[extCol];
        break;
      }
    }
  }

  // Fallback: try specific Excel cell addresses for names
  if (!result.lastName) {
    const candidates = [
      readCell(sheet, "A10"), readCell(sheet, "B10"),
      readCell(sheet, "A11"), readCell(sheet, "B11"),
    ];
    for (const c of candidates) {
      if (c && !labelMatch(c, "Last Name", "Surname", "Name")) {
        result.lastName = c;
        break;
      }
    }
  }
  if (!result.firstName) {
    const candidates = [
      readCell(sheet, "E10"), readCell(sheet, "F10"),
      readCell(sheet, "E11"), readCell(sheet, "F11"),
    ];
    for (const c of candidates) {
      if (c && !labelMatch(c, "First Name", "Given Name", "Pangalan")) {
        result.firstName = c;
        break;
      }
    }
  }
  if (!result.middleName) {
    const candidates = [
      readCell(sheet, "I10"), readCell(sheet, "J10"),
      readCell(sheet, "I11"), readCell(sheet, "J11"),
    ];
    for (const c of candidates) {
      if (c && !labelMatch(c, "Middle Name", "Gitnang")) {
        result.middleName = c;
        break;
      }
    }
  }

  // ── Date of Birth ─────────────────────────────────────────────────────────
  const dobRow = rows.findIndex(
    (r, i) =>
      i >= 9 && i <= 16 &&
      r.some((c) => labelMatch(c, "Date of Birth", "Birthdate", "Petsa ng Kapanganakan"))
  );
  if (dobRow >= 0) {
    const headerCols = rows[dobRow];
    let dobCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Date of Birth", "Birthdate", "DOB", "Petsa")) dobCol = ci;
    });
    if (dobCol >= 0) {
      for (let delta = 1; delta <= 2; delta++) {
        const val = rows[dobRow + delta]?.[dobCol];
        if (val && !labelMatch(val, "Date of Birth", "Birthdate")) {
          result.birthdate = toIsoDate(val);
          if (result.birthdate) break;
        }
      }
    }
  }
  // Fallback: direct cell address
  if (!result.birthdate) {
    const dobCandidates = [
      readCell(sheet, "D12"), readCell(sheet, "E12"),
      readCell(sheet, "D13"), readCell(sheet, "E13"),
    ];
    for (const c of dobCandidates) {
      const iso = toIsoDate(c);
      if (iso) { result.birthdate = iso; break; }
    }
  }

  // ── Sex ───────────────────────────────────────────────────────────────────
  const sexRow = rows.findIndex(
    (r, i) => i >= 9 && i <= 16 && r.some((c) => labelMatch(c, "Sex", "Gender", "Kasarian"))
  );
  if (sexRow >= 0) {
    const headerCols = rows[sexRow];
    let sexCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Sex", "Gender", "Kasarian")) sexCol = ci;
    });
    if (sexCol >= 0) {
      for (let delta = 1; delta <= 2; delta++) {
        const val = rows[sexRow + delta]?.[sexCol];
        if (val && !labelMatch(val, "Sex", "Gender")) {
          const parsed = parseSex(val);
          if (parsed) { result.sex = parsed; break; }
        }
      }
    }
  }

  // ── Address ───────────────────────────────────────────────────────────────
  const addrRow = rows.findIndex(
    (r, i) =>
      i >= 9 && i <= 16 &&
      r.some((c) => labelMatch(c, "Address", "Tirahan", "Residential"))
  );
  if (addrRow >= 0) {
    const headerCols = rows[addrRow];
    let addrCol = -1;
    headerCols.forEach((cell, ci) => {
      if (labelMatch(cell, "Address", "Tirahan", "Residential")) addrCol = ci;
    });
    if (addrCol >= 0) {
      for (let delta = 1; delta <= 2; delta++) {
        const val = rows[addrRow + delta]?.[addrCol];
        if (val && !labelMatch(val, "Address", "Tirahan")) {
          result.address = val;
          break;
        }
      }
    }
  }

  // ── Elementary School block ───────────────────────────────────────────────
  // Label "ELEMENTARY" or "Primary" appears in a row, followed by name/school ID/gen ave
  const elemRowIdx = rows.findIndex(
    (r, i) =>
      i >= 10 && i <= 30 &&
      r.some((c) => labelMatch(c, "Elementary", "Elementarya", "Primary School"))
  );
  if (elemRowIdx >= 0) {
    const elemHeaderRow = rows[elemRowIdx];
    let nameCol = -1, idCol = -1, aveCol = -1;
    elemHeaderRow.forEach((cell, ci) => {
      if (labelMatch(cell, "School", "Name of School") && nameCol < 0) nameCol = ci;
      if (labelMatch(cell, "School ID", "SchoolID")) idCol = ci;
      if (
        labelMatch(cell, "General Average", "Gen Ave", "Final Grade", "Average") &&
        !labelMatch(cell, "School")
      ) aveCol = ci;
    });

    // Row below the header label row should have values
    for (let delta = 1; delta <= 3; delta++) {
      const valueRow = rows[elemRowIdx + delta];
      if (!valueRow) continue;

      const nameVal = nameCol >= 0 ? valueRow[nameCol] : "";
      const idVal = idCol >= 0 ? valueRow[idCol] : "";
      const aveVal = aveCol >= 0 ? valueRow[aveCol] : "";

      if (nameVal && !labelMatch(nameVal, "Name of School", "Elementary")) {
        result.elementarySchool = nameVal;
      }
      if (idVal && /\d/.test(idVal)) result.elementarySchoolId = idVal;
      if (aveVal) {
        const ave = parseFloat(aveVal.replace(/[^\d.]/g, ""));
        if (!isNaN(ave) && ave >= 60 && ave <= 100) result.elementaryGenAve = ave;
      }
      if (result.elementarySchool) break;
    }

    // Alternative: value is right next to the label on the SAME row
    if (!result.elementarySchool) {
      for (const row of rows.slice(elemRowIdx, elemRowIdx + 5)) {
        for (let ci = 0; ci < row.length; ci++) {
          if (labelMatch(row[ci], "Elementary", "Elementarya")) {
            // Walk right for a non-label value
            for (let k = ci + 1; k < Math.min(row.length, ci + 6); k++) {
              if (row[k] && !labelMatch(row[k], "Elementary")) {
                result.elementarySchool = row[k];
                break;
              }
            }
          }
          if (labelMatch(row[ci], "School ID") || labelMatch(row[ci], "SchoolID")) {
            for (let k = ci + 1; k < Math.min(row.length, ci + 4); k++) {
              if (row[k] && /\d/.test(row[k])) {
                result.elementarySchoolId = row[k];
                break;
              }
            }
          }
          if (labelMatch(row[ci], "General Average", "Gen Ave")) {
            for (let k = ci + 1; k < Math.min(row.length, ci + 4); k++) {
              if (row[k]) {
                const ave = parseFloat(row[k].replace(/[^\d.]/g, ""));
                if (!isNaN(ave) && ave >= 60 && ave <= 100) {
                  result.elementaryGenAve = ave;
                  break;
                }
              }
            }
          }
        }
        if (result.elementarySchool) break;
      }
    }
  }

  // ── Grade 7 Scholastic Record ─────────────────────────────────────────────
  // Find the header row for "Grade 7" scholastic block.
  // Typically looks for a row containing "GRADE 7" or "GRADE VII" with
  // "Q1", "1st Quarter" etc. nearby.
  const g7HeaderIdx = rows.findIndex(
    (r, i) =>
      i >= 12 && i <= 60 &&
      r.some((c) => {
        const s = c.toUpperCase();
        return (
          (s.includes("GRADE 7") || s.includes("GRADE VII") || s.includes("G7")) &&
          !s.includes("GRADE 8") && !s.includes("GRADE 9")
        );
      })
  );

  if (g7HeaderIdx >= 0) {
    // Extract section, SY, adviser from this block's header rows
    let section: string | undefined;
    let schoolYear: string | undefined;
    let adviserName: string | undefined;

    // Scan a few rows around the grade-7 block header for section/SY/adviser
    for (let r = Math.max(0, g7HeaderIdx - 2); r <= Math.min(rows.length - 1, g7HeaderIdx + 5); r++) {
      const row = rows[r];
      for (let ci = 0; ci < row.length; ci++) {
        if (labelMatch(row[ci], "Section", "Seksiyon")) {
          for (let k = ci + 1; k < Math.min(row.length, ci + 4); k++) {
            if (row[k] && !labelMatch(row[k], "Section")) { section = row[k]; break; }
          }
        }
        if (labelMatch(row[ci], "School Year", "SY")) {
          for (let k = ci + 1; k < Math.min(row.length, ci + 4); k++) {
            if (row[k] && !labelMatch(row[k], "School Year", "SY")) { schoolYear = row[k]; break; }
          }
        }
        if (labelMatch(row[ci], "Adviser", "Class Adviser")) {
          for (let k = ci + 1; k < Math.min(row.length, ci + 4); k++) {
            if (row[k] && !labelMatch(row[k], "Adviser")) { adviserName = row[k]; break; }
          }
        }
      }
    }

    // Find the quarter column positions from a header row that has Q1/Q2/Q3/Q4 labels
    let q1Col = -1, q2Col = -1, q3Col = -1, q4Col = -1, finalCol = -1;
    for (let r = g7HeaderIdx; r <= Math.min(rows.length - 1, g7HeaderIdx + 6); r++) {
      const row = rows[r];
      const qLabels = row.filter((c) => /q[1-4]|quarter|1st|2nd|3rd|4th/i.test(c));
      if (qLabels.length >= 2) {
        row.forEach((cell, ci) => {
          const s = cell.toLowerCase();
          if ((s.includes("q1") || s.includes("1st") || s === "1") && q1Col < 0) q1Col = ci;
          else if ((s.includes("q2") || s.includes("2nd") || s === "2") && q2Col < 0) q2Col = ci;
          else if ((s.includes("q3") || s.includes("3rd") || s === "3") && q3Col < 0) q3Col = ci;
          else if ((s.includes("q4") || s.includes("4th") || s === "4") && q4Col < 0) q4Col = ci;
          if (labelMatch(cell, "Final", "Average", "Gen Ave", "Final Rating")) finalCol = ci;
        });
        if (q1Col >= 0) break; // found the Q column header row
      }
    }

    // If no explicit Q column found, guess based on common template layout
    // (subject in cols 0-2, Q1 at col 4, Q2 at col 6, Q3 at col 8, Q4 at col 10, Final at col 12)
    if (q1Col < 0) { q1Col = 4; q2Col = 6; q3Col = 8; q4Col = 10; finalCol = 12; }

    // Scan rows below the header for subject rows
    const gradeRows: SF10GradeRow[] = [];
    for (let r = g7HeaderIdx + 1; r <= Math.min(rows.length - 1, g7HeaderIdx + 25); r++) {
      const row = rows[r];
      if (!row || row.every((c) => !c)) continue;

      // Subject candidate: first non-empty cell that looks like a subject name
      const subjectRaw = row.find((c) => c && !/^\d+$/.test(c) && c.length > 2 && !labelMatch(c, "Q1", "Q2", "Q3", "Q4", "Quarter", "Subject", "Grade", "Final"));
      if (!subjectRaw) continue;

      const canonical = canonicalSubject(subjectRaw);
      // Accept rows whose subject matches a known JHS subject (or is a close alias)
      const isKnownSubject = JHS_SUBJECTS_G7.some((s) =>
        subjectRaw.toLowerCase().includes(s.toLowerCase().replace("and", "").trim().split(" ")[0])
      ) || Object.keys(SUBJECT_ALIAS).some((k) => subjectRaw.toLowerCase().replace(/\s+/g, " ").includes(k));

      if (!isKnownSubject && !subjectRaw.match(/^(Fil|Eng|Math|Sci|AP|EsP|TLE|Music|Arts|PE|Health|MAPEH|Araling|Eduk|Teknolohiya)/i)) {
        continue;
      }

      const q1 = q1Col >= 0 ? parseGrade(row[q1Col] ?? "") : undefined;
      const q2 = q2Col >= 0 ? parseGrade(row[q2Col] ?? "") : undefined;
      const q3 = q3Col >= 0 ? parseGrade(row[q3Col] ?? "") : undefined;
      const q4 = q4Col >= 0 ? parseGrade(row[q4Col] ?? "") : undefined;
      const finalGrade = finalCol >= 0 ? parseGrade(row[finalCol] ?? "") : undefined;

      // At least one grade must be present
      if (q1 == null && q2 == null && q3 == null && q4 == null && finalGrade == null) continue;

      // Avoid duplicate subjects
      if (!gradeRows.some((g) => g.subject === canonical)) {
        gradeRows.push({ subject: canonical, q1, q2, q3, q4, finalGrade });
      }
    }

    if (gradeRows.length > 0) {
      result.scholasticRecord = {
        gradeLevel: "Grade 7",
        section,
        schoolYear,
        adviserName,
        grades: gradeRows,
      };
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2: Label-scan fallback for non-standard templates
// ─────────────────────────────────────────────────────────────────────────────

function extractByLabelScan(rows: string[][]): Partial<SF10ParsedData> {
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

  const lastName = findValueAfterLabel(rows, "Last Name", "LastName", "Surname", "Apelyido");
  const firstName = findValueAfterLabel(rows, "First Name", "FirstName", "Given Name", "Pangalan");
  const middleName = findValueAfterLabel(rows, "Middle Name", "MiddleName", "Gitnang Pangalan");
  const extension = findValueAfterLabel(rows, "Name Extension", "Extension", "Ext", "Jr", "Sr");

  const rawBirth = findValueAfterLabel(rows, "Date of Birth", "Birthdate", "Birth Date", "DOB", "Petsa ng Kapanganakan");
  const birthdate = rawBirth ? toIsoDate(rawBirth) : undefined;

  const rawSex = findValueAfterLabel(rows, "Sex", "Gender", "Kasarian");
  const sex = rawSex ? parseSex(rawSex) : undefined;

  const address = findValueAfterLabel(rows, "Address", "Home Address", "Residential Address", "Tirahan");

  const rawGrade = findValueAfterLabel(rows, "Grade", "Grade Level", "Baitang");
  const gradeLevel = rawGrade ? parseGradeLevel(rawGrade) : undefined;

  const section = findValueAfterLabel(rows, "Section", "Seksiyon", "Class Section");

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

  return {
    lrn,
    lastName,
    firstName,
    middleName,
    extension,
    birthdate,
    sex,
    address,
    gradeLevel,
    section,
    elementarySchool,
    academicHistory: academicHistory.length > 0 ? academicHistory : undefined,
  };
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

  // Prefer the "Front" sheet (standard DepEd SF10 template name).
  // Fall back to the first sheet if "Front" is not present.
  const frontSheetName =
    workbook.SheetNames.find((n) => n.toLowerCase().trim() === "front") ??
    workbook.SheetNames.find((n) => n.toLowerCase().includes("front")) ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[frontSheetName];

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

  // ── Layer 1: Coordinate-based extraction ──────────────────────────────────
  const coord = extractByCoordinates(sheet, rows);

  // ── Layer 2: Label-scan fallback (fills gaps from layer 1) ───────────────
  const scan = extractByLabelScan(rows);

  // ── Merge: coordinate layer wins; scan fills in anything still missing ────
  const lrn = coord.lrn ?? scan.lrn;
  const lastName = coord.lastName ?? scan.lastName;
  const firstName = coord.firstName ?? scan.firstName;
  const middleName = coord.middleName ?? scan.middleName;
  const extension = coord.extension ?? scan.extension;
  const birthdate = coord.birthdate ?? scan.birthdate;
  const sex = coord.sex ?? scan.sex;
  const address = coord.address ?? scan.address;
  const gradeLevel = scan.gradeLevel ?? (coord.scholasticRecord ? coord.scholasticRecord.gradeLevel : undefined);
  const section = scan.section ?? coord.scholasticRecord?.section;
  const elementarySchool = coord.elementarySchool ?? scan.elementarySchool;
  const elementarySchoolId = coord.elementarySchoolId;
  const elementaryGenAve = coord.elementaryGenAve;
  const scholasticRecord = coord.scholasticRecord;
  const academicHistory = scan.academicHistory;

  // ── Assembled full name ───────────────────────────────────────────────────
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

  // ── Count filled fields ───────────────────────────────────────────────────
  const filled = [
    lrn, fullName, birthdate, sex, address, gradeLevel, section,
    elementarySchool, scholasticRecord,
  ].filter(Boolean);

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
    elementarySchoolId,
    elementaryGenAve,
    scholasticRecord,
    academicHistory: academicHistory,
    rawRows: rows,
    filledCount: filled.length,
  };
}
