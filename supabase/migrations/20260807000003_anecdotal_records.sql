-- ================================================================================
--           Anecdotal Records Module
--               DO 015, s. 2026 Architecture
--
-- Provides the anecdotal_records table used inside each learner's profile page.
--   - A teacher / adviser records entries ONLY for learners in their own assigned
--     section. An adviser's assigned section_id is the section they advise, so the
--     same section check covers both teachers and advisers.
--   - A principal reads every entry across the school.
--   - A stakeholder reads only entries for learners linked to them via
--     stakeholder_links.
-- ================================================================================

-- 1) Create the anecdotal category enum.
CREATE TYPE anecdotal_category AS ENUM (
  'behavior',
  'achievement',
  'health',
  'other'
);

-- 2) Create the anecdotal_records table.
CREATE TABLE anecdotal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category anecdotal_category NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Supporting index for the profile view (filter by learner + earliest date).
CREATE INDEX idx_anecdotal_records_student_date
  ON anecdotal_records (student_id, entry_date DESC);

-- 3) Enable Row Level Security (RLS).
ALTER TABLE anecdotal_records ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies

-- Teachers / advisers create entries ONLY for learners in their own section.
-- author_id must be the authenticated user, so nobody can forge another author.
CREATE POLICY "Teachers create anecdotes only for their section students"
  ON anecdotal_records FOR INSERT
  WITH CHECK (
    get_auth_user_role() = 'teacher'
    AND author_id = auth.uid()
    AND student_id IN (
      SELECT id FROM students WHERE section_id = get_auth_user_section_id()
    )
  );

-- Teachers / advisers (and master teachers) read entries for their section students.
CREATE POLICY "Teachers and master teachers read their section anecdotes"
  ON anecdotal_records FOR SELECT
  USING (
    get_auth_user_role() IN ('teacher', 'master_teacher')
    AND student_id IN (
      SELECT id FROM students WHERE section_id = get_auth_user_section_id()
    )
  );

-- The principal reads every entry across the school.
CREATE POLICY "Principal can read all anecdotal records"
  ON anecdotal_records FOR SELECT
  USING (get_auth_user_role() = 'principal');

-- ICT Coordinator (system admin) read access, mirroring the enrollment module.
CREATE POLICY "ICT Coordinator can read anecdotal records"
  ON anecdotal_records FOR SELECT
  USING (get_auth_user_role() = 'ict_coordinator');

-- Stakeholders read only entries for learners linked to them.
CREATE POLICY "Stakeholders read anecdotes for linked students"
  ON anecdotal_records FOR SELECT
  USING (
    get_auth_user_role() = 'stakeholder'
    AND student_id IN (
      SELECT student_id
      FROM stakeholder_links
      WHERE stakeholder_id = auth.uid()
    )
  );
