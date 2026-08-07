"use client";

import React, { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, LocalSection, LocalStudent, LocalSubject } from "@/lib/db";
import { SubjectWeight } from "@/lib/gradingEngine";
import { approveSubmissionGroup, rejectSubmissionGroup, SubmissionGroup } from "@/lib/reviewActions";
import { validateRecordFlags, validateWeights, ReviewFlag } from "@/lib/reviewValidation";
import { GradingModeEnum, UserRole } from "@/types/database.types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

interface GroupView extends SubmissionGroup {
  section: LocalSection | undefined;
  subject: LocalSubject | undefined;
  subjectName: string;
  weight: SubjectWeight | undefined;
  weightFlags: ReviewFlag[];
  weightSummary: string;
}

export function MasterTeacherReviewDashboard() {
  const [userRole, setUserRole] = useState<UserRole>("master_teacher");
  const [openRejectKeys, setOpenRejectKeys] = useState<Set<string>>(new Set());
  const [rejectNotes, setRejectNotes] = useState<Record<string, string>>({});

  const records = useLiveQuery(() => db.class_record_grades.toArray(), []);
  const students = useLiveQuery(() => db.students.toArray(), []);
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const sections = useLiveQuery(() => db.sections.toArray(), []);
  const subjectWeightsList = useLiveQuery(() => db.subject_weights.toArray(), []);
  const schoolSettingsList = useLiveQuery(() => db.school_settings.toArray(), []);

  const canReview = userRole === "master_teacher";

  const gradingMode: GradingModeEnum =
    schoolSettingsList && schoolSettingsList.length > 0
      ? schoolSettingsList[0].grading_mode || "adjusted_transmutation"
      : "adjusted_transmutation";

  const rankedLabel =
    gradingMode === "adjusted_transmutation"
      ? "Transmuted Grade"
      : "Final Grade (zero-based)";

  // Group every SUBMITTED class record by section + subject + quarter.
  const groups: GroupView[] = useMemo(() => {
    if (!records || !students || !subjects || !sections) return [];

    const pending = records.filter((r) => r.status === "SUBMITTED");
    const byKey = new Map<string, GroupView>();

    for (const rec of pending) {
      const student = students.find((s) => s.id === rec.student_id);
      const sectionId = student?.section_id || "unassigned";
      const key = `${sectionId}::${rec.subject_id}::${rec.quarter}`;

      let group = byKey.get(key);
      if (!group) {
        const section = sections.find((s) => s.id === sectionId);
        const subject = subjects.find((s) => s.id === rec.subject_id);
        const weight = subjectWeightsList?.find(
          (w) => w.classification === subject?.classification
        );
        const weightValidation = subject
          ? validateWeights(subject.classification, weight)
          : { matches: false };

        group = {
          key,
          sectionId,
          subjectId: rec.subject_id,
          quarter: rec.quarter,
          records: [],
          section,
          subject,
          subjectName: subject?.name || "Unknown subject",
          weight,
          weightFlags: weightValidation.matches ? [] : weightValidation.flag ? [weightValidation.flag] : [],
          weightSummary: weight
            ? `${(weight.written_work_weight * 100).toFixed(0)}% WW / ${(
                weight.performance_task_weight * 100
              ).toFixed(0)}% PT / ${(weight.examination_weight * 100).toFixed(0)}% EX`
            : "No weights configured",
        };
        byKey.set(key, group);
      }
      group.records.push(rec);
    }

    return Array.from(byKey.values()).sort((a, b) => {
      const s = (a.section?.section_name || "").localeCompare(b.section?.section_name || "");
      return s !== 0 ? s : a.subjectName.localeCompare(b.subjectName);
    });
  }, [records, students, subjects, sections, subjectWeightsList]);

  const toggleRejectBox = (key: string) => {
    setOpenRejectKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleApprove = async (group: GroupView) => {
    if (!canReview) return;
    const confirmed = window.confirm(
      `Approve and lock ${group.records.length} record(s) for ${group.section?.section_name} • ${group.subjectName} (Quarter ${group.quarter})?`
    );
    if (!confirmed) return;
    await approveSubmissionGroup(group);
  };

  const handleReject = async (group: GroupView) => {
    if (!canReview) return;
    const notes = (rejectNotes[group.key] || "").trim();
    if (!notes) {
      window.alert(
        "Please write the review notes explaining what needs revision before rejecting the record."
      );
      return;
    }
    const confirmed = window.confirm(
      `Reject and unlock ${group.records.length} record(s) for ${group.section?.section_name} • ${group.subjectName} (Quarter ${group.quarter})? The teacher will see your notes and be able to resubmit.`
    );
    if (!confirmed) return;
    await rejectSubmissionGroup(group, notes);
    setOpenRejectKeys((prev) => {
      const next = new Set(prev);
      next.delete(group.key);
      return next;
    });
    setRejectNotes((prev) => ({ ...prev, [group.key]: "" }));
  };

  return (
    <div className="space-y-6">
      {/* Role access control */}
      <Card
        title="Master Teacher Verification & Approval"
        subtitle="DO 015, s. 2026 compliance check on pending quarterly class record_grades, grouped by section and subject."
      >
        <div className="flex flex-wrap items-center gap-6 text-sm font-normal">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink/70 font-medium">Active User Role:</label>
            <select
              className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-xs font-medium focus:outline-none focus:border-tingub-blue"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              <option value="master_teacher">Master Teacher</option>
              <option value="teacher">Teacher</option>
              <option value="principal">Principal</option>
              <option value="ict_coordinator">ICT Coordinator</option>
            </select>
          </div>
          <div className="ml-auto">
            {canReview ? (
              <Badge status="approved" label="Approval Rights Granted" />
            ) : (
              <Badge status="warning" label="Read-Only (Not Master Teacher)" />
            )}
          </div>
        </div>
        {!canReview && (
          <div className="mt-3 p-3 bg-tingub-orange/15 border border-tingub-orange/30 text-ink text-xs rounded-[8px] font-normal">
            <strong>RLS Security Policy Lock:</strong> Approve and Reject controls are
            available only to the <em>master_teacher</em> role. Switch back to Master Teacher
            to review and sign off submissions.
          </div>
        )}
      </Card>


      {/* Pending submissions summary */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge status="pending" label={`${groups.length} Pending Submission(s)`} />
        <span className="text-xs text-ink/60 font-normal">
          Grouped by section & subject. Each pending row shows the Initial Grade and{" "}
          {rankedLabel.toLowerCase()}.
        </span>
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No pending class record submissions"
          description="There are no class_record_grades with status SUBMITTED waiting for review. Teachers can submit their quarterly records from the grading engine before they appear here."
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
          }
        />
      ) : (
        groups.map((group) => (
          <GroupCard
            key={group.key}
            group={group}
            canReview={canReview}
            rankedLabel={rankedLabel}
            students={students || []}
            isRejectOpen={openRejectKeys.has(group.key)}
            rejectNotes={rejectNotes[group.key] || ""}
            onToggleReject={() => toggleRejectBox(group.key)}
            onNotesChange={(v) =>
              setRejectNotes((prev) => ({ ...prev, [group.key]: v }))
            }
            onApprove={() => handleApprove(group)}
            onReject={() => handleReject(group)}
          />
        ))
      )}
    </div>
  );
}


