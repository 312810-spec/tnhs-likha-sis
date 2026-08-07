import { db, LocalClassRecordGrade } from "@/lib/db";
import { saveGradeRecordOffline } from "@/lib/syncQueue";
import { GradeStatusEnum } from "@/types/database.types";

/**
 * A submission group is one teacher's quarterly class record for a single
 * section + subject. Approval / rejection is applied to every student row in
 * the group so the whole class record moves state together.
 */
export interface SubmissionGroup {
  key: string;
  sectionId: string;
  subjectId: string;
  quarter: number;
  records: LocalClassRecordGrade[];
}

async function updateGroupStatus(
  group: SubmissionGroup,
  status: GradeStatusEnum,
  reviewNotes: string | null
): Promise<number> {
  let updated = 0;
  for (const rec of group.records) {
    await db.class_record_grades.update(rec.id, {
      status,
      review_notes: reviewNotes,
      updated_at: new Date().toISOString(),
    });
    // Persist offline-first and enqueue for Supabase sync (MT has UPDATE RLS).
    const updatedRecord = { ...rec, status, review_notes: reviewNotes };
    await saveGradeRecordOffline(updatedRecord as LocalClassRecordGrade);
    updated++;
  }
  return updated;
}

/**
 * Approve a submission group: advances every row to MT_APPROVED (locking it from
 * further teacher edits) and clears any prior review notes.
 */
export async function approveSubmissionGroup(
  group: SubmissionGroup
): Promise<number> {
  return updateGroupStatus(group, "MT_APPROVED", null);
}

/**
 * Reject a submission group: returns every row to NEEDS_REVISION (unlocking it
 * for the teacher) and writes the reviewer's feedback note on each row.
 */
export async function rejectSubmissionGroup(
  group: SubmissionGroup,
  reviewNotes: string
): Promise<number> {
  return updateGroupStatus(group, "NEEDS_REVISION", reviewNotes.trim() || null);
}
