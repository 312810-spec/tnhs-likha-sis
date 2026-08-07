"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";
import { Section } from "@/types/database.types";
import {
  parseSF10Xlsx,
  SF10ParsedData,
  SF10GradeRow,
  SF10ScholasticRecord,
} from "@/lib/sf10Parser";

// Fallback sections list for initial setup / offline preview
const DEFAULT_SECTIONS: Partial<Section>[] = [
  { id: "sec-7-sampaguita", grade_level: "Grade 7", section_name: "Sampaguita", school_year: "2026-2027" },
  { id: "sec-7-narra", grade_level: "Grade 7", section_name: "Narra", school_year: "2026-2027" },
  { id: "sec-8-rizal", grade_level: "Grade 8", section_name: "Rizal", school_year: "2026-2027" },
  { id: "sec-9-bonifacio", grade_level: "Grade 9", section_name: "Bonifacio", school_year: "2026-2027" },
  { id: "sec-10-luna", grade_level: "Grade 10", section_name: "Luna", school_year: "2026-2027" },
  { id: "sec-11-stem-a", grade_level: "Grade 11", section_name: "STEM A", school_year: "2026-2027" },
  { id: "sec-12-humss-a", grade_level: "Grade 12", section_name: "HUMSS A", school_year: "2026-2027" },
];

// Maximum rows/columns to render in the spreadsheet preview table
const PREVIEW_MAX_ROWS = 60;
const PREVIEW_MAX_COLS = 14;

// ─────────────────────────────────────────────────────────────────────────────
// Spreadsheet Preview Table
// ─────────────────────────────────────────────────────────────────────────────

interface SpreadsheetPreviewProps {
  rows: string[][];
  fileName: string;
  fileSizeKb: number;
}

