"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  buildSF1,
  getSections,
  FormSection,
  FormStudent,
  SCHOOL_YEAR,
} from "@/lib/formsData";
import { FormSheetHeader, PrintButton } from "./FormSheet";

/**
 * SF1 — School Register.
 * One row per learner in the selected section (LRN, name, sex, birthdate, address),
 * generated directly from `students` + `sections`.
 */
export function SF1SchoolRegister() {
  const [sections, setSections] = useState<FormSection[]>([]);
  const [sectionId, setSectionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    section?: FormSection;
    students: FormStudent[];
    classCount: number;
    male: number;
    female: number;
  } | null>(null);

  useEffect(() => {
    let active = true;
    getSections().then((list) => {
      if (!active) return;
      setSections(list);
      if (list.length > 0 && !sectionId) setSectionId(list[0].id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!sectionId) return;
    let active = true;
    // Defer so setState is not called synchronously in the effect body
    // (matches the anecdotal-records module convention for this rule).
    const timer = setTimeout(() => {
      setLoading(true);
      buildSF1(sectionId).then((res) => {
        if (!active) return;
        setData(res);
        setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [sectionId]);

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
      <PrintButton />
    </div>
  );

  return (
    <Card title="SF1 — School Register" subtitle="Generated from students and sections">
      {select}

      <FormSheetHeader formLabel="School Register (SF1)" schoolYear={SCHOOL_YEAR} />

      {loading ? (
        <p className="text-sm text-ink/70 font-normal">Loading school register...</p>
      ) : !data || data.students.length === 0 ? (
        <EmptyState
          title="No learners in this section"
          description="Add learners to this section before generating the School Register."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-tingub-blue text-paper">
                <th className="border border-ink/20 p-2 text-left font-bold w-8">No.</th>
                <th className="border border-ink/20 p-2 text-left font-bold">LRN</th>
                <th className="border border-ink/20 p-2 text-left font-bold">Learner Name</th>
                <th className="border border-ink/20 p-2 text-center font-bold">Sex</th>
                <th className="border border-ink/20 p-2 text-left font-bold">Date of Birth</th>
                <th className="border border-ink/20 p-2 text-left font-bold">Home Address</th>
              </tr>
            </thead>
            <tbody>
              {data.students.map((s, i) => (
                <tr key={s.id} className="odd:bg-paper even:bg-ink/5">
                  <td className="border border-ink/20 p-2 text-center font-normal">{i + 1}</td>
                  <td className="border border-ink/20 p-2 font-mono font-normal">{s.lrn}</td>
                  <td className="border border-ink/20 p-2 font-medium">{s.full_name}</td>
                  <td className="border border-ink/20 p-2 text-center font-normal">{s.sex || "—"}</td>
                  <td className="border border-ink/20 p-2 font-normal">{s.birthdate || "—"}</td>
                  <td className="border border-ink/20 p-2 font-normal">{s.address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-3 flex flex-wrap gap-6 text-xs text-ink/80 font-normal">
            <span>
              Total: <strong>{data.classCount}</strong>
            </span>
            <span>
              Male: <strong>{data.male}</strong>
            </span>
            <span>
              Female: <strong>{data.female}</strong>
            </span>
          </div>
        </div>
      )}
    </Card>
  );
}
