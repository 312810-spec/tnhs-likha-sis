"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db";
import { Section } from "@/types/database.types";
import {
  buildSkippedCsv,
  csvToStudentRows,
  normalizeKey,
  parseCsv,
  PreviewRow,
  validateRows,
} from "@/lib/bulkImport";

// Fallback sections used for an offline / initial-setup preview. These mirror
// the enrollment screen so section validation stays consistent.
const DEFAULT_SECTIONS: Partial<Section>[] = [
  { id: "sec-7-sampaguita", grade_level: "Grade 7", section_name: "Sampaguita", school_year: "2026-2027" },
  { id: "sec-7-narra", grade_level: "Grade 7", section_name: "Narra", school_year: "2026-2027" },
  { id: "sec-8-rizal", grade_level: "Grade 8", section_name: "Rizal", school_year: "2026-2027" },
  { id: "sec-9-bonifacio", grade_level: "Grade 9", section_name: "Bonifacio", school_year: "2026-2027" },
  { id: "sec-10-luna", grade_level: "Grade 10", section_name: "Luna", school_year: "2026-2027" },
  { id: "sec-11-stem-a", grade_level: "Grade 11", section_name: "STEM A", school_year: "2026-2027" },
  { id: "sec-12-humss-a", grade_level: "Grade 12", section_name: "HUMSS A", school_year: "2026-2027" },
];

interface ImportSummary {
  inserted: number;
  skipped: number;
  fileName: string;
  skippedCsv: string;
}