interface GroupCardProps {
  group: GroupView;
  canReview: boolean;
  rankedLabel: string;
  students: LocalStudent[];
  isRejectOpen: boolean;
  rejectNotes: string;
  onToggleReject: () => void;
  onNotesChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

function GroupCard({
  group,
  canReview,
  rankedLabel,
  students,
  isRejectOpen,
  rejectNotes,
  onToggleReject,
  onNotesChange,
  onApprove,
  onReject,
}: GroupCardProps) {
  const pendingCount = group.records.length;

  return (
    <Card
      title={`${group.subjectName}`}
      subtitle={`${group.section?.section_name || "Unassigned"} (${group.section?.grade_level || "—"}) • Quarter ${group.quarter} • ${pendingCount} student(s)`}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="approved" size="sm" disabled={!canReview} onClick={onApprove}>
            Approve
          </Button>
          <Button variant="warning" size="sm" disabled={!canReview} onClick={onToggleReject}>
            Reject
          </Button>
        </div>
      }
    >
      {/* Weight summary + validation */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-ink/80 font-normal">
        <span className="inline-flex items-center gap-1.5 rounded-[8px] border border-ink/15 bg-ink/5 px-2.5 py-1">
          <span className="font-bold text-tingub-blue uppercase tracking-wide">
            DO 015 Weights:
          </span>{" "}
          {group.weightSummary}
        </span>
        {group.weightFlags.map((flag, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/10 px-2.5 py-1 text-tingub-orange"
            title={flag.detail}
          >
            ⚠ {flag.label}
          </span>
        ))}
      </div>

      {/* Rows table */}
      <div className="overflow-x-auto rounded-[8px] border border-ink/15">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ink/5 text-left text-xs uppercase tracking-wider text-ink/70 font-medium">
              <th className="p-3">Learner</th>
              <th className="p-3 text-center">Initial Grade</th>
              <th className="p-3 text-center">{rankedLabel}</th>
              <th className="p-3 text-center">Review Flags</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {group.records.map((rec) => {
              const student = students.find((s) => s.id === rec.student_id);
              const flags = validateRecordFlags(rec);
              return (
                <tr key={rec.id} className="bg-paper hover:bg-ink/5">
                  <td className="p-3 font-medium text-ink">
                    {student?.full_name || "Unknown learner"}
                  </td>
                  <td className="p-3 text-center font-mono text-ink">
                    {rec.initial_grade !== null && rec.initial_grade !== undefined
                      ? rec.initial_grade.toFixed(2)
                      : "—"}
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-tingub-green">
                    {rec.transmuted_grade !== null && rec.transmuted_grade !== undefined
                      ? groupRankedValue(rec.transmuted_grade, rec.transmuted_grade % 1 !== 0)
                      : "—"}
                  </td>
                  <td className="p-3">
                    {flags.length === 0 ? (
                      <Badge status="approved" label="OK" />
                    ) : (
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {flags.map((flag, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-tingub-orange"
                            title={flag.detail}
                          >
                            ⚠ {flag.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Rejection feedback box */}
      {isRejectOpen && (
        <div className="mt-4 rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/5 p-4">
          <label
            htmlFor={`reject-notes-${group.key}`}
            className="block text-xs font-medium text-ink/70 mb-1"
          >
            Review notes for the teacher (required to reject)
          </label>
          <textarea
            id={`reject-notes-${group.key}`}
            value={rejectNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            placeholder="e.g. Performance Task raw score is missing for a learner. Please complete PT and resubmit."
            className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-xs font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
          />
          <div className="mt-3 flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={onToggleReject}>
              Cancel
            </Button>
            <Button variant="warning" size="sm" disabled={!canReview} onClick={onReject}>
              Reject & unlock
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** Render a ranked value: integer when adjusted_transmutation, else decimal. */
function groupRankedValue(value: number, isDecimal: boolean): string {
  return isDecimal ? value.toFixed(2) : String(value);
}

