"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { buildSF6, SCHOOL_YEAR } from "@/lib/formsData";
import { FormSheetHeader, PrintButton } from "./FormSheet";

type Sf6Data = Awaited<ReturnType<typeof buildSF6>>;

/**
 * SF6 — Summarized Promotion Report.
 * A school-wide roll-up of every SF5: for each subject, count learners promoted,
 * failed/retained, and those eligible to be recognized (final grade >= 80) per
 * section, with a school total.
 */
export function SF6SummarizedPromotionReport() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Sf6Data | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      buildSF6().then((res) => {
        if (!active) return;
        setData(res);
        setLoading(false);
      });
    }, 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, []);

  return (
    <Card title="SF6 — Summarized Promotion Report" subtitle="School-wide roll-up of SF5 per subject and section">
      <div className="print:hidden pb-4">
        <PrintButton />
      </div>

      <FormSheetHeader
        formLabel="Summarized Report on Promotion (SF6)"
        schoolYear={SCHOOL_YEAR}
      />

      {loading ? (
        <p className="text-sm text-ink/70 font-normal">Loading summarized promotion report...</p>
      ) : !data || data.subjectGroups.length === 0 ? (
        <EmptyState
          title="No promotion data to summarize"
          description="Generate SF5 class records first. SF6 rolls those up across the whole school."
        />
      ) : (
        <div className="space-y-6">
          {data.subjectGroups.map((group) => {
            let schoolTotal = 0;
            let schoolPromoted = 0;
            let schoolFailed = 0;
            let schoolEligible = 0;

            return (
              <div key={group.subject.id}>
                <h3 className="text-sm font-bold text-ink mb-2">
                  {group.subject.name}
                </h3>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-tingub-blue text-paper">
                      <th className="border border-ink/20 p-2 text-left font-bold">Section</th>
                      <th className="border border-ink/20 p-2 text-center font-bold">Enrollees</th>
                      <th className="border border-ink/20 p-2 text-center font-bold">Promoted</th>
                      <th className="border border-ink/20 p-2 text-center font-bold">Failed / Retained</th>
                      <th className="border border-ink/20 p-2 text-center font-bold">Eligible for Recognition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.sections.map((sec) => {
                      const total = sec.rows.length;
                      const promoted = sec.rows.filter((r) => (r.finalGrade ?? 0) >= 75).length;
                      const failed = total - promoted;
                      const eligible = sec.rows.filter((r) => (r.finalGrade ?? 0) >= 80).length;

                      schoolTotal += total;
                      schoolPromoted += promoted;
                      schoolFailed += failed;
                      schoolEligible += eligible;

                      return (
                        <tr key={sec.section.id} className="odd:bg-paper even:bg-ink/5">
                          <td className="border border-ink/20 p-2 font-medium">
                            {sec.section.grade_level} - {sec.section.section_name}
                          </td>
                          <td className="border border-ink/20 p-2 text-center font-normal">{total}</td>
                          <td className="border border-ink/20 p-2 text-center font-bold text-tingub-green">{promoted}</td>
                          <td className="border border-ink/20 p-2 text-center font-bold text-tingub-orange">{failed}</td>
                          <td className="border border-ink/20 p-2 text-center font-normal text-tingub-blue">{eligible}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-ink/10 font-bold">
                      <td className="border border-ink/20 p-2">School total</td>
                      <td className="border border-ink/20 p-2 text-center">{schoolTotal}</td>
                      <td className="border border-ink/20 p-2 text-center text-tingub-green">{schoolPromoted}</td>
                      <td className="border border-ink/20 p-2 text-center text-tingub-orange">{schoolFailed}</td>
                      <td className="border border-ink/20 p-2 text-center text-tingub-blue">{schoolEligible}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
