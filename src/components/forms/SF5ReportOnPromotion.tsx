"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildSF5,
  getSections,
  getSubjects,
  FormSection,
  FormSubject,
  Sf5Row,
  SCHOOL_YEAR,
} from "@/lib/formsData";
import { FormSheetHeader, PrintButton } from "./FormSheet";

const QUARTERS = [1, 2, 3, 4];

/**
 * SF5 — Report on Promotion & Level of Proficiency (per section per subject).
 * Shows BOTH the Initial Grade (raw weighted) and the Transmuted Grade (official)
 * for each of the four quarters, plus the final rating and promotion remark,
 * generated from `class_record_grades` quarterly totals.
 */
export function SF5ReportOnPromotion() {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [subjects, setSubjects] = useState<FormSubject[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    section?: FormSection;
    subject?: FormSubject;
    rows: Sf5Row[];
  } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getSections(), getSubjects()]).then(([secs, subs]) => {
      if (!active) return;
      setSections(secs);
      setSubjects(subs);
      if (secs.length > 0 && !sectionId) setSectionId(secs[0].id);
      if (subs.length > 0 && !subjectId) setSubjectId(subs[0].id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sectionId || !subjectId) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      buildSF5(sectionId, subjectId).then((res) => {
        if (!active) return;
        setData(res);
        setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sectionId, subjectId]);

  const select = (
    <div className="print:hidden flex flex-wrap items-center gap-3 pb-4">
      <label className="text-sm font-medium text-ink">Section:</label>
      <select
        value={sectionId}
        onChange={(e) => setSectionId(e.target.value)}
        className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
      >
        {sections.map((s) => (
          <option key={s.id} value={s.id}>
            {s.grade_level} - {s.section_name}
          </option>
        ))}
      </select>

      <label className="text-sm font-medium text-ink">Subject:</label>
      <select
        value={subjectId}
        onChange={(e) => setSubjectId(e.target.value)}
        className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
      >
        {subjects.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <PrintButton />
    </div>
  );

  const gradeCell = (v: number | null) =>
    v === null || v === undefined ? "—" : Number(v).toFixed(2);

  return (
    <Card title="SF5 — Report on Promotion & Level of Proficiency" subtitle="Initial Grade and Transmuted Grade per quarter">
      {select}

      <FormSheetHeader
        formLabel="Report on Promotion & Level of Proficiency (SF5)"
        schoolYear={SCHOOL_YEAR}
      />

      {loading ? (
        <p className="text-sm text-ink/70 font-normal">Loading report...</p>
      ) : !data || data.rows.length === 0 ? (
        <EmptyState
          title="No promotion data for this section & subject"
          description="Enter quarterly class record grades for this section and subject to generate the Report on Promotion."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-tingub-blue text-paper">
                <th rowSpan={2} className="border border-ink/20 p-2 text-left font-bold w-8">No.</th>
                <th rowSpan={2} className="border border-ink/20 p-2 text-left font-bold">Learner Name</th>
                {QUARTERS.map((q) => (
                  <th key={q} colSpan={2} className="border border-ink/20 p-2 text-center font-bold">
                    Quarter {q}
                  </th>
                ))}
                <th rowSpan={2} className="border border-ink/20 p-2 text-center font-bold">Final Grade</th>
                <th rowSpan={2} className="border border-ink/20 p-2 text-center font-bold">Remarks</th>
              </tr>
              <tr className="bg-tingub-blue text-paper">
                {QUARTERS.map((q) => (
                  <React.Fragment key={q}>
                    <th className="border border-ink/20 p-1 text-center font-bold">Initial</th>
                    <th className="border border-ink/20 p-1 text-center font-bold">Transmuted</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => {
                const failed = row.finalGrade !== null && row.finalGrade < 75;
                return (
                  <tr key={row.student.id} className="odd:bg-paper even:bg-ink/5">
                    <td className="border border-ink/20 p-2 text-center font-normal">{i + 1}</td>
                    <td className="border border-ink/20 p-2 font-medium">{row.student.full_name}</td>
                    {row.quarters.map((c) => (
                      <React.Fragment key={c.quarter}>
                        <td className="border border-ink/20 p-2 text-center font-mono font-normal">
                          {gradeCell(c.initial)}
                        </td>
                        <td className="border border-ink/20 p-2 text-center font-mono font-normal">
                          {gradeCell(c.transmuted)}
                        </td>
                      </React.Fragment>
                    ))}
                    <td
                      className={`border border-ink/20 p-2 text-center font-mono font-bold ${
                        failed ? "text-tingub-orange" : "text-tingub-green"
                      }`}
                    >
                      {gradeCell(row.finalGrade)}
                    </td>
                    <td
                      className={`border border-ink/20 p-2 text-center font-bold ${
                        failed ? "text-tingub-orange" : "text-tingub-green"
                      }`}
                    >
                      {row.remarks}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
