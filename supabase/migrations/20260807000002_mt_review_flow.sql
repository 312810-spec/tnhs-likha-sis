-- ================================================================================
--           PROMPT 3: Master Teacher Review & Approval Flow
--               DO 015, s. 2026 Compliance Verification
-- ================================================================================
-- Adds the 'NEEDS_REVISION' status (teacher-unlocked feedback state) and the
-- 'review_notes' column used by the MT Reject flow, keeping the class record
-- pipeline DB in sync with the front-end Dexie schema.

-- 1) Extend the grade status enum with the rejection/revision state.
ALTER TYPE grade_status_enum ADD VALUE IF NOT EXISTS 'NEEDS_REVISION';

-- 2) Persist the reviewer's rejection feedback box on each class record row.
--    The note is written across every row of the rejected submission group
--    (section + subject + quarter) and unlocked for the teacher to read/edit.
ALTER TABLE class_record_grades
  ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- ------------------------------------------------------------------------------
-- RLS: Master Teachers already have SELECT + UPDATE on class_record_grades
-- (init_schema.sql). Those policies are sufficient for Approve/Reject since they
-- only mutate `status` and `review_notes`. No additional policy is required, and
-- the teacher UPDATE policy remains intact so a rejected (NEEDS_REVISION) record
-- is editable again by the assigned teacher.
-- ------------------------------------------------------------------------------