export function BulkStudentImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sections, setSections] = useState<Partial<Section>[]>(DEFAULT_SECTIONS);
  const [existingLrns, setExistingLrns] = useState<Set<string>>(new Set());
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dataReady, setDataReady] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  // Build a case-insensitive section lookup from the loaded sections and fetch
  // the LRNs already present in the registry (for duplicate detection).
  const sectionLookup = useMemo(() => {
    const map: Record<string, { id: string; grade_level: string; section_name: string }> = {};
    for (const s of sections) {
      if (s.id && s.section_name) {
        map[normalizeKey(s.section_name)] = {
          id: s.id,
          grade_level: s.grade_level ?? "",
          section_name: s.section_name,
        };
      }
    }
    return map;
  }, [sections]);

  // Load the section registry and the set of LRNs already in the student
  // registry so the preview can flag duplicate LRNs and unknown sections.
  const refreshRegistry = useCallback(async () => {
    try {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (q: string) => Promise<{ data: Section[] | null; error: unknown }>;
        };
      };
      const { data } = await client.from("sections").select("*");
      if (data && data.length > 0) setSections(data);
    } catch (err) {
      console.warn("Unable to load sections from the registry; using fallback list.", err);
    }

    try {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (q: string) => Promise<{ data: { lrn: string }[] | null; error: unknown }>;
        };
      };
      const { data } = await client.from("students").select("lrn");
      const lrns = new Set<string>();
      (data ?? []).forEach((s) => lrns.add(normalizeKey(s.lrn)));
      setExistingLrns(lrns);
    } catch (err) {
      console.warn("Unable to load existing learner LRNs; duplicate detection disabled.", err);
    }
    setDataReady(true);
  }, []);

  useEffect(() => {
    // Fetch-on-mount pattern shared across the app; loads sections + existing LRNs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshRegistry();
  }, [refreshRegistry]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setErrorMessage(null);
      setSummary(null);
      setFileName(file.name);
      setIsParsing(true);
      try {
        const text = await file.text();
        const records = parseCsv(text);
        const studentRows = csvToStudentRows(records);
        const preview = validateRows(studentRows, existingLrns, sectionLookup);
        setRows(preview);
      } catch (err) {
        setRows([]);
        setErrorMessage(
          err instanceof Error
            ? `Failed to parse CSV: ${err.message}`
            : "Failed to parse the CSV file. Ensure it is a valid .csv document."
        );
      } finally {
        setIsParsing(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [existingLrns, sectionLookup]
  );

  const validCount = rows.filter((r) => r.reasons.length === 0).length;
  const skippedCount = rows.length - validCount;

  // Confirm: insert every valid row into `students` in one batch, skip the
  // flagged rows, leave sf10_file_url empty, and expose a skipped CSV.
  const confirmImport = useCallback(async () => {
    const validRows = rows.filter((r) => r.reasons.length === 0);
    const skippedRows = rows.filter((r) => r.reasons.length > 0);
    if (validRows.length === 0) {
      setErrorMessage("No valid rows to import. All rows are flagged.");
      return;
    }

    setIsImporting(true);
    setErrorMessage(null);
    try {
      const payload = validRows.map((r) => ({
        lrn: r.lrn,
        full_name: r.full_name,
        birthdate: r.birthdate || null,
        sex: r.sex || null,
        address: r.address || null,
        grade_level: r.grade_level,
        section_id: r.sectionId,
        enrollment_status: "enrolled" as const,
        sf10_file_url: null, // bulk imports have no scanned SF10 attached
      }));

      const client = supabase as unknown as {
        from: (t: string) => {
          insert: (rows: (typeof payload)[number][]) => { select: () => Promise<{ data: { id: string; lrn: string }[] | null; error: unknown }> };
        };
      };
      const { data, error } = await client.from("students").insert(payload).select();

      if (error) throw error;

      // Best-effort mirror into the local Dexie store so offline grading and
      // form previews pick up the newly enrolled learners immediately.
      const inserted = data ?? [];
      try {
        const localRows = inserted.map((s) => {
          const row = validRows.find((r) => r.lrn === s.lrn);
          const section = sectionLookup[normalizeKey(row?.section_name ?? "")];
          return {
            id: s.id,
            lrn: s.lrn,
            full_name: row?.full_name ?? "",
            section_id: section?.id ?? "",
            grade_level: row?.grade_level ?? "",
            sex: row?.sex ?? null,
            birthdate: row?.birthdate ?? null,
            address: row?.address ?? null,
          };
        });
        await db.students.bulkPut(localRows);
      } catch (localErr) {
        console.warn("Best-effort local Dexie mirror failed for bulk import.", localErr);
      }

      setSummary({
        inserted: inserted.length,
        skipped: skippedRows.length,
        fileName,
        skippedCsv: buildSkippedCsv(skippedRows),
      });
      setRows([]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to insert students into the registry."
      );
    } finally {
      setIsImporting(false);
    }
  }, [rows, sectionLookup, fileName]);

  const downloadSkipped = useCallback(() => {
    if (!summary) return;
    const blob = new Blob([summary.skippedCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `skipped-learners-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [summary]);


  const reset = () => {
    setRows([]);
    setSummary(null);
    setErrorMessage(null);
    setFileName("");
    refreshRegistry();
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Bulk Learner Import</h1>
        <p className="text-sm text-ink/60 font-normal">
          Onboard already-enrolled learners in one pass from a CSV file instead of one SF10 at a time.
        </p>
      </div>

      {!dataReady ? (
        <Card title="Loading registry" subtitle="Fetching existing sections and learner LRNs...">
          <div className="flex items-center gap-2 text-sm text-ink/60 font-normal">
            <span className="w-4 h-4 border-2 border-tingub-blue border-t-transparent rounded-full animate-spin" />
            Preparing the importer…
          </div>
        </Card>
      ) : (
        <>
          {/* ── Step 1: Upload ─────────────────────────────────────────────── */}
          {rows.length === 0 && !summary && (
            <Card
              title="1. Upload learner CSV"
              subtitle="Provide a .csv with columns: lrn, full_name, birthdate, sex, address, grade_level, section_name."
            >
              <div className="rounded-[8px] border-2 border-dashed border-ink/20 bg-paper p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv,text/plain"
                  onChange={handleFileChange}
                  className="hidden"
                  id="bulk-csv-input"
                />
                <label
                  htmlFor="bulk-csv-input"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-[8px] bg-tingub-blue px-4 py-2 text-sm font-medium text-paper hover:opacity-95"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                  </svg>
                  {isParsing ? "Reading file…" : "Choose a CSV file"}
                </label>
                {isParsing && (
                  <p className="mt-3 text-sm text-ink/60 font-normal">Parsing file…</p>
                )}
              </div>
              {errorMessage && (
                <div className="mt-4 rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/10 p-3 text-sm text-ink font-normal">
                  {errorMessage}
                </div>
              )}
            </Card>
          )}

          {/* ── Step 2: Preview & confirm ────────────────────────────────── */}
          {rows.length > 0 && !summary && (
            <Card
              title="2. Review import preview"
              subtitle={`${rows.length} row(s) parsed from "${fileName}" — nothing has been written to the database yet.`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  <Badge status="approved" label={`${validCount} valid`} />
                  {skippedCount > 0 && (
                    <Badge status="warning" label={`${skippedCount} flagged`} />
                  )}
                </div>
              }
            >
              <div className="rounded-[8px] border border-ink/15 overflow-hidden">
                <div className="overflow-auto max-h-[420px] bg-white">
                  <table className="border-collapse text-[11px] w-max min-w-full">
                    <thead className="sticky top-0 z-10 bg-tingub-blue text-paper">
                      <tr>
                        {["#", "LRN", "Full Name", "Birthdate", "Sex", "Grade", "Section", "Status"].map((h) => (
                          <th key={h} className="px-3 py-2 text-left font-medium border-r border-white/20">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => {
                        const valid = r.reasons.length === 0;
                        return (
                          <tr key={`${r.lrn}-${idx}`} className={valid ? "bg-white" : "bg-[#E8720C]/5"}>
                            <td className="px-3 py-2 border-b border-ink/10 text-ink/50">{idx + 1}</td>
                            <td className="px-3 py-2 border-b border-ink/10 font-mono">{r.lrn}</td>
                            <td className="px-3 py-2 border-b border-ink/10">{r.full_name}</td>
                            <td className="px-3 py-2 border-b border-ink/10">{r.birthdate}</td>
                            <td className="px-3 py-2 border-b border-ink/10">{r.sex}</td>
                            <td className="px-3 py-2 border-b border-ink/10">{r.grade_level}</td>
                            <td className="px-3 py-2 border-b border-ink/10">{r.section_name}</td>
                            <td className="px-3 py-2 border-b border-ink/10">
                              {valid ? (
                                <Badge status="success" label="Ready" />
                              ) : (
                                <span className="inline-block text-[10px] leading-snug text-[#B35900]">
                                  {r.reasons.map((reason, i) => (
                                    <span key={i} className="block">• {reason}</span>
                                  ))}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {skippedCount > 0 && (
                <div className="mt-4 rounded-[8px] border border-tingub-gold/40 bg-tingub-gold/10 p-3 text-xs text-ink font-normal">
                  <strong>{skippedCount} flagged row(s)</strong> will be skipped. Flagged rows are skipped
                  automatically and never written to the registry — you can download them with the reason
                  after confirming.
                </div>
              )}

              {errorMessage && (
                <div className="mt-4 rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/10 p-3 text-sm text-ink font-normal">
                  {errorMessage}
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button
                  variant="approved"
                  disabled={validCount === 0 || isImporting}
                  onClick={confirmImport}
                >
                  {isImporting ? "Importing…" : `Import ${validCount} valid learner${validCount === 1 ? "" : "s"}`}
                </Button>
                <Button variant="secondary" onClick={reset} disabled={isImporting}>
                  Cancel
                </Button>
              </div>
            </Card>
          )}


          {/* ── Step 3: Result & skipped CSV ──────────────────────────────── */}
          {summary && (
            <Card
              title="Import complete"
              subtitle={`Processed "${summary.fileName}".`}
              action={<Badge status="approved" label="Success" />}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[8px] border border-tingub-green/30 bg-tingub-green/10 p-4">
                  <p className="text-2xl font-bold text-tingub-green">{summary.inserted}</p>
                  <p className="text-xs text-ink/60 font-normal">Learner(s) inserted into the registry</p>
                  <p className="mt-1 text-xs text-ink/50 font-normal">
                    SF10 file left unattached — follow up from the Learner Registry (Missing SF10 filter).
                  </p>
                </div>
                <div className="rounded-[8px] border border-ink/15 bg-paper p-4">
                  <p className="text-2xl font-bold text-ink">{summary.skipped}</p>
                  <p className="text-xs text-ink/60 font-normal">Flagged row(s) skipped</p>
                </div>
              </div>

              {summary.skipped > 0 && (
                <div className="mt-5 rounded-[8px] border border-tingub-gold/40 bg-tingub-gold/10 p-4">
                  <p className="text-sm font-bold text-ink">Skipped rows need attention</p>
                  <p className="mt-1 text-xs text-ink/70 font-normal">
                    Download the skipped rows below with the reason printed next to each one. Correct the
                    flagged data (fix the LRN duplicate or the section name) and re-import them.
                  </p>
                  <div className="mt-3">
                    <Button variant="warning" onClick={downloadSkipped}>
                      Download skipped rows (CSV)
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="primary" onClick={reset}>
                  Import another file
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

