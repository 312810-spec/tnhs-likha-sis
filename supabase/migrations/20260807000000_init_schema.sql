-- TNHS LIKHA-SIS Database Schema Initial Migration
-- DepEd Order No. 015, s. 2026 Architecture Compliance

-- 1. Create Enums
CREATE TYPE user_role AS ENUM (
  'teacher',
  'master_teacher',
  'ict_coordinator',
  'principal',
  'stakeholder'
);

CREATE TYPE subject_classification AS ENUM (
  'jhs_core',
  'jhs_tle_mapeh',
  'shs_core',
  'shs_field_exposure',
  'shs_arts_sports_wellness',
  'shs_research_design',
  'shs_techpro',
  'shs_work_immersion'
);

CREATE TYPE grading_mode_enum AS ENUM (
  'adjusted_transmutation',
  'zero_based'
);

CREATE TYPE enrollment_status_enum AS ENUM (
  'enrolled',
  'transferred_out',
  'dropped',
  'graduated'
);

CREATE TYPE grade_status_enum AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'MT_APPROVED',
  'REJECTED',
  'LOCKED'
);

-- 2. Create Tables

-- Profiles Table (Linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'teacher',
  is_adviser BOOLEAN NOT NULL DEFAULT FALSE,
  section_id UUID, -- Foreign key added below after sections table creation
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sections Table
CREATE TABLE sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level TEXT NOT NULL,
  section_name TEXT NOT NULL,
  school_year TEXT NOT NULL,
  adviser_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add circular reference from profiles.section_id to sections.id
ALTER TABLE profiles 
  ADD CONSTRAINT fk_profiles_section 
  FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL;

-- Subjects Table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  classification subject_classification NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subject Weights Table (DO 015, s. 2026)
CREATE TABLE subject_weights (
  classification subject_classification PRIMARY KEY,
  written_work_weight NUMERIC(3,2) NOT NULL,
  performance_task_weight NUMERIC(3,2) NOT NULL,
  examination_weight NUMERIC(3,2) NOT NULL
);

-- Transmutation Table (40 rows DepEd lookup)
CREATE TABLE transmutation_table (
  id SERIAL PRIMARY KEY,
  min_ig NUMERIC(5,2) NOT NULL,
  max_ig NUMERIC(5,2) NOT NULL,
  transmuted_grade INTEGER NOT NULL
);

-- School Settings Table
CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grading_mode grading_mode_enum NOT NULL DEFAULT 'adjusted_transmutation',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students Table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lrn TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  birthdate DATE,
  sex TEXT,
  address TEXT,
  grade_level TEXT NOT NULL,
  section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  enrollment_status enrollment_status_enum NOT NULL DEFAULT 'enrolled',
  sf10_file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stakeholder Links Table
CREATE TABLE stakeholder_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stakeholder_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_stakeholder_student UNIQUE (stakeholder_id, student_id)
);

-- Class Record Grades Table
CREATE TABLE class_record_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  written_work_raw NUMERIC(5,2),
  written_work_highest NUMERIC(5,2),
  performance_task_raw NUMERIC(5,2),
  performance_task_highest NUMERIC(5,2),
  st1_raw NUMERIC(5,2),
  st1_highest NUMERIC(5,2),
  st2_raw NUMERIC(5,2),
  st2_highest NUMERIC(5,2),
  te_raw NUMERIC(5,2),
  te_highest NUMERIC(5,2),
  initial_grade NUMERIC(5,2),
  transmuted_grade INTEGER,
  status grade_status_enum NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_student_subject_quarter UNIQUE (student_id, subject_id, quarter)
);

-- Formative Logs Table (Isolated non-graded ESRU entries)
CREATE TABLE formative_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  quarter INTEGER NOT NULL CHECK (quarter >= 1 AND quarter <= 4),
  activity_name TEXT NOT NULL,
  esru_rating TEXT NOT NULL, -- E, S, R, U
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Seed Initial Configuration Data

