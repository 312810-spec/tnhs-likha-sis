"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildLearnerResults,
  getStudents,
  FormStudent,
  FormLearnerResult,
  SCHOOL_YEAR,
} from "@/lib/formsData";
import { computeAwardsEligibility } from "@/lib/awardsEligibility";
import { FormSheetHeader, PrintButton } from "./FormSheet";

const QUARTERS = [1, 2, 3, 4];

/**
 * Demo mapping of quarter numbers that already carry a disciplinary (behavior)
 * anecdote for a learner, used to demonstrate the optional awards-eligibility flag.
 * In production this comes from `anecdotal_records`.
 */
const DEMO_DISCIPLINARY_QUARTERS: Record<string, number[]> = {
  "std-2": [3],
  "std-4": [2],
};

/**
 * SF9 — Learner Progress Report Card (DO 015, s. 2026).
 * The Transmuted Grade is shown as the OFFICIAL grade per quarter. Includes the
 * General Average and the optional awards-eligibility flag.
 */
export function SF9ReportCard() {
  const [students, setStudents] = useState<FormStudent[]>([]);
  const [studentId, setStudentId] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FormLearnerResult | null>(null);

  useEffect(() => {
    let active = true;
    getStudents().then((list) => {
      if (!active) return;
      setStudents(list);
      if (list.length > 0 && !studentId) setStudentId(list[0].id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!studentId) return;
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      getStudents()
        .then((list) => list.find((s) => s.id === studentId) || list[0])
        .then((student) => buildLearnerResults(student))
        .then((res) => {
          if (!active) return;
          setData(res);
          setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [studentId]);

  const awards = data
    ? computeAwardsEligibility({
        subjectResults: data.subjects,
        disciplinaryQuarters: DEMO_DISCIPLINARY_QUARTERS[data.student.id] || [],
        targetQuarter: 4,
      })
    : null;

  const select = (
    <div className="print:hidden flex flex-wrap items-center gap-3 pb-4">
      <label className="text-sm font-medium text-ink">Learner:</label>
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
      >
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name} ({s.grade_level})
          </option>
        ))}
      </select>
      <PrintButton />
    </div>
  );

  const cell = (v: number | null) => (v === null || v === undefined ? "—" : Number(v).toFixed(2));

  return (
    <Card title="SF9 — Learner Progress Report Card" subtitle="Transmuted Grade shown as the official grade (DO 015, s. 2026)">
      {select}

      <FormSheetHeader
        formLabel="Learner Progress Report Card (SF9)"
        schoolYear={SCHOOL_YEAR}
      />

      {loading ? (
        <p className="text-sm text-ink/70 font-normal">Loading report card...</p>
      ) : !data ? (
        <EmptyState title="No learner selected" description="Select a learner to generate their Progress Report Card." />
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="rounded-[8px] border border-ink/15 p-3">
              <div className="text-ink/70 font-normal">Learner</div>
              <div className="font-medium">{data.student.full_name}</div>
            </div>
            <div className="rounded-[8px] border border-ink/15 p-3">
              <div className="text-ink/70 font-normal">LRN</div>
              <div className="font-mono font-normal">{data.student.lrn}</div>
            </div>
            <div className="rounded-[8px] border border-ink/15 p-3">
              <div className="text-ink/70 font-normal">Grade & Section</div>
              <div className="font-medium">
                {data.student.grade_level}
                {data.section ? ` - ${data.section.section_name}` : ""}
              </div>
            </div>
            <div className="rounded-[8px] border border-ink/15 p-3">
              <div className="text-ink/70 font-normal">General Average</div>
              <div className="font-mono font-bold text-tingub-blue">
                {data.generalAverage === null ? "—" : data.generalAverage.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-tingub-blue text-paper">
                  <th rowSpan={2} className="border border-ink/20 p-2 text-left font-bold">Learning Area</th>
                  {QUARTERS.map((q) => (
                    <th key={q} className="border border-ink/20 p-2 text-center font-bold">Quarter {q}</th>
                  ))}
                  <th rowSpan={2} className="border border-ink/20 p-2 text-center font-bold">Final Grade</th>
                  <th rowSpan={2} className="border border-ink/20 p-2 text-center font-bold">Remarks</th>
                </tr>
                <tr className="bg-tingub-blue text-paper">
                  {QUARTERS.map((q) => (
                    <th key={q} className="border border-ink/20 p-1 text-center font-normal">(official)</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.subjects.map((row) => {
                  const failed = row.finalGrade !== null && row.finalGrade < 75;
                  return (
                    <tr key={row.subject.id} className="odd:bg-paper even:bg-ink/5">
                      <td className="border border-ink/20 p-2 font-medium">{row.subject.name}</td>
                      {row.quarters.map((c) => (
                        <td key={c.quarter} className="border border-ink/20 p-2 text-center font-mono font-normal">
                          {cell(c.transmuted)}
                        </td>
                      ))}
                      <td
                        className={`border border-ink/20 p-2 text-center font-mono font-bold ${
                          failed ? "text-tingub-orange" : "text-tingub-green"
                        }`}
                      >
                        {cell(row.finalGrade)}
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
              <tfoot>
                <tr className="bg-ink/10">
                  <td className="border border-ink/20 p-2 font-bold">General Average</td>
                  {data.quarterlyGeneralAverages.map((ga, idx) => (
                    <td key={idx} className="border border-ink/20 p-2 text-center font-mono font-bold">
                      {ga === null ? "—" : ga.toFixed(2)}
                    </td>
                  ))}
                  <td className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-blue">
                    {data.generalAverage === null ? "—" : data.generalAverage.toFixed(2)}
                  </td>
                  <td className="border border-ink/20 p-2" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div
            className={`rounded-[8px] border p-3 text-sm ${
              awards?.eligible
                ? "border-tingub-green/40 bg-tingub-green/10 text-tingub-green"
                : "border-tingub-gold/40 bg-tingub-gold/15 text-ink"
            }`}
          >
            <strong>Recognition flag:</strong>{" "}
            {awards?.eligible
              ? "Learner is eligible for academic recognition (General Average ≥ 90, no Final Grade below 80, no disciplinary record)."
              : awards && awards.reasons.length > 0
              ? awards.reasons.join(" ")
              : "Not eligible for academic recognition this quarter."}
          </div>
        </div>
      )}
    </Card>
  );
}
