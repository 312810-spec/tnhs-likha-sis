"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildSF10,
  getStudents,
  FormStudent,
  FormLearnerResult,
  SCHOOL_NAME,
  SCHOOL_ADDRESS,
  SCHOOL_ID,
  SCHOOL_YEAR,
} from "@/lib/formsData";
import { FormSheetHeader, PrintButton } from "./FormSheet";

const QUARTERS = [1, 2, 3, 4];

/**
 * SF10 — Learner's Permanent Academic Record.
 * Learner profile plus the full quarterly grade history from `class_record_grades`,
 * with the General Average and official signature lines.
 */
export function SF10PermanentRecord() {
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
      buildSF10(studentId).then((res) => {
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
    <Card title="SF10 — Learner's Permanent Record" subtitle="Academic history from students and class_record_grades">
      {select}

      <FormSheetHeader
        formLabel="Learner's Permanent Academic Record (SF10)"
        schoolYear={SCHOOL_YEAR}
      />

      {loading ? (
        <p className="text-sm text-ink/70 font-normal">Loading permanent record...</p>
      ) : !data ? (
        <EmptyState title="No learner selected" description="Select a learner to generate their Permanent Record." />
      ) : (
        <div className="space-y-4">
          <div className="rounded-[8px] border border-ink/15 p-3 text-xs">
            <div className="flex flex-wrap gap-6">
              <span className="font-medium">
                {SCHOOL_NAME} — {SCHOOL_ID} — {SCHOOL_ADDRESS}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="text-ink/70 font-normal">
                Name: <span className="text-ink font-medium">{data.student.full_name}</span>
              </div>
              <div className="text-ink/70 font-normal">
                LRN: <span className="text-ink font-mono">{data.student.lrn}</span>
              </div>
              <div className="text-ink/70 font-normal">
                Sex: <span className="text-ink font-medium">{data.student.sex || "—"}</span>
              </div>
              <div className="text-ink/70 font-normal">
                Date of Birth: <span className="text-ink font-medium">{data.student.birthdate || "—"}</span>
              </div>
              <div className="text-ink/70 font-normal">
                Grade & Section:{" "}
                <span className="text-ink font-medium">
                  {data.student.grade_level}
                  {data.section ? ` - ${data.section.section_name}` : ""}
                </span>
              </div>
              <div className="text-ink/70 font-normal">
                School Year: <span className="text-ink font-medium">{SCHOOL_YEAR}</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-tingub-blue text-paper">
                  <th className="border border-ink/20 p-2 text-left font-bold">Learning Area</th>
                  {QUARTERS.map((q) => (
                    <th key={q} className="border border-ink/20 p-2 text-center font-bold">Quarter {q}</th>
                  ))}
                  <th className="border border-ink/20 p-2 text-center font-bold">Final Grade</th>
                  <th className="border border-ink/20 p-2 text-center font-bold">Remarks</th>
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
                  <td colSpan={4} className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-blue">
                    {data.generalAverage === null ? "—" : data.generalAverage.toFixed(2)}
                  </td>
                  <td className="border border-ink/20 p-2" />
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
            <div>
              <div className="font-normal text-ink/70">Recorded by (Adviser)</div>
              <div className="mt-10 border-t border-ink/40 pt-1 font-medium">Signature over Printed Name</div>
            </div>
            <div>
              <div className="font-normal text-ink/70">Certified by (School Head)</div>
              <div className="mt-10 border-t border-ink/40 pt-1 font-medium">Signature over Printed Name</div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