-- Seed 8 rows into subject_weights (DO 015, s. 2026 weights)
INSERT INTO subject_weights (classification, written_work_weight, performance_task_weight, examination_weight) VALUES
  ('jhs_core', 0.20, 0.50, 0.30),
  ('jhs_tle_mapeh', 0.20, 0.50, 0.30),
  ('shs_core', 0.20, 0.50, 0.30),
  ('shs_field_exposure', 0.15, 0.70, 0.15),
  ('shs_arts_sports_wellness', 0.15, 0.70, 0.15),
  ('shs_research_design', 0.40, 0.60, 0.00),
  ('shs_techpro', 0.20, 0.50, 0.30),
  ('shs_work_immersion', 0.20, 0.80, 0.00);

-- Seed 40 rows into transmutation_table
INSERT INTO transmutation_table (min_ig, max_ig, transmuted_grade) VALUES
  (100.00, 100.00, 100),
  (98.40, 99.99, 99),
  (96.80, 98.39, 98),
  (95.20, 96.79, 97),
  (93.60, 95.19, 96),
  (92.00, 93.59, 95),
  (90.40, 91.99, 94),
  (88.80, 90.39, 93),
  (87.20, 88.79, 92),
  (85.60, 87.19, 91),
  (84.00, 85.59, 90),
  (82.40, 83.99, 89),
  (80.80, 82.39, 88),
  (79.20, 80.79, 87),
  (77.60, 79.19, 86),
  (76.00, 77.59, 85),
  (74.40, 75.99, 84),
  (72.80, 74.39, 83),
  (71.20, 72.79, 82),
  (69.60, 71.19, 81),
  (68.00, 69.59, 80),
  (66.40, 67.99, 79),
  (64.80, 66.39, 78),
  (63.20, 64.79, 77),
  (61.60, 63.19, 76),
  (60.00, 61.59, 75),
  (56.00, 59.99, 74),
  (52.00, 55.99, 73),
  (48.00, 51.99, 72),
  (44.00, 47.99, 71),
  (40.00, 43.99, 70),
  (36.00, 39.99, 69),
  (32.00, 35.99, 68),
  (28.00, 31.99, 67),
  (24.00, 27.99, 66),
  (20.00, 23.99, 65),
  (16.00, 19.99, 64),
  (12.00, 15.99, 63),
  (8.00, 11.99, 62),
  (0.00, 7.99, 60);

-- Seed 1 row into school_settings
INSERT INTO school_settings (grading_mode) VALUES ('adjusted_transmutation');

