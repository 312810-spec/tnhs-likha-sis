-- ================================================================================
--           FORMS & STUDENT ID MODULE  (PROMPT 4)
--               DO 015, s. 2026 Architecture
--
-- Adds the learner ID validation token to the `students` table and the
-- SECURITY DEFINER RPC that a scanned QR code resolves against.
--
-- The QR code on a learner ID card links to the public validation page
-- `/students/validate?token=<token>`. That page calls `get_public_student_by_token`
-- which (a) is SECURITY DEFINER so it intentionally bypasses student-row RLS, and
-- (b) returns only the small, non-sensitive set of fields needed to confirm the
-- card belongs to a learner in the system. It never returns the token itself nor
-- any private profile data.
-- ================================================================================

-- 1) Persist the opaque validation token on the learner's row.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS validation_token TEXT,
  ADD COLUMN IF NOT EXISTS token_issued_at TIMESTAMPTZ;

-- A token is only useful while unique, so no two cards share a QR payload.
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_validation_token
  ON students (validation_token)
  WHERE validation_token IS NOT NULL;

-- 2) SECURITY DEFINER RPC for the QR validation page.
--    Returns zero rows when the token does not match any learner. `is_valid` is
--    always TRUE whenever a row is returned, so the client treats an empty result
--    as "token not recognized."
CREATE OR REPLACE FUNCTION get_public_student_by_token(p_token TEXT)
RETURNS TABLE (
  full_name TEXT,
  lrn TEXT,
  grade_level TEXT,
  section_name TEXT,
  school_year TEXT,
  is_valid BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.full_name,
    s.lrn,
    s.grade_level,
    sec.section_name,
    sec.school_year,
    TRUE AS is_valid
  FROM students s
  LEFT JOIN sections sec ON sec.id = s.section_id
  WHERE s.validation_token = p_token
  LIMIT 1;
$$;

-- Allow any authenticated user (including a stakeholder scanning a card) to call it.
REVOKE ALL ON FUNCTION get_public_student_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_public_student_by_token(TEXT) TO authenticated;

-- 3) RLS note on the new columns
--    The token lives on `students`, which already has RLS policies (teachers in
--    their own section, principal/ICT all, stakeholders their linked learners).
--    Reading the raw token is therefore already limited to those roles, and the
--    public scan path goes through the SECURITY DEFINER RPC above rather than a
--    direct select on `students` -- so a row-level policy is not strictly required
--    for the token column. It is still covered by the table's existing policies.
-- ================================================================================
