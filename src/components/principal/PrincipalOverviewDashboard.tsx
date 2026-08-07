"use client";

import React, { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalSection } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Principal Overview Dashboard (READ ONLY).
 *
 * Executive oversight view for the school head:
 *   1. Total enrolled learners by grade and section.
 *   2. A grade distribution chart of the Transmuted Grade from
 *      `class_record_grades` (DO 015, s. 2026 official grade).
 *   3. A live count of class-record rows still pending master_teacher approval.
 *
 * Data is sourced from the offline-first Dexie store via live queries so the
 * view always reflects the freshest local state (same pattern as the Master
 * Teacher Review dashboard). No mutation controls are rendered here.
 */

/** Transmuted Grade buckets used for the distribution chart. */
const GRADE_BUCKETS: {
  label: string;
  barClass: string;
  test: (grade: number) => boolean;
}[] = [
  { label: "90 – 100 (Outstanding)", barClass: "bg-tingub-green", test: (g) => g >= 90 && g <= 100 },
  { label: "85 – 89 (Very Satisfactory)", barClass: "bg-tingub-blue", test: (g) => g >= 85 && g < 90 },
  { label: "80 – 84 (Satisfactory)", barClass: "bg-tingub-gold", test: (g) => g >= 80 && g < 85 },
  { label: "75 – 79 (Fairly Satisfactory)", barClass: "bg-tingub-orange", test: (g) => g >= 75 && g < 80 },
  { label: "Below 75 (Did Not Meet Expectations)", barClass: "bg-ink", test: (g) => g < 75 },
];

interface SectionRollup {
  section: LocalSection;
  enrolled: number;
}

export function PrincipalOverviewDashboard() {
  const students = useLiveQuery(() => db.students.toArray(), []);
  const sections = useLiveQuery(() => db.sections.toArray(), []);
  const grades = useLiveQuery(() => db.class_record_grades.toArray(), []);

  // 1) Learners grouped into their grade + section.
  const sectionRollups: SectionRollup[] = useMemo(() => {
    if (!students || !sections) return [];
    return sections
      .map((section) => ({
        section,
        enrolled: students.filter(
          (s) => s.section_id === section.id && s.grade_level === section.grade_level
        ).length,
      }))
      .sort((a, b) => {
        const gradeRank = (g: string) => parseInt(g.replace(/\D/g, ""), 10) || 0;
        const byGrade = gradeRank(a.section.grade_level) - gradeRank(b.section.grade_level);
        if (byGrade !== 0) return byGrade;
        return a.section.section_name.localeCompare(b.section.section_name);
      });
  }, [students, sections]);

  const totalEnrolled = useMemo(
    () => sectionRollups.reduce((sum, r) => sum + r.enrolled, 0),
    [sectionRollups]
  );

  // 2) Grade distribution from Transmuted Grade across all class records.
  const distribution = useMemo(() => {
    if (!grades) return [];
    const values = grades
      .map((g) => g.transmuted_grade)
      .filter((v): v is number => v !== null && v !== undefined);
    const total = values.length;
    return GRADE_BUCKETS.map((bucket) => ({
      label: bucket.label,
      barClass: bucket.barClass,
      count: values.filter(bucket.test).length,
      percent: total === 0 ? 0 : Math.round((values.filter(bucket.test).length / total) * 100),
    }));
  }, [grades]);

  // 3) Rows still pending master_teacher approval (awaiting Review pipeline).
  const pendingApproval = useMemo(
    () => (grades ? grades.filter((g) => g.status === "SUBMITTED").length : 0),
    [grades]
  );

  const loading = !students || !sections || !grades;
  const maxDistribution = Math.max(1, ...distribution.map((d) => d.count));

  return (
    <div className="space-y-4">
      {/* Top stat strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card title="Total Enrolled Learners" subtitle="Across all grade levels">
          <p className="text-3xl font-bold text-tingub-blue">{loading ? "—" : totalEnrolled}</p>
        </Card>
        <Card title="Pending Master Teacher Approval" subtitle="Class record rows with status SUBMITTED">
          <div className="flex items-center gap-3">
            <p className="text-3xl font-bold text-tingub-gold">{loading ? "—" : pendingApproval}</p>
            <Badge status={pendingApproval === 0 ? "approved" : "pending"} label={pendingApproval === 0 ? "All reviewed" : "Awaiting review"} />
          </div>
        </Card>
        <Card title="Recorded Transmuted Grades" subtitle="Rows with an official grade in class_record_grades">
          <p className="text-3xl font-bold text-tingub-green">
            {loading ? "—" : distribution.reduce((sum, d) => sum + d.count, 0)}
          </p>
        </Card>
      </div>

      {/* 1) Enrolled learners by grade and section */}
      <Card
        title="Enrolled Learners by Grade and Section"
        subtitle="Read-only enrollment roster roll-up for SY 2026–2027"
        action={totalEnrolled > 0 ? <Badge status="approved" label={`${totalEnrolled} enrolled`} /> : undefined}
      >
        {loading ? (
          <p className="text-sm text-ink/70 font-normal">Loading learner records...</p>
        ) : sectionRollups.length === 0 ? (
          <EmptyState
            title="No class sections found"
            description="No sections are configured yet. Add sections under the enrollment module before the principal overview can roll up enrollments."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-left">
                  <th className="p-3 font-bold text-ink">Grade Level</th>
                  <th className="p-3 font-bold text-ink">Section</th>
                  <th className="p-3 text-right font-bold text-ink">Enrolled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {sectionRollups.map((rollup) => (
                  <tr key={rollup.section.id} className="hover:bg-ink/5">
                    <td className="p-3 font-medium text-ink">{rollup.section.grade_level}</td>
                    <td className="p-3 text-ink">{rollup.section.section_name}</td>
                    <td className="p-3 text-right font-mono font-bold text-tingub-blue">
                      {rollup.enrolled}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {/* 2) Grade distribution chart */}
      <Card
        title="Transmuted Grade Distribution"
        subtitle="Official DO 015, s. 2026 Transmuted Grade spread across all class records"
      >
        {loading ? (
          <p className="text-sm text-ink/70 font-normal">Loading grades...</p>
        ) : distribution.every((d) => d.count === 0) ? (
          <EmptyState
            title="No transmuted grades recorded yet"
            description="No class records carry an official Transmuted Grade. Subject teachers must submit and master teachers approve quarterly records before the distribution chart populates."
          />
        ) : (
          <div className="space-y-3">
            {distribution.map((bucket) => (
              <div key={bucket.label}>
                <div className="flex items-center justify-between text-xs font-medium text-ink mb-1">
                  <span>{bucket.label}</span>
                  <span className="font-mono">
                    {bucket.count} · {bucket.percent}%
                  </span>
                </div>
                <div className="h-4 w-full rounded-[8px] bg-ink/5 border border-ink/10">
                  <div
                    className={`h-full rounded-[8px] ${bucket.barClass} transition-all`}
                    style={{ width: `${(bucket.count / maxDistribution) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <p className="text-xs text-ink/60 font-normal pt-1">
              Bar widths are relative to the largest bucket. Percentages are of all recorded
              Transmuted Grades. (Total recorded grades:{" "}
              {distribution.reduce((sum, d) => sum + d.count, 0)})
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}