-- 4. RLS Helper Functions (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION get_auth_user_section_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT section_id FROM profiles WHERE id = auth.uid();
$$;

-- 5. Enable Row Level Security (RLS) on All Tables

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE transmutation_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakeholder_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_record_grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE formative_logs ENABLE ROW LEVEL SECURITY;

-- 6. Row Level Security Policies

-- PROFILES POLICIES
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Principal and ICT Coordinator can view all profiles"
  ON profiles FOR SELECT
  USING (get_auth_user_role() IN ('principal', 'ict_coordinator'));

CREATE POLICY "ICT Coordinator can insert and update profiles"
  ON profiles FOR ALL
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

-- SECTIONS POLICIES
CREATE POLICY "Staff can view sections"
  ON sections FOR SELECT
  USING (get_auth_user_role() IN ('teacher', 'master_teacher', 'principal', 'ict_coordinator'));

CREATE POLICY "ICT Coordinator can manage sections"
  ON sections FOR ALL
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

-- SUBJECTS POLICIES
CREATE POLICY "All authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ICT Coordinator can manage subjects"
  ON subjects FOR ALL
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

-- SUBJECT WEIGHTS POLICIES
CREATE POLICY "All authenticated users can view subject weights"
  ON subject_weights FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ICT Coordinator can manage subject weights"
  ON subject_weights FOR ALL
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

-- TRANSMUTATION TABLE POLICIES
CREATE POLICY "All authenticated users can view transmutation table"
  ON transmutation_table FOR SELECT
  TO authenticated
  USING (true);

-- SCHOOL SETTINGS POLICIES
CREATE POLICY "All authenticated users can view school settings"
  ON school_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "ICT Coordinator can update school settings"
  ON school_settings FOR UPDATE
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

-- STUDENTS POLICIES
CREATE POLICY "Principal and ICT Coordinator can view all students"
  ON students FOR SELECT
  USING (get_auth_user_role() IN ('principal', 'ict_coordinator'));

CREATE POLICY "ICT Coordinator can manage students"
  ON students FOR ALL
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

CREATE POLICY "Teachers can view students in their assigned section"
  ON students FOR SELECT
  USING (
    get_auth_user_role() IN ('teacher', 'master_teacher') 
    AND section_id = get_auth_user_section_id()
  );

CREATE POLICY "Stakeholders can view their linked students"
  ON students FOR SELECT
  USING (
    get_auth_user_role() = 'stakeholder' 
    AND id IN (SELECT student_id FROM stakeholder_links WHERE stakeholder_id = auth.uid())
  );

-- STAKEHOLDER LINKS POLICIES
CREATE POLICY "Principal and ICT Coordinator can view all stakeholder links"
  ON stakeholder_links FOR SELECT
  USING (get_auth_user_role() IN ('principal', 'ict_coordinator'));

CREATE POLICY "ICT Coordinator can manage stakeholder links"
  ON stakeholder_links FOR ALL
  USING (get_auth_user_role() = 'ict_coordinator')
  WITH CHECK (get_auth_user_role() = 'ict_coordinator');

CREATE POLICY "Stakeholders can view their own links"
  ON stakeholder_links FOR SELECT
  USING (stakeholder_id = auth.uid());

-- CLASS RECORD GRADES POLICIES
CREATE POLICY "Principal can view all class record grades"
  ON class_record_grades FOR SELECT
  USING (get_auth_user_role() = 'principal');

CREATE POLICY "Master Teachers can view and update status of class record grades"
  ON class_record_grades FOR SELECT
  USING (get_auth_user_role() = 'master_teacher');

CREATE POLICY "Master Teachers can update status of class record grades"
  ON class_record_grades FOR UPDATE
  USING (get_auth_user_role() = 'master_teacher')
  WITH CHECK (get_auth_user_role() = 'master_teacher');

CREATE POLICY "Teachers can view and manage class record grades for their section"
  ON class_record_grades FOR ALL
  USING (
    get_auth_user_role() = 'teacher' 
    AND student_id IN (SELECT id FROM students WHERE section_id = get_auth_user_section_id())
  )
  WITH CHECK (
    get_auth_user_role() = 'teacher' 
    AND student_id IN (SELECT id FROM students WHERE section_id = get_auth_user_section_id())
  );

CREATE POLICY "Stakeholders can view class record grades for linked students"
  ON class_record_grades FOR SELECT
  USING (
    get_auth_user_role() = 'stakeholder'
    AND student_id IN (SELECT student_id FROM stakeholder_links WHERE stakeholder_id = auth.uid())
  );

-- FORMATIVE LOGS POLICIES
CREATE POLICY "Principal can view all formative logs"
  ON formative_logs FOR SELECT
  USING (get_auth_user_role() = 'principal');

CREATE POLICY "Master Teachers can view formative logs"
  ON formative_logs FOR SELECT
  USING (get_auth_user_role() = 'master_teacher');

CREATE POLICY "Teachers can view and manage formative logs for their section"
  ON formative_logs FOR ALL
  USING (
    get_auth_user_role() = 'teacher' 
    AND student_id IN (SELECT id FROM students WHERE section_id = get_auth_user_section_id())
  )
  WITH CHECK (
    get_auth_user_role() = 'teacher' 
    AND student_id IN (SELECT id FROM students WHERE section_id = get_auth_user_section_id())
  );

CREATE POLICY "Stakeholders can view formative logs for linked students"
  ON formative_logs FOR SELECT
  USING (
    get_auth_user_role() = 'stakeholder'
    AND student_id IN (SELECT student_id FROM stakeholder_links WHERE stakeholder_id = auth.uid())
  );