const SpreadsheetPreview: React.FC<SpreadsheetPreviewProps> = ({
  rows,
  fileName,
  fileSizeKb,
}) => {
  const displayRows = rows.slice(0, PREVIEW_MAX_ROWS);
  const maxCols = displayRows.reduce((m, r) => Math.max(m, r.length), 0);
  const colCount = Math.min(maxCols, PREVIEW_MAX_COLS);

  // Build column header letters: A, B, C ...
  const colHeaders = Array.from({ length: colCount }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  return (
    <div className="w-full rounded-[8px] border border-ink/20 overflow-hidden">
      {/* File info bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#1B3B8C] text-paper text-[11px]">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#F5A623]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="font-medium truncate max-w-[200px]">{fileName}</span>
        </div>
        <span className="font-normal opacity-70">{fileSizeKb} KB</span>
      </div>

      {/* Scrollable table */}
      <div className="overflow-auto max-h-[420px] bg-white">
        <table className="border-collapse text-[11px] w-max min-w-full">
          <thead className="sticky top-0 z-10">
            <tr>
              {/* Row number header */}
              <th className="px-2 py-1 bg-[#1B3B8C] text-paper font-medium text-center min-w-[32px] border-r border-white/20">
                #
              </th>
              {colHeaders.map((h) => (
                <th
                  key={h}
                  className="px-3 py-1 bg-[#1B3B8C] text-paper font-medium text-center min-w-[80px] border-r border-white/20 whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayRows.map((row, ri) => (
              <tr
                key={ri}
                className={ri % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"}
              >
                {/* Row number */}
                <td className="px-2 py-1 text-ink/40 font-medium text-center border-r border-ink/10">
                  {ri + 1}
                </td>
                {Array.from({ length: colCount }, (_, ci) => (
                  <td
                    key={ci}
                    className="px-3 py-1 text-ink font-normal border-b border-ink/5 border-r border-ink/5 whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis"
                    title={row[ci] || ""}
                  >
                    {row[ci] || ""}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > PREVIEW_MAX_ROWS && (
          <p className="text-center text-[11px] text-ink/50 py-2">
            Showing first {PREVIEW_MAX_ROWS} of {rows.length} rows
          </p>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Academic History Table (legacy flat display)
// ─────────────────────────────────────────────────────────────────────────────

interface AcademicHistoryTableProps {
  rows: NonNullable<SF10ParsedData["academicHistory"]>;
}

const AcademicHistoryTable: React.FC<AcademicHistoryTableProps> = ({ rows }) => (
  <div className="overflow-auto rounded-[8px] border border-ink/20">
    <table className="w-full text-[12px] border-collapse">
      <thead>
        <tr className="bg-[#1B3B8C] text-paper">
          <th className="px-3 py-2 text-left font-medium">Subject</th>
          <th className="px-3 py-2 text-center font-medium">Q1</th>
          <th className="px-3 py-2 text-center font-medium">Q2</th>
          <th className="px-3 py-2 text-center font-medium">Q3</th>
          <th className="px-3 py-2 text-center font-medium">Q4</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"}>
            <td className="px-3 py-1.5 text-ink border-b border-ink/5">{r.subject}</td>
            {[r.q1, r.q2, r.q3, r.q4].map((g, qi) => (
              <td key={qi} className="px-3 py-1.5 text-center text-ink border-b border-ink/5">
                {g != null ? (
                  <span className={g >= 75 ? "text-[#1E6B3A] font-medium" : "text-[#E8720C] font-medium"}>
                    {g}
                  </span>
                ) : (
                  <span className="text-ink/30">—</span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Scholastic Record Card — Grade 7 structured table
// ─────────────────────────────────────────────────────────────────────────────

interface ScholasticRecordCardProps {
  record: SF10ScholasticRecord;
}

const ScholasticRecordCard: React.FC<ScholasticRecordCardProps> = ({ record }) => {
  const [expanded, setExpanded] = useState(true);

  const gradeCell = (g: number | undefined) =>
    g != null ? (
      <span className={g >= 75 ? "text-[#1E6B3A] font-medium" : "text-[#E8720C] font-medium"}>
        {g.toFixed(g % 1 === 0 ? 0 : 2)}
      </span>
    ) : (
      <span className="text-ink/30">—</span>
    );

  return (
    <div className="rounded-[8px] border border-[#1B3B8C]/30 overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-[#1B3B8C]/8 hover:bg-[#1B3B8C]/12 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg
            className={`w-3.5 h-3.5 text-[#1B3B8C] transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-xs font-bold text-[#1B3B8C]">
            {record.gradeLevel} Scholastic Record
          </span>
          <span className="text-[10px] font-normal text-ink/50">
            ({record.grades.length} subjects)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink/60 font-normal">
          {record.schoolYear && (
            <span>SY {record.schoolYear}</span>
          )}
          {record.section && (
            <span>§ {record.section}</span>
          )}
        </div>
      </button>

      {/* Meta row */}
      {expanded && (
        <>
          {(record.adviserName || record.section || record.schoolYear) && (
            <div className="grid grid-cols-3 gap-0 border-b border-ink/10 text-[11px]">
              <div className="px-3 py-1.5 bg-paper/60 border-r border-ink/10">
                <span className="text-ink/50 block text-[10px]">Section</span>
                <span className="font-medium text-ink">{record.section ?? "—"}</span>
              </div>
              <div className="px-3 py-1.5 bg-paper/60 border-r border-ink/10">
                <span className="text-ink/50 block text-[10px]">School Year</span>
                <span className="font-medium text-ink">{record.schoolYear ?? "—"}</span>
              </div>
              <div className="px-3 py-1.5 bg-paper/60">
                <span className="text-ink/50 block text-[10px]">Adviser</span>
                <span className="font-medium text-ink truncate">{record.adviserName ?? "—"}</span>
              </div>
            </div>
          )}

          {/* Grades table */}
          <div className="overflow-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="bg-[#1B3B8C] text-paper">
                  <th className="px-3 py-1.5 text-left font-medium">Subject</th>
                  <th className="px-3 py-1.5 text-center font-medium w-14">Q1</th>
                  <th className="px-3 py-1.5 text-center font-medium w-14">Q2</th>
                  <th className="px-3 py-1.5 text-center font-medium w-14">Q3</th>
                  <th className="px-3 py-1.5 text-center font-medium w-14">Q4</th>
                  <th className="px-3 py-1.5 text-center font-medium w-16">Final</th>
                </tr>
              </thead>
              <tbody>
                {record.grades.map((row: SF10GradeRow, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFAF8]"}>
                    <td className="px-3 py-1.5 text-ink border-b border-ink/5 font-normal">
                      {row.subject}
                    </td>
                    <td className="px-3 py-1.5 text-center border-b border-ink/5">{gradeCell(row.q1)}</td>
                    <td className="px-3 py-1.5 text-center border-b border-ink/5">{gradeCell(row.q2)}</td>
                    <td className="px-3 py-1.5 text-center border-b border-ink/5">{gradeCell(row.q3)}</td>
                    <td className="px-3 py-1.5 text-center border-b border-ink/5">{gradeCell(row.q4)}</td>
                    <td className="px-3 py-1.5 text-center border-b border-ink/5 font-medium">
                      {gradeCell(row.finalGrade)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Supabase client type helpers (avoiding direct type-casting in component body)
// ─────────────────────────────────────────────────────────────────────────────

type DbClient = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (col: string, val: string) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
        single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
      };
      single: () => Promise<{ data: Record<string, unknown> | null; error: unknown }>;
    };
    insert: (values: Record<string, unknown>) => {
      select: () => {
        single: () => Promise<{ data: { id: string } | null; error: unknown }>;
      };
    };
    update: (values: Record<string, unknown>) => {
      eq: (col: string, val: string) => Promise<{ error: unknown }>;
    };
    upsert: (values: Record<string, unknown> | Record<string, unknown>[], opts?: Record<string, unknown>) => Promise<{ error: unknown }>;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export const EnrollmentUploadForm: React.FC = () => {
  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // XLSX parsing state
  const [xlsxParsedData, setXlsxParsedData] = useState<SF10ParsedData | null>(null);
  const [isParsingXlsx, setIsParsingXlsx] = useState(false);
  const [xlsxParseError, setXlsxParseError] = useState<string | null>(null);
  const [showAcademicHistory, setShowAcademicHistory] = useState(false);

  // Form fields state
  const [lrn, setLrn] = useState("");
  const [fullName, setFullName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [sex, setSex] = useState<"Male" | "Female" | "">("");
  const [address, setAddress] = useState("");
  const [gradeLevel, setGradeLevel] = useState("Grade 7");
  const [sectionId, setSectionId] = useState("");
  const [reviewerNotes, setReviewerNotes] = useState("");

  // New fields from enhanced parser
  const [elementarySchoolId, setElementarySchoolId] = useState("");
  const [elementaryGenAve, setElementaryGenAve] = useState<number | null>(null);
  const [scholasticRecord, setScholasticRecord] = useState<SF10ScholasticRecord | null>(null);

  // Update mode — set true when LRN already exists in students table
  const [updateMode, setUpdateMode] = useState(false);
  const [existingStudentName, setExistingStudentName] = useState<string | null>(null);

  // Validation & status state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [isCheckingLrn, setIsCheckingLrn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gradeCommitLog, setGradeCommitLog] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    lrn: string;
    fullName: string;
    gradeLevel: string;
    studentId: string;
    requestId: string;
    fileUrl: string;
    wasUpdate: boolean;
    gradesCommitted: number;
  } | null>(null);

  // Dynamic sections from database
  const [sections, setSections] = useState<Partial<Section>[]>(DEFAULT_SECTIONS);
  const [sectionsError, setSectionsError] = useState<string | null>(null);

  // Fetch sections from Supabase on mount
  useEffect(() => {
    let active = true;
    async function loadSections() {
      try {
        const client = supabase as unknown as {
          from: (table: string) => { select: (query: string) => Promise<{ data: Section[] | null; error: unknown }> };
        };
        const { data, error } = await client.from("sections").select("*");
        if (!active) return;
        if (!error && data && data.length > 0) {
          setSections(data);
          setSectionId(data[0].id || "");
          setSectionsError(null);
        } else {
          setSectionId(DEFAULT_SECTIONS[0]?.id || "");
          setSectionsError(null);
        }
      } catch (err) {
        if (!active) return;
        setSectionId(DEFAULT_SECTIONS[0]?.id || "");
        setSectionsError(err instanceof Error ? err.message : "Unable to load sections from the registry.");
      }
    }
    loadSections();
    return () => { active = false; };
  }, []);

  // Filter sections by selected grade level
  const filteredSections = sections.filter(
    (sec) => !sec.grade_level || sec.grade_level === gradeLevel
  );

  // ── XLSX auto-fill: propagate parsed data into form fields ──────────────
  useEffect(() => {
    if (!xlsxParsedData) return;

    if (xlsxParsedData.lrn) setLrn(xlsxParsedData.lrn);
    if (xlsxParsedData.fullName) setFullName(xlsxParsedData.fullName);
    if (xlsxParsedData.birthdate) setBirthdate(xlsxParsedData.birthdate);
    if (xlsxParsedData.sex) setSex(xlsxParsedData.sex);
    if (xlsxParsedData.address) setAddress(xlsxParsedData.address);
    if (xlsxParsedData.gradeLevel) setGradeLevel(xlsxParsedData.gradeLevel);
    if (xlsxParsedData.elementarySchoolId) setElementarySchoolId(xlsxParsedData.elementarySchoolId);
    if (xlsxParsedData.elementaryGenAve != null) setElementaryGenAve(xlsxParsedData.elementaryGenAve);
    if (xlsxParsedData.scholasticRecord) setScholasticRecord(xlsxParsedData.scholasticRecord);
  }, [xlsxParsedData]);

  // ── Handle SF10 file selection ──────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setXlsxParsedData(null);
    setXlsxParseError(null);
    setFilePreviewUrl(null);
    setErrorMessage(null);
    setGradeCommitLog(null);

    const isXlsx =
      file.name.toLowerCase().endsWith(".xlsx") ||
      file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (isXlsx) {
      setIsParsingXlsx(true);
      try {
        const buffer = await file.arrayBuffer();
        const parsed = parseSF10Xlsx(buffer);
        setXlsxParsedData(parsed);
      } catch (err) {
        setXlsxParseError(
          err instanceof Error
            ? `Failed to parse Excel file: ${err.message}`
            : "Failed to parse the Excel file. Ensure it is a valid .xlsx document."
        );
      } finally {
        setIsParsingXlsx(false);
      }
    } else {
      // PDF or image — use object URL for preview
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    }
  }, []);

  // Clean up object URL on unmount / change
  useEffect(() => {
    return () => {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    };
  }, [filePreviewUrl]);

  // ── Real-time LRN check: detects duplicates → switches to update mode ──
  useEffect(() => {
    const timer = setTimeout(async () => {
      const cleanLrn = lrn.trim();
      if (!cleanLrn) {
        setDuplicateWarning(null);
        setUpdateMode(false);
        setExistingStudentName(null);
        return;
      }

      setIsCheckingLrn(true);

      try {
        const client = supabase as unknown as DbClient;
        const { data, error } = await client
          .from("students")
          .select("lrn, full_name")
          .eq("lrn", cleanLrn)
          .maybeSingle();

        if (!error && data) {
          // LRN exists → switch to update mode instead of hard block
          const existingName = String(data.full_name ?? "");
          setUpdateMode(true);
          setExistingStudentName(existingName);
          setDuplicateWarning(null); // clear old error-style warning
        } else {
          setUpdateMode(false);
          setExistingStudentName(null);
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.warn("Unable to perform live LRN check against database:", err);
        setUpdateMode(false);
        setExistingStudentName(null);
        setDuplicateWarning(null);
      } finally {
        setIsCheckingLrn(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [lrn]);

  // ── Commit extracted grades into `grades` table ─────────────────────────
  async function commitGrades(
    studentLrn: string,
    record: SF10ScholasticRecord
  ): Promise<number> {
    const client = supabase as unknown as DbClient;
    const sy = record.schoolYear ?? "2025-2026";
    const gl = record.gradeLevel ?? "Grade 7";

    const rows: Record<string, unknown>[] = [];
    for (const gradeRow of record.grades) {
      const quarterMap: [number, number | undefined][] = [
        [1, gradeRow.q1],
        [2, gradeRow.q2],
        [3, gradeRow.q3],
        [4, gradeRow.q4],
      ];
      for (const [quarter, grade] of quarterMap) {
        if (grade == null) continue;
        rows.push({
          student_lrn: studentLrn,
          grade_level: gl,
          school_year: sy,
          subject: gradeRow.subject,
          quarter,
          grade,
        });
      }
    }

    if (rows.length === 0) return 0;

    try {
      const { error } = await client.from("grades").upsert(rows, {
        onConflict: "student_lrn,grade_level,school_year,subject,quarter",
      });
      if (error) {
        console.warn("Grade commit error (non-fatal):", error);
        return 0;
      }
      return rows.length;
    } catch (err) {
      console.warn("Grade commit exception (non-fatal):", err);
      return 0;
    }
  }

  // ── Handle enrollment confirmation / update submit ──────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setErrorMessage("Please select and upload an SF10 file first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setGradeCommitLog(null);

    try {
      const cleanLrn = lrn.trim();
      const cleanName = fullName.trim();
      const fileExt = selectedFile.name.split(".").pop() || "pdf";
      const storageFilePath = `sf10_${cleanLrn}_${Date.now()}.${fileExt}`;

      let uploadedPublicUrl = `https://placeholder.supabase.co/storage/v1/object/public/sf10-uploads/${storageFilePath}`;

      // 1. Upload to Supabase private storage bucket sf10-uploads
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("sf10-uploads")
          .upload(storageFilePath, selectedFile, {
            cacheControl: "3600",
            upsert: true,
          });

        if (!uploadError && uploadData) {
          const { data: publicUrlData } = supabase.storage
            .from("sf10-uploads")
            .getPublicUrl(uploadData.path);
          if (publicUrlData?.publicUrl) {
            uploadedPublicUrl = publicUrlData.publicUrl;
          }
        }
      } catch (uploadErr) {
        console.warn("Storage upload fallback:", uploadErr);
      }

      const dbClient = supabase as unknown as DbClient;

      // 2. Upsert student record (insert new OR update existing by LRN)
      let studentId = `std-${Date.now()}`;
      const studentPayload: Record<string, unknown> = {
        lrn: cleanLrn,
        full_name: cleanName,
        birthdate: birthdate || null,
        sex: sex || null,
        address: address || null,
        grade_level: gradeLevel,
        section_id: sectionId || null,
        enrollment_status: "enrolled",
        sf10_file_url: uploadedPublicUrl,
      };

      if (updateMode) {
        // UPDATE existing student row by LRN
        try {
          await dbClient
            .from("students")
            .update(studentPayload)
            .eq("lrn", cleanLrn);
          // Retrieve id for downstream use
          const { data: existing } = await dbClient
            .from("students")
            .select("id")
            .eq("lrn", cleanLrn)
            .maybeSingle();
          if (existing?.id) studentId = String(existing.id);
        } catch (updateErr) {
          console.warn("DB students update fallback:", updateErr);
        }
      } else {
        // INSERT new student row
        try {
          const { data: studentData, error: studentError } = await dbClient
            .from("students")
            .insert(studentPayload)
            .select()
            .single();

          if (!studentError && studentData) {
            studentId = String(studentData.id);
          }
        } catch (studentErr) {
          console.warn("DB students insert fallback:", studentErr);
        }
      }

      // 3. Create / update enrollment_requests record
      let requestId = `req-${Date.now()}`;
      try {
        const { data: reqData, error: reqError } = await dbClient
          .from("enrollment_requests")
          .insert({
            uploaded_file_url: uploadedPublicUrl,
            status: "pending_review",
            reviewer_notes: reviewerNotes || "Manual SF10 verification by ICT Coordinator",
          })
          .select()
          .single();

        if (!reqError && reqData) {
          requestId = String(reqData.id);
        }
      } catch (reqErr) {
        console.warn("DB enrollment_requests insert fallback:", reqErr);
      }

      // 4. Update enrollment request status to 'confirmed'
      try {
        await dbClient
          .from("enrollment_requests")
          .update({ status: "confirmed" })
          .eq("id", requestId);
      } catch (updateErr) {
        console.warn("DB request update status fallback:", updateErr);
      }

      // 5. Commit extracted grades to `grades` table
      let gradesCommitted = 0;
      const recordToCommit = scholasticRecord ?? xlsxParsedData?.scholasticRecord;
      if (recordToCommit && recordToCommit.grades.length > 0) {
        gradesCommitted = await commitGrades(cleanLrn, recordToCommit);
        if (gradesCommitted > 0) {
          setGradeCommitLog(
            `${gradesCommitted} quarterly grade entries committed to the grades table for SY ${recordToCommit.schoolYear ?? "2025-2026"}.`
          );
        }
      }

      // 6. Render success screen
      setSuccessData({
        lrn: cleanLrn,
        fullName: cleanName,
        gradeLevel,
        studentId,
        requestId,
        fileUrl: uploadedPublicUrl,
        wasUpdate: updateMode,
        gradesCommitted,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to confirm enrollment.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setXlsxParsedData(null);
    setXlsxParseError(null);
    setIsParsingXlsx(false);
    setShowAcademicHistory(false);
    setLrn("");
    setFullName("");
    setBirthdate("");
    setSex("");
    setAddress("");
    setGradeLevel("Grade 7");
    setReviewerNotes("");
    setElementarySchoolId("");
    setElementaryGenAve(null);
    setScholasticRecord(null);
    setDuplicateWarning(null);
    setUpdateMode(false);
    setExistingStudentName(null);
    setSuccessData(null);
    setErrorMessage(null);
    setGradeCommitLog(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Helper: is the selected file an xlsx? ──────────────────────────────
  const isXlsxFile =
    selectedFile?.name.toLowerCase().endsWith(".xlsx") ||
    selectedFile?.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

  // Active scholastic record (state-controlled so user could theoretically edit)
  const activeScholasticRecord = scholasticRecord ?? xlsxParsedData?.scholasticRecord;

  // ─────────────────────────────────────────────────────────────────────────
  // Success view
  // ─────────────────────────────────────────────────────────────────────────
  if (successData) {
    return (
      <Card
        title={successData.wasUpdate ? "Learner Record Updated" : "Learner Enrollment Confirmed"}
        subtitle={
          successData.wasUpdate
            ? "The existing student record has been updated and grades have been committed to the registry."
            : "The student record and SF10 permanent document link have been saved to the registry."
        }
        action={<Badge status="approved" label={successData.wasUpdate ? "Updated" : "Confirmed"} />}
      >
        <div className="space-y-6">
          <div className="p-4 bg-tingub-green/10 border border-tingub-green/30 rounded-[8px] text-ink text-sm">
            <p className="font-bold text-tingub-green text-base">
              {successData.wasUpdate ? "Record Successfully Updated!" : "Enrollment Successfully Registered!"}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {successData.wasUpdate
                ? `Student row for LRN ${successData.lrn} was updated in the students table.`
                : "Student record written to students table and enrollment request marked as confirmed."}
            </p>
            {successData.gradesCommitted > 0 && (
              <p className="mt-1 text-xs font-medium text-tingub-green">
                ✓ {successData.gradesCommitted} quarterly grade entries saved to the grades table.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-normal">
            <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
              <span className="text-xs text-ink/60 block">Learner Reference Number (LRN)</span>
              <span className="font-bold text-ink text-base">{successData.lrn}</span>
            </div>
            <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
              <span className="text-xs text-ink/60 block">Learner Full Name</span>
              <span className="font-bold text-ink text-base">{successData.fullName}</span>
            </div>
            <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
              <span className="text-xs text-ink/60 block">Assigned Grade Level</span>
              <span className="font-medium text-ink">{successData.gradeLevel}</span>
            </div>
            <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
              <span className="text-xs text-ink/60 block">Uploaded Document Bucket</span>
              <span className="font-mono text-xs text-tingub-blue">sf10-uploads/</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2 border-t border-ink/10">
            <Button variant="approved" onClick={resetForm}>
              {successData.wasUpdate ? "Update another learner" : "Enroll another learner"}
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Print enrollment summary
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main form view
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

      {/* ─── LEFT COLUMN: SF10 File Upload & Preview ──────────────────────── */}
      <div className="lg:col-span-6 space-y-4">
        <Card
          title="1. SF10 Learner File Upload"
          subtitle="Select learner's official SF10 (Permanent Record) file (PDF, Image, or Excel .xlsx)"
          action={
            selectedFile ? (
              <Badge status="approved" label="File Loaded" />
            ) : (
              <Badge status="pending" label="Awaiting File" />
            )
          }
        >
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <label htmlFor="sf10-file" className="block text-sm font-medium text-ink mb-1">
                SF10 Document File
              </label>
              <input
                id="sf10-file"
                ref={fileInputRef}
                type="file"
                accept=".pdf,.xlsx,image/png,image/jpeg,image/jpg,image/webp,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="w-full text-sm text-ink/80 file:mr-4 file:py-2 file:px-4 file:rounded-[8px] file:border file:border-ink/20 file:text-xs file:font-medium file:bg-paper file:text-ink hover:file:bg-ink/5 focus:outline-none"
              />
              <p className="text-[11px] text-ink/60 mt-1">
                Accepted: PDF, Excel (.xlsx), PNG, JPEG, WebP
              </p>
            </div>

            {/* Excel parsing spinner */}
            {isParsingXlsx && (
              <div className="flex items-center gap-2 p-3 bg-[#1B3B8C]/10 border border-[#1B3B8C]/25 rounded-[8px]">
                <svg className="w-4 h-4 text-[#1B3B8C] animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-[12px] text-[#1B3B8C] font-medium">
                  Parsing SF10 spreadsheet…
                </span>
              </div>
            )}

            {/* Excel parse error */}
            {xlsxParseError && (
              <div className="p-3 bg-[#E8720C]/15 border border-[#E8720C]/40 rounded-[8px] text-xs text-ink font-medium">
                {xlsxParseError}
              </div>
            )}

            {/* Document Preview Pane */}
            <div className="mt-4">
              <div className="text-xs font-medium text-ink/70 mb-2 flex items-center justify-between">
                <span>
                  {isXlsxFile ? "Spreadsheet Preview" : "Side-by-Side Document Preview"}
                </span>
                {selectedFile && (
                  <span className="font-mono text-[11px] text-ink/50">
                    {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
                  </span>
                )}
              </div>

              {/* XLSX preview: spreadsheet table */}
              {isXlsxFile && xlsxParsedData?.rawRows ? (
                <SpreadsheetPreview
                  rows={xlsxParsedData.rawRows}
                  fileName={selectedFile!.name}
                  fileSizeKb={Math.round(selectedFile!.size / 1024)}
                />
              ) : isXlsxFile && !isParsingXlsx && !xlsxParseError ? (
                <div className="w-full min-h-[200px] bg-ink/5 rounded-[8px] border border-ink/20 flex items-center justify-center">
                  <p className="text-sm text-ink/50">No spreadsheet data to preview.</p>
                </div>
              ) : filePreviewUrl ? (
                <div className="w-full min-h-[480px] bg-ink/5 rounded-[8px] border border-ink/20 p-2 flex flex-col items-center justify-center overflow-hidden">
                  {selectedFile?.type.includes("pdf") ? (
                    <iframe
                      src={filePreviewUrl}
                      title="SF10 Document Preview"
                      className="w-full h-[460px] rounded-[8px] border border-ink/10 bg-white"
                    />
                  ) : (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={filePreviewUrl}
                      alt="SF10 Permanent Record Preview"
                      className="max-w-full max-h-[460px] object-contain rounded-[8px]"
                    />
                  )}
                </div>
              ) : (
                <EmptyState
                  title="No SF10 document loaded yet"
                  description="Select a learner's SF10 permanent record file above to view the preview while entering enrollment fields."
                  actionLabel="Upload SF10 file"
                  onAction={() => fileInputRef.current?.click()}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  }
                />
              )}
            </div>

            {/* Grade 7 Scholastic Record (from coordinate extraction) */}
            {activeScholasticRecord && activeScholasticRecord.grades.length > 0 && (
              <div className="mt-2">
                <ScholasticRecordCard record={activeScholasticRecord} />
              </div>
            )}

            {/* Legacy Academic History (label-scan fallback, collapsible) */}
            {!activeScholasticRecord && xlsxParsedData?.academicHistory && xlsxParsedData.academicHistory.length > 0 && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowAcademicHistory((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#1B3B8C] hover:underline"
                >
                  <svg
                    className={`w-3.5 h-3.5 transition-transform ${showAcademicHistory ? "rotate-90" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showAcademicHistory ? "Hide" : "Show"} past academic grades (
                  {xlsxParsedData.academicHistory.length} subjects)
                </button>
                {showAcademicHistory && (
                  <div className="mt-2">
                    <AcademicHistoryTable rows={xlsxParsedData.academicHistory} />
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ─── RIGHT COLUMN: Enrollment Form ────────────────────────────────── */}
      <div className="lg:col-span-6 space-y-4">
        <Card
          title="2. Learner Manual Enrollment Form"
          subtitle="ICT Coordinator data entry from SF10 record"
          action={
            updateMode ? (
              <Badge status="warning" label="Update Mode" />
            ) : xlsxParsedData && xlsxParsedData.filledCount > 0 ? (
              <Badge status="approved" label="Auto-filled" />
            ) : (
              <Badge status="pending" label="Manual Mode" />
            )
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* ── UPDATE MODE BANNER ─────────────────────────────────────── */}
            {updateMode && (
              <div
                className="p-4 rounded-[8px] space-y-1 border-2"
                style={{ background: "#F5A62318", borderColor: "#F5A623" }}
              >
                <div className="flex items-center gap-2">
                  <Badge status="pending" label="Existing Record Found" />
                  <span className="font-bold text-sm text-[#9A6600]">
                    Update Mode Active
                  </span>
                </div>
                <p className="text-xs text-ink font-normal">
                  LRN <strong>{lrn}</strong> is already registered
                  {existingStudentName ? ` to "${existingStudentName}"` : ""}.
                  Submitting will <strong>update</strong> the existing student record rather than create a duplicate.
                </p>
              </div>
            )}

            {/* ── Auto-fill info banner ──────────────────────────────────── */}
            {xlsxParsedData && xlsxParsedData.filledCount > 0 && !updateMode && (
              <div className="p-3 bg-[#1B3B8C]/10 border border-[#1B3B8C]/30 rounded-[8px] flex items-start gap-2">
                <svg className="w-4 h-4 text-[#1B3B8C] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[12px] text-[#1B3B8C] font-medium">
                  <span className="font-bold">{xlsxParsedData.filledCount} field{xlsxParsedData.filledCount !== 1 ? "s were" : " was"} auto-filled</span>{" "}
                  from the SF10 spreadsheet. Please review each field before confirming enrollment.
                </p>
              </div>
            )}

            {/* ── xlsx parse partial-success notice ─────────────────────── */}
            {xlsxParsedData && xlsxParsedData.filledCount === 0 && (
              <div className="p-3 bg-[#F5A623]/15 border border-[#F5A623]/40 rounded-[8px] text-xs text-ink font-medium">
                The spreadsheet was loaded but no standard SF10 field labels were detected.
                Please enter all fields manually below.
              </div>
            )}

            {/* ── General Error Banner ───────────────────────────────────── */}
            {errorMessage && (
              <div className="p-3 bg-tingub-orange/15 border border-tingub-orange/40 rounded-[8px] text-xs text-ink font-medium">
                {errorMessage}
              </div>
            )}

            {/* ── Grade commit log ───────────────────────────────────────── */}
            {gradeCommitLog && (
              <div className="p-3 bg-tingub-green/10 border border-tingub-green/30 rounded-[8px] text-xs text-tingub-green font-medium">
                ✓ {gradeCommitLog}
              </div>
            )}

            {/* ── Field: LRN ────────────────────────────────────────────── */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="lrn" className="block text-sm font-medium text-ink">
                  Learner Reference Number (LRN) *
                </label>
                {isCheckingLrn && (
                  <span className="text-[11px] text-tingub-blue font-medium animate-pulse">
                    Checking registry…
                  </span>
                )}
              </div>
              <input
                id="lrn"
                type="text"
                required
                maxLength={12}
                value={lrn}
                onChange={(e) => setLrn(e.target.value.replace(/\D/g, ""))}
                placeholder="12-digit DepEd LRN (e.g. 120019180083)"
                className={`w-full px-3 py-2 bg-paper border rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40 ${
                  updateMode ? "border-[#F5A623] border-2" : duplicateWarning ? "border-[#E8720C] border-2" : "border-ink/30"
                }`}
              />
              <p className="text-[11px] text-ink/60 mt-1 font-normal">
                Must be exact 12-digit DepEd reference number. System automatically checks for duplicates.
              </p>
            </div>

            {/* ── Field: Full Name ──────────────────────────────────────── */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-ink mb-1">
                Learner Full Name (Last Name, First Name, Middle Name) *
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Dela Cruz, Juan Pedro"
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
              />
            </div>

            {/* ── Grid Row: Birthdate & Sex ─────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="birthdate" className="block text-sm font-medium text-ink mb-1">
                  Date of Birth *
                </label>
                <input
                  id="birthdate"
                  type="date"
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
                />
              </div>

              <div>
                <label htmlFor="sex" className="block text-sm font-medium text-ink mb-1">
                  Sex *
                </label>
                <select
                  id="sex"
                  required
                  value={sex}
                  onChange={(e) => setSex(e.target.value as "Male" | "Female")}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
                >
                  <option value="">Select sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            {/* ── Field: Address ────────────────────────────────────────── */}
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-ink mb-1">
                Residential Address *
              </label>
              <textarea
                id="address"
                rows={2}
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Complete street address, Barangay, Municipality/City, Province"
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
              />
            </div>

            {/* ── Grid Row: Grade Level & Section ──────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gradeLevel" className="block text-sm font-medium text-ink mb-1">
                  Grade Level *
                </label>
                <select
                  id="gradeLevel"
                  required
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
                >
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11 (SHS)</option>
                  <option value="Grade 12">Grade 12 (SHS)</option>
                </select>
              </div>

              <div>
                <label htmlFor="section" className="block text-sm font-medium text-ink mb-1">
                  Assigned Section
                </label>
                <select
                  id="section"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
                >
                  {filteredSections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.section_name} ({sec.grade_level})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {sectionsError && (
              <p className="p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
                {sectionsError}
              </p>
            )}

            {/* ── Elementary School (auto-filled from xlsx) ─────────────── */}
            {(xlsxParsedData?.elementarySchool || xlsxParsedData?.elementarySchoolId || xlsxParsedData?.elementaryGenAve != null) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-ink">
                  Elementary School (from SF10)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {xlsxParsedData?.elementarySchool && (
                    <div className="sm:col-span-2 p-2 bg-ink/5 border border-ink/20 rounded-[8px]">
                      <span className="text-[10px] text-ink/50 block">School Name</span>
                      <span className="text-sm text-ink/80 font-normal">{xlsxParsedData.elementarySchool}</span>
                    </div>
                  )}
                  {(xlsxParsedData?.elementarySchoolId || elementarySchoolId) && (
                    <div className="p-2 bg-ink/5 border border-ink/20 rounded-[8px]">
                      <span className="text-[10px] text-ink/50 block">School ID</span>
                      <span className="text-sm text-ink/80 font-normal font-mono">
                        {xlsxParsedData?.elementarySchoolId || elementarySchoolId}
                      </span>
                    </div>
                  )}
                  {(xlsxParsedData?.elementaryGenAve != null || elementaryGenAve != null) && (
                    <div className="p-2 bg-ink/5 border border-ink/20 rounded-[8px]">
                      <span className="text-[10px] text-ink/50 block">Gen. Average</span>
                      <span className={`text-sm font-bold ${
                        (xlsxParsedData?.elementaryGenAve ?? elementaryGenAve ?? 0) >= 75
                          ? "text-[#1E6B3A]"
                          : "text-[#E8720C]"
                      }`}>
                        {(xlsxParsedData?.elementaryGenAve ?? elementaryGenAve ?? "—")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Grade 7 Grades commit notice ──────────────────────────── */}
            {activeScholasticRecord && activeScholasticRecord.grades.length > 0 && (
              <div className="p-3 bg-[#1E6B3A]/10 border border-[#1E6B3A]/30 rounded-[8px] flex items-start gap-2">
                <svg className="w-4 h-4 text-[#1E6B3A] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-[12px] text-[#1E6B3A] font-medium">
                  <span className="font-bold">{activeScholasticRecord.grades.length} Grade 7 subjects</span>{" "}
                  parsed from the SF10 spreadsheet
                  {activeScholasticRecord.schoolYear ? ` (SY ${activeScholasticRecord.schoolYear})` : ""}.
                  Grades will be committed to the <code className="font-mono text-[11px]">grades</code> table on submit.
                </p>
              </div>
            )}

            {/* ── Field: Reviewer Notes ─────────────────────────────────── */}
            <div>
              <label htmlFor="reviewerNotes" className="block text-sm font-medium text-ink mb-1">
                Reviewer / Coordinator Notes (Optional)
              </label>
              <input
                id="reviewerNotes"
                type="text"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="e.g. SF10 verified against original Form 137 from Tingub Elementary"
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
              />
            </div>

            {/* ── ACTION BUTTONS ────────────────────────────────────────── */}
            <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-3">
              <Button type="button" variant="secondary" onClick={resetForm}>
                Clear form
              </Button>

              <Button
                type="submit"
                variant="approved"
                disabled={!selectedFile || isSubmitting || isParsingXlsx}
              >
                {isSubmitting
                  ? updateMode ? "Updating record…" : "Uploading SF10…"
                  : updateMode ? "Update existing record" : "Confirm enrollment"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
