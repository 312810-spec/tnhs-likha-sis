"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, initializeDexieDefaults, LocalClassRecordGrade, LocalStudent } from "@/lib/db";
import { computeFullGradeRecord, SubjectWeight } from "@/lib/gradingEngine";
import { saveGradeRecordOffline, processSyncQueue, initOnlineSyncListener } from "@/lib/syncQueue";
import { GradingModeEnum, GradeStatusEnum, UserRole } from "@/types/database.types";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface StudentScoreRow {
  student: LocalStudent;
  gradeRecordId: string;
  written_work_raw: number;
  written_work_highest: number;
  performance_task_raw: number;
  performance_task_highest: number;
  st1_raw: number;
  st1_highest: number;
  st2_raw: number;
  st2_highest: number;
  te_raw: number;
  te_highest: number;
  synced: 0 | 1;
}

export function GradingEngineUI() {
  // Database Live Queries
  const subjects = useLiveQuery(() => db.subjects.toArray(), []);
  const sections = useLiveQuery(() => db.sections.toArray(), []);
  const students = useLiveQuery(() => db.students.toArray(), []);
  const subjectWeightsList = useLiveQuery(() => db.subject_weights.toArray(), []);
  const transmutationTable = useLiveQuery(() => db.transmutation_table.toArray(), []);
  const schoolSettingsList = useLiveQuery(() => db.school_settings.toArray(), []);
  const syncQueue = useLiveQuery(() => db.sync_queue.toArray(), []);

  // UI Selection States
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [quarter, setQuarter] = useState<number>(1);

  const activeSectionId = selectedSectionId || (sections && sections.length > 0 ? sections[0].id : "");
  const activeSubjectId = selectedSubjectId || (subjects && subjects.length > 0 ? subjects[0].id : "");

  // Active User / RLS Simulation States
  const [userRole, setUserRole] = useState<UserRole>("teacher");
  const [isAssignedTeacher, setIsAssignedTeacher] = useState<boolean>(true);

  // Online & Sync States
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  // Local Editable Table Scores
  const [scoresMap, setScoresMap] = useState<Record<string, StudentScoreRow>>({});
  const [isSavedNotice, setIsSavedNotice] = useState<boolean>(false);

  // Current submission lifecycle status for the selected group (locks row edits)
  const [groupStatus, setGroupStatus] = useState<GradeStatusEnum>("DRAFT");
  const [reviewNotes, setReviewNotes] = useState<string>("");

  // Initialize Dexie defaults and connectivity listeners
  useEffect(() => {
    initializeDexieDefaults();

    const cleanupSync = initOnlineSyncListener();

    const handleOnlineStatus = () => setIsOnline(true);
    const handleOfflineStatus = () => setIsOnline(false);

    window.addEventListener("online", handleOnlineStatus);
    window.addEventListener("offline", handleOfflineStatus);

    return () => {
      if (cleanupSync) cleanupSync();
      window.removeEventListener("online", handleOnlineStatus);
      window.removeEventListener("offline", handleOfflineStatus);
    };
  }, []);

  // Derived current Subject & Weight
  const currentSubject = subjects?.find((s) => s.id === activeSubjectId);
  const currentSubjectWeight: SubjectWeight = subjectWeightsList?.find(
    (w) => w.classification === currentSubject?.classification
  ) || {
    classification: currentSubject?.classification || "jhs_core",
    written_work_weight: 0.20,
    performance_task_weight: 0.50,
    examination_weight: 0.30,
  };

  // Current School Grading Mode
  const currentSchoolSetting = schoolSettingsList && schoolSettingsList.length > 0 ? schoolSettingsList[0] : null;
  const gradingMode: GradingModeEnum = currentSchoolSetting?.grading_mode || "adjusted_transmutation";

  // Filter students for current selected section
  const sectionStudents = React.useMemo(() => {
    return students?.filter((s) => s.section_id === activeSectionId) || [];
  }, [students, activeSectionId]);

  // Load existing grade records from Dexie whenever section, subject, or quarter changes
  const loadExistingGrades = useCallback(async () => {
    if (!activeSectionId || !activeSubjectId) return;

    const existingRecords = await db.class_record_grades
      .where("subject_id")
      .equals(activeSubjectId)
      .filter((r) => r.quarter === quarter)
      .toArray();

    const recordByStudentId = new Map(existingRecords.map((r) => [r.student_id, r]));

    // Track the lifecycle status of this submission group (locks/unlocks editing)
    const firstRecord = existingRecords[0];
    setGroupStatus(firstRecord?.status ?? "DRAFT");
    setReviewNotes(firstRecord?.review_notes ?? "");

    const newScoresMap: Record<string, StudentScoreRow> = {};

    const activeStudents = students?.filter((s) => s.section_id === activeSectionId) || [];

    activeStudents.forEach((std) => {
      const existing = recordByStudentId.get(std.id);
      newScoresMap[std.id] = {
        student: std,
        gradeRecordId: existing?.id || `rec-${std.id}-${activeSubjectId}-Q${quarter}`,
        written_work_raw: existing?.written_work_raw ?? 85,
        written_work_highest: existing?.written_work_highest ?? 100,
        performance_task_raw: existing?.performance_task_raw ?? 88,
        performance_task_highest: existing?.performance_task_highest ?? 100,
        st1_raw: existing?.st1_raw ?? 42,
        st1_highest: existing?.st1_highest ?? 50,
        st2_raw: existing?.st2_raw ?? 45,
        st2_highest: existing?.st2_highest ?? 50,
        te_raw: existing?.te_raw ?? 80,
        te_highest: existing?.te_highest ?? 100,
        synced: existing?.synced ?? 0,
      };
    });

    setScoresMap(newScoresMap);
  }, [activeSectionId, activeSubjectId, quarter, students]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadExistingGrades();
      }
    });
    return () => {
      active = false;
    };
  }, [loadExistingGrades]);

  // Handle Score Input Change
  const handleScoreChange = (
    studentId: string,
    field: keyof Omit<StudentScoreRow, "student" | "gradeRecordId" | "synced">,
    value: number
  ) => {
    const numericVal = isNaN(value) ? 0 : Math.max(0, value);
    setScoresMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: numericVal,
      },
    }));
  };

  // Toggle Grading Mode in Dexie
  const handleToggleGradingMode = async () => {
    const newMode: GradingModeEnum =
      gradingMode === "adjusted_transmutation" ? "zero_based" : "adjusted_transmutation";

    if (currentSchoolSetting?.id) {
      await db.school_settings.update(currentSchoolSetting.id, {
        grading_mode: newMode,
        updated_at: new Date().toISOString(),
      });
    } else {
      await db.school_settings.add({
        id: "default-settings-id",
        grading_mode: newMode,
        updated_at: new Date().toISOString(),
      });
    }
  };

  // Save all current table grades into Dexie.js (Offline first) & enqueue sync
  const handleSaveChanges = async () => {
    if (!isAssignedTeacher || userRole !== "teacher") {
      alert("Permission Denied: Grades entered here are writable only by the teacher assigned to this subject and section.");
      return;
    }

    try {
      setIsSavedNotice(false);

      for (const row of Object.values(scoresMap)) {
        const computed = computeFullGradeRecord(
          {
            written_work_raw: row.written_work_raw,
            written_work_highest: row.written_work_highest,
            performance_task_raw: row.performance_task_raw,
            performance_task_highest: row.performance_task_highest,
            st1_raw: row.st1_raw,
            st1_highest: row.st1_highest,
            st2_raw: row.st2_raw,
            st2_highest: row.st2_highest,
            te_raw: row.te_raw,
            te_highest: row.te_highest,
          },
          currentSubjectWeight,
          gradingMode,
          transmutationTable || []
        );

        const gradeRecord: LocalClassRecordGrade = {
          id: row.gradeRecordId,
          student_id: row.student.id,
          subject_id: selectedSubjectId,
          quarter: quarter,
          written_work_raw: row.written_work_raw,
          written_work_highest: row.written_work_highest,
          performance_task_raw: row.performance_task_raw,
          performance_task_highest: row.performance_task_highest,
          st1_raw: row.st1_raw,
          st1_highest: row.st1_highest,
          st2_raw: row.st2_raw,
          st2_highest: row.st2_highest,
          te_raw: row.te_raw,
          te_highest: row.te_highest,
          initial_grade: computed.initialGrade,
          transmuted_grade: computed.transmutedGrade,
          status: "DRAFT",
          updated_at: new Date().toISOString(),
          synced: 0,
        };

        await saveGradeRecordOffline(gradeRecord);
      }

      setIsSavedNotice(true);
      await loadExistingGrades();
      setTimeout(() => setIsSavedNotice(false), 4000);
    } catch (err) {
      console.error("Error saving grades offline:", err);
      alert("Failed to save grades locally.");
    }
  };

  // Submit the current group for Master Teacher review (status -> SUBMITTED)
  const handleSubmitForReview = async () => {
    if (!canEdit) return;

    try {
      for (const row of Object.values(scoresMap)) {
        const computed = computeFullGradeRecord(
          {
            written_work_raw: row.written_work_raw,
            written_work_highest: row.written_work_highest,
            performance_task_raw: row.performance_task_raw,
            performance_task_highest: row.performance_task_highest,
            st1_raw: row.st1_raw,
            st1_highest: row.st1_highest,
            st2_raw: row.st2_raw,
            st2_highest: row.st2_highest,
            te_raw: row.te_raw,
            te_highest: row.te_highest,
          },
          currentSubjectWeight,
          gradingMode,
          transmutationTable || []
        );

        const gradeRecord: LocalClassRecordGrade = {
          id: row.gradeRecordId,
          student_id: row.student.id,
          subject_id: selectedSubjectId,
          quarter: quarter,
          written_work_raw: row.written_work_raw,
          written_work_highest: row.written_work_highest,
          performance_task_raw: row.performance_task_raw,
          performance_task_highest: row.performance_task_highest,
          st1_raw: row.st1_raw,
          st1_highest: row.st1_highest,
          st2_raw: row.st2_raw,
          st2_highest: row.st2_highest,
          te_raw: row.te_raw,
          te_highest: row.te_highest,
          initial_grade: computed.initialGrade,
          transmuted_grade: computed.transmutedGrade,
          status: "SUBMITTED",
          review_notes: null,
          updated_at: new Date().toISOString(),
          synced: 0,
        };

        await saveGradeRecordOffline(gradeRecord);
      }

      await loadExistingGrades();
      setGroupStatus("SUBMITTED");
      alert("Class record submitted for Master Teacher review.");
    } catch (err) {
      console.error("Error submitting record for review:", err);
      alert("Failed to submit the record for review.");
    }
  };

  // Manual Push Sync Queue Button Handler
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await processSyncQueue();
      setSyncFeedback(
        `Sync execution complete: ${res.succeeded} items synced successfully, ${res.failed} failed.`
      );
      await loadExistingGrades();
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      setSyncFeedback(`Sync error: ${errorObj?.message || String(err)}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncFeedback(null), 5000);
    }
  };

  // Count pending sync items
  const pendingSyncCount = syncQueue?.filter((q) => q.status === "PENDING" || q.status === "FAILED").length || 0;

  // RLS Check logic: teacher may only edit while the record is DRAFT or
  // returned for revision (NEEDS_REVISION). SUBMITTED, MT_APPROVED, and LOCKED
  // freeze the row from teacher edits.
  const lockMessage = (() => {
    switch (groupStatus) {
      case "MT_APPROVED":
        return "Master Teacher approved this record — locked from teacher edits.";
      case "SUBMITTED":
        return "This record is SUBMITTED and awaiting Master Teacher review.";
      case "LOCKED":
        return "This record has been finally locked by the ICT Coordinator.";
      default:
        return null;
    }
  })();

  const canEdit =
    userRole === "teacher" &&
    isAssignedTeacher &&
    (groupStatus === "DRAFT" || groupStatus === "NEEDS_REVISION");

  return (
    <div className="space-y-6">
      {/* Top Banner: Connection & Sync Queue Controls */}
      <div className="bg-paper border border-ink/15 rounded-[8px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Connectivity Status Badge */}
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full ${
                isOnline ? "bg-tingub-green" : "bg-tingub-orange animate-pulse"
              }`}
            />
            <span className="font-bold text-sm text-ink">
              {isOnline ? "Online Mode (Connected)" : "Offline Mode (IndexedDB Active)"}
            </span>
          </div>

          {/* Sync Queue Count Badge */}
          <Badge
            status={pendingSyncCount > 0 ? "pending" : "approved"}
            label={`${pendingSyncCount} Pending Sync Queue Items`}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            disabled={!isOnline || isSyncing || pendingSyncCount === 0}
            onClick={handleManualSync}
          >
            {isSyncing ? "Syncing to Supabase..." : "Sync now"}
          </Button>
        </div>
      </div>

      {syncFeedback && (
        <div className="p-3 bg-tingub-blue/10 border border-tingub-blue/30 text-tingub-blue rounded-[8px] text-xs font-normal">
          {syncFeedback}
        </div>
      )}

      {/* RLS & Teacher Role Access Control Card */}
      <Card
        title="Teacher Authorization & RLS Assignment Controls"
        subtitle="Prompt 2 & DO 015 RLS Rule: Grades entered here are writable ONLY by the assigned teacher for this subject and section."
      >
        <div className="flex flex-wrap items-center gap-6 text-sm font-normal">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink/70 font-medium">Active User Role:</label>
            <select
              className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-xs font-medium focus:outline-none focus:border-tingub-blue"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              <option value="teacher">Teacher</option>
              <option value="master_teacher">Master Teacher</option>
              <option value="principal">Principal</option>
              <option value="ict_coordinator">ICT Coordinator</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-ink/70 font-medium">Section Assignment Status:</label>
            <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
              <input
                type="radio"
                name="teacherAssignment"
                checked={isAssignedTeacher}
                onChange={() => setIsAssignedTeacher(true)}
                className="accent-tingub-blue"
              />
              Assigned Subject Teacher
            </label>
            <label className="flex items-center gap-1.5 text-xs text-ink cursor-pointer">
              <input
                type="radio"
                name="teacherAssignment"
                checked={!isAssignedTeacher}
                onChange={() => setIsAssignedTeacher(false)}
                className="accent-tingub-orange"
              />
              Unassigned / Non-Assigned Teacher
            </label>
          </div>

          <div className="ml-auto">
            {canEdit ? (
              <Badge status="approved" label="Writable Access Granted" />
            ) : (
              <Badge status="warning" label="Read-Only (RLS Protected)" />
            )}
          </div>
        </div>

        {!canEdit && (
          <div className="mt-3 p-3 bg-tingub-orange/15 border border-tingub-orange/30 text-ink text-xs rounded-[8px] font-normal">
            <strong>RLS Security Policy Lock:</strong> Current user is not the authorized teacher assigned to this section. All grade input fields are locked in read-only mode to prevent unauthorized modifications.
          </div>
        )}
      </Card>

      {/* Main E-Class Record Table & Settings Card */}
      <Card
        title="DepEd DO 015, s. 2026 E-Class Record Engine"
        subtitle="Automatic computation of Written Works %, Performance Tasks %, Examinations % (ST1, ST2, TE), Initial Grade, and Transmuted Grade."
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge
              status={
                groupStatus === "MT_APPROVED"
                  ? "approved"
                  : groupStatus === "SUBMITTED"
                  ? "pending"
                  : groupStatus === "NEEDS_REVISION"
                  ? "warning"
                  : "disabled"
              }
              label={groupStatus === "DRAFT" ? "Draft" : groupStatus.replace(/_/g, " ")}
            />
            <Button variant="secondary" onClick={handleSubmitForReview} disabled={!canEdit}>
              Submit for review
            </Button>
            <Button variant="approved" onClick={handleSaveChanges} disabled={!canEdit}>
              Save changes
            </Button>
          </div>
        }
      >
        {lockMessage && (
          <div className="mb-4 p-3 bg-tingub-orange/15 border border-tingub-orange/30 text-ink text-xs rounded-[8px] font-normal">
            <strong>Record Locked:</strong> {lockMessage}
          </div>
        )}
        {groupStatus === "NEEDS_REVISION" && reviewNotes && (
          <div className="mb-4 p-3 bg-tingub-gold/15 border border-tingub-gold/40 text-ink text-xs rounded-[8px] font-normal">
            <strong>Master Teacher review notes (needs revision):</strong> {reviewNotes}
          </div>
        )}
        {/* Filters Header Row */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-ink/5 p-4 rounded-[8px] border border-ink/10">
            {/* Section Selection */}
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">Section</label>
              <select
                className="w-full px-3 py-2 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
              >
                {sections?.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.section_name} ({sec.grade_level})
                  </option>
                ))}
              </select>
            </div>

            {/* Subject Selection */}
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">Subject & Classification</label>
              <select
                className="w-full px-3 py-2 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
              >
                {subjects?.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quarter Selection */}
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">Grading Quarter</label>
              <select
                className="w-full px-3 py-2 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
                value={quarter}
                onChange={(e) => setQuarter(Number(e.target.value))}
              >
                <option value={1}>Quarter 1</option>
                <option value={2}>Quarter 2</option>
                <option value={3}>Quarter 3</option>
                <option value={4}>Quarter 4</option>
              </select>
            </div>

            {/* Grading Mode Toggle Card */}
            <div>
              <label className="block text-xs font-medium text-ink/70 mb-1">school_settings.grading_mode</label>
              <button
                type="button"
                onClick={handleToggleGradingMode}
                className="w-full px-3 py-2 border border-ink/20 rounded-[8px] bg-paper text-left text-xs font-medium flex items-center justify-between hover:bg-ink/5 transition-colors"
              >
                <div>
                  <span className="block font-bold text-tingub-blue">
                    {gradingMode === "adjusted_transmutation" ? "adjusted_transmutation" : "zero_based"}
                  </span>
                  <span className="text-[10px] text-ink/60 font-normal">
                    {gradingMode === "adjusted_transmutation" ? "40-row DepEd lookup" : "Unrounded Initial Grade"}
                  </span>
                </div>
                <span className="text-[10px] underline text-ink/70 font-medium">Switch</span>
              </button>
            </div>
          </div>

          {/* Active Weights Summary Pill */}
          <div className="p-3 bg-tingub-blue/5 border border-tingub-blue/20 rounded-[8px] flex flex-wrap items-center justify-between text-xs text-ink">
            <div>
              <span className="font-bold text-tingub-blue uppercase tracking-wide">
                DO 015 Weights for [{currentSubject?.classification}]:
              </span>{" "}
              Written Works: <strong>{(currentSubjectWeight.written_work_weight * 100).toFixed(0)}%</strong> • Performance Tasks: <strong>{(currentSubjectWeight.performance_task_weight * 100).toFixed(0)}%</strong> • Examinations: <strong>{(currentSubjectWeight.examination_weight * 100).toFixed(0)}%</strong>
            </div>

            {isSavedNotice && (
              <span className="font-bold text-tingub-green flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Changes saved to Dexie.js!
              </span>
            )}
          </div>

          {/* Interactive Roster & Grade Input Table */}
          <div className="overflow-x-auto border border-ink/15 rounded-[8px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-ink/10 text-ink font-bold border-b border-ink/15">
                  <th className="p-2.5 min-w-[160px] border-r border-ink/15">Student Name & LRN</th>
                  <th className="p-2.5 text-center border-r border-ink/15 bg-tingub-blue/5" colSpan={2}>
                    Written Works (WW) [{(currentSubjectWeight.written_work_weight * 100).toFixed(0)}%]
                  </th>
                  <th className="p-2.5 text-center border-r border-ink/15 bg-tingub-blue/5" colSpan={2}>
                    Performance Tasks (PT) [{(currentSubjectWeight.performance_task_weight * 100).toFixed(0)}%]
                  </th>
                  <th className="p-2.5 text-center border-r border-ink/15 bg-tingub-blue/5" colSpan={6}>
                    Examinations (EX) [{(currentSubjectWeight.examination_weight * 100).toFixed(0)}%]
                  </th>
                  <th className="p-2.5 text-center border-r border-ink/15 bg-tingub-gold/10">Initial Grade</th>
                  <th className="p-2.5 text-center border-r border-ink/15 bg-tingub-green/10">Transmuted Grade</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
                <tr className="bg-ink/5 text-ink/70 text-[11px] font-medium border-b border-ink/15 text-center">
                  <th className="p-1.5 border-r border-ink/15"></th>
                  {/* WW */}
                  <th className="p-1.5 border-r border-ink/15">Raw</th>
                  <th className="p-1.5 border-r border-ink/15">Highest</th>
                  {/* PT */}
                  <th className="p-1.5 border-r border-ink/15">Raw</th>
                  <th className="p-1.5 border-r border-ink/15">Highest</th>
                  {/* EX */}
                  <th className="p-1.5 border-r border-ink/10">ST1 Raw</th>
                  <th className="p-1.5 border-r border-ink/10">ST1 Max</th>
                  <th className="p-1.5 border-r border-ink/10">ST2 Raw</th>
                  <th className="p-1.5 border-r border-ink/10">ST2 Max</th>
                  <th className="p-1.5 border-r border-ink/10">TE Raw</th>
                  <th className="p-1.5 border-r border-ink/15">TE Max</th>
                  {/* Calculated */}
                  <th className="p-1.5 border-r border-ink/15">Weighted</th>
                  <th className="p-1.5 border-r border-ink/15">Final</th>
                  <th className="p-1.5">Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/15 font-normal">
                {sectionStudents.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-8 text-center text-ink/60">
                      No enrolled students found for this section.
                    </td>
                  </tr>
                ) : (
                  sectionStudents.map((student) => {
                    const row = scoresMap[student.id];
                    if (!row) return null;

                    const computed = computeFullGradeRecord(
                      {
                        written_work_raw: row.written_work_raw,
                        written_work_highest: row.written_work_highest,
                        performance_task_raw: row.performance_task_raw,
                        performance_task_highest: row.performance_task_highest,
                        st1_raw: row.st1_raw,
                        st1_highest: row.st1_highest,
                        st2_raw: row.st2_raw,
                        st2_highest: row.st2_highest,
                        te_raw: row.te_raw,
                        te_highest: row.te_highest,
                      },
                      currentSubjectWeight,
                      gradingMode,
                      transmutationTable || []
                    );

                    return (
                      <tr key={student.id} className="hover:bg-ink/5 transition-colors">
                        {/* Student Details */}
                        <td className="p-2.5 border-r border-ink/15 font-medium">
                          <div className="font-bold text-ink">{student.full_name}</div>
                          <div className="text-[10px] text-ink/60 font-mono">LRN: {student.lrn}</div>
                        </td>

                        {/* Written Works Inputs */}
                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.written_work_raw}
                            onChange={(e) => handleScoreChange(student.id, "written_work_raw", Number(e.target.value))}
                          />
                        </td>
                        <td className="p-1 border-r border-ink/15 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.written_work_highest}
                            onChange={(e) => handleScoreChange(student.id, "written_work_highest", Number(e.target.value))}
                          />
                        </td>

                        {/* Performance Tasks Inputs */}
                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.performance_task_raw}
                            onChange={(e) => handleScoreChange(student.id, "performance_task_raw", Number(e.target.value))}
                          />
                        </td>
                        <td className="p-1 border-r border-ink/15 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.performance_task_highest}
                            onChange={(e) => handleScoreChange(student.id, "performance_task_highest", Number(e.target.value))}
                          />
                        </td>

                        {/* Examinations ST1, ST2, TE Inputs */}
                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-12 px-1 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.st1_raw}
                            onChange={(e) => handleScoreChange(student.id, "st1_raw", Number(e.target.value))}
                          />
                        </td>
                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-12 px-1 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.st1_highest}
                            onChange={(e) => handleScoreChange(student.id, "st1_highest", Number(e.target.value))}
                          />
                        </td>

                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-12 px-1 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.st2_raw}
                            onChange={(e) => handleScoreChange(student.id, "st2_raw", Number(e.target.value))}
                          />
                        </td>
                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-12 px-1 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.st2_highest}
                            onChange={(e) => handleScoreChange(student.id, "st2_highest", Number(e.target.value))}
                          />
                        </td>

                        <td className="p-1 border-r border-ink/10 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-12 px-1 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.te_raw}
                            onChange={(e) => handleScoreChange(student.id, "te_raw", Number(e.target.value))}
                          />
                        </td>
                        <td className="p-1 border-r border-ink/15 text-center">
                          <input
                            type="number"
                            disabled={!canEdit}
                            className="w-12 px-1 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono text-xs focus:outline-none focus:border-tingub-blue disabled:bg-ink/5 disabled:cursor-not-allowed"
                            value={row.te_highest}
                            onChange={(e) => handleScoreChange(student.id, "te_highest", Number(e.target.value))}
                          />
                        </td>

                        {/* Calculated Initial Grade */}
                        <td className="p-2.5 border-r border-ink/15 text-center bg-tingub-gold/5 font-bold font-mono text-sm text-ink">
                          {computed.initialGrade.toFixed(2)}
                        </td>

                        {/* Calculated Transmuted Grade */}
                        <td className="p-2.5 border-r border-ink/15 text-center bg-tingub-green/10 font-bold font-mono text-base text-tingub-green">
                          {gradingMode === "adjusted_transmutation"
                            ? computed.transmutedGrade
                            : computed.transmutedGrade.toFixed(2)}
                        </td>

                        {/* Sync Status Badge */}
                        <td className="p-2 text-center">
                          <Badge
                            status={row.synced === 1 ? "approved" : "pending"}
                            label={row.synced === 1 ? "Synced" : "Local"}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
