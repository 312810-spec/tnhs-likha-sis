/**
 * TNHS LIKHA-SIS — Bulk Learner Import helpers.
 *
 * Pure, client-side CSV parsing, row mapping and validation for onboarding
 * already-enrolled learners in one pass. No database calls live here, so the
 * logic is easy to unit test and reuse from the ICT bulk import screen.
 *
 * Expected CSV columns (header row, order-insensitive):
 *   lrn, full_name, birthdate, sex, address, grade_level, section_name
 */

export interface CsvStudentRow {
  /** 1-based line number in the original file (for the skipped CSV). */
  sourceLine: number;
  lrn: string;
  full_name: string;
  birthdate: string;
  sex: string;
  address: string;
  grade_level: string;
  section_name: string;
}

export interface SectionLookupEntry {
  id: string;
  grade_level: string;
  section_name: string;
}

export type SectionLookup = Record<string, SectionLookupEntry>;

/** A parsed row enriched with its validation result. */
export interface PreviewRow extends CsvStudentRow {
  reasons: string[];
  sectionId: string | null;
}

/** The data-bearing columns of a CSV row (excludes the numeric sourceLine). */
type DataColumn =
  | "lrn"
  | "full_name"
  | "birthdate"
  | "sex"
  | "address"
  | "grade_level"
  | "section_name";

const EXPECTED_COLUMNS: DataColumn[] = [
  "lrn",
  "full_name",
  "birthdate",
  "sex",
  "address",
  "grade_level",
  "section_name",
];

/**
 * Parse raw CSV text into a 2D array of fields, handling quoted fields that
 * contain commas, double-quote escapes and CRLF / LF line endings.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^\uFEFF/, ""); // strip BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch === "\r") {
      // CR is consumed as part of the following LF; ignore standalone CR.
    } else {
      field += ch;
    }
  }

  // Flush the trailing field/row.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop fully-empty trailing rows.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

const normalizeCell = (value: string): string => (value ?? "").trim();

/**
 * Map parsed rows (raw string[][] from parseCsv) onto structured student rows.
 * The first non-empty row is treated as the header; columns are matched by
 * header name, falling back to the expected positional order when no header is
 * recognised. Rows that are entirely empty are skipped.
 */
export function csvToStudentRows(records: string[][]): CsvStudentRow[] {
  if (!records.length) return [];

  let start = 0;
  // Find the first non-empty row to use as the header.
  for (let i = 0; i < records.length; i++) {
    if (records[i].some((cell) => cell.trim() !== "")) {
      start = i;
      break;
    }
  }

  const headerRow = records[start].map(normalizeCell);
  const headerLower = headerRow.map((h) => h.toLowerCase());

  // Map each expected column to its index: by header name first, then position.
  const indexFor: (key: DataColumn) => number = (key) => {
    const headerIdx = headerLower.indexOf(key);
    if (headerIdx !== -1) return headerIdx;
    return EXPECTED_COLUMNS.indexOf(key); // fall back to positional order
  };

  const rows: CsvStudentRow[] = [];
  for (let i = start + 1; i < records.length; i++) {
    const cells = records[i];
    const row: CsvStudentRow = {
      sourceLine: i + 1,
      lrn: normalizeCell(cells[indexFor("lrn")] ?? ""),
      full_name: normalizeCell(cells[indexFor("full_name")] ?? ""),
      birthdate: normalizeCell(cells[indexFor("birthdate")] ?? ""),
      sex: normalizeCell(cells[indexFor("sex")] ?? ""),
      address: normalizeCell(cells[indexFor("address")] ?? ""),
      grade_level: normalizeCell(cells[indexFor("grade_level")] ?? ""),
      section_name: normalizeCell(cells[indexFor("section_name")] ?? ""),
    };
    if (Object.values(row).some((v) => v !== "")) {
      rows.push(row);
    }
  }
  return rows;
}

export const normalizeKey = (value: string): string =>
  (value ?? "").trim().toLowerCase();

/**
 * Validate each row and enrich it with a human-readable reason list and the
 * resolved section id. A row is flagged (reasons non-empty) when:
 *  - the LRN is already present in the registry (existingLrns) or repeats
 *    earlier in this same file (seenLrns), or
 *  - the section_name does not match any existing section, or
 *  - a required field (lrn / full_name) is empty.
 */
export function validateRows(
  rows: CsvStudentRow[],
  existingLrns: Set<string>,
  sectionLookup: SectionLookup,
  seenLrns = new Set<string>()
): PreviewRow[] {
  return rows.map((r) => {
    const reasons: string[] = [];
    const lrnKey = normalizeKey(r.lrn);

    if (!r.lrn) {
      reasons.push("Missing LRN");
    } else if (existingLrns.has(lrnKey) || seenLrns.has(lrnKey)) {
      reasons.push(`Duplicate LRN "${r.lrn}" already in registry`);
    }

    if (lrnKey) seenLrns.add(lrnKey);

    if (!r.full_name) reasons.push("Missing full name");

    const section = sectionLookup[normalizeKey(r.section_name)];
    if (!section) {
      reasons.push(`Section "${r.section_name || "(blank)"}" not found in registry`);
    }

    return {
      ...r,
      reasons,
      sectionId: section ? section.id : null,
    };
  });
}

/**
 * Build a CSV (as a string) of the rows that were skipped, appending a final
 * "reason" column next to the original data so staff can correct and re-import.
 */
export function buildSkippedCsv(skipped: PreviewRow[]): string {
  const header = [...EXPECTED_COLUMNS, "reason"];
  const lines: string[] = [header.join(",")];

  const quote = (value: string): string => {
    const v = (value ?? "").toString();
    if (/[",\n]/.test(v)) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  for (const row of skipped) {
    const reason = row.reasons.join("; ");
    lines.push(
      [...EXPECTED_COLUMNS.map((key) => quote(row[key])), quote(reason)].join(",")
    );
  }
  return lines.join("\n");
}

