-- TNHS LIKHA-SIS Test Accounts for Deployment Verification
-- DepEd Order No. 015, s. 2026 Architecture
--
-- This migration creates one test account per role for RLS verification.
-- IMPORTANT: Run this ONLY in your development/staging Supabase project.
-- DO NOT run in production with real student data.
--
-- After running, use the Supabase Dashboard > Authentication > Users to
-- confirm each user exists, then sign in via the app to verify RLS behavior.

-- ============================================================================
-- TEST ACCOUNTS
-- ============================================================================
-- Passwords are temporary and should be changed on first sign-in.
-- All accounts are email-confirmed for immediate testing.

DO $$
DECLARE
  teacher_user_id UUID;
  master_teacher_user_id UUID;
  ict_user_id UUID;
  principal_user_id UUID;
  stakeholder_user_id UUID;
BEGIN
  -- 1) Teacher
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'teacher.test@tnhs-likha-sis.local',
    crypt('TeacherTest2026!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Teacher","role":"teacher"}',
    now(), now(), 'authenticated', 'authenticated'
  )
  RETURNING id INTO teacher_user_id;

  INSERT INTO public.profiles (id, full_name, role, is_adviser, section_id, created_at)
  VALUES (teacher_user_id, 'Test Teacher', 'teacher', false, NULL, now());

  -- 2) Master Teacher
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'master.teacher.test@tnhs-likha-sis.local',
    crypt('MasterTeacher2026!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Master Teacher","role":"master_teacher"}',
    now(), now(), 'authenticated', 'authenticated'
  )
  RETURNING id INTO master_teacher_user_id;

  INSERT INTO public.profiles (id, full_name, role, is_adviser, section_id, created_at)
  VALUES (master_teacher_user_id, 'Test Master Teacher', 'master_teacher', false, NULL, now());

  -- 3) ICT Coordinator
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'ict.test@tnhs-likha-sis.local',
    crypt('ICTTest2026!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test ICT Coordinator","role":"ict_coordinator"}',
    now(), now(), 'authenticated', 'authenticated'
  )
  RETURNING id INTO ict_user_id;

  INSERT INTO public.profiles (id, full_name, role, is_adviser, section_id, created_at)
  VALUES (ict_user_id, 'Test ICT Coordinator', 'ict_coordinator', false, NULL, now());

  -- 4) Principal
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'principal.test@tnhs-likha-sis.local',
    crypt('PrincipalTest2026!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Principal","role":"principal"}',
    now(), now(), 'authenticated', 'authenticated'
  )
  RETURNING id INTO principal_user_id;

  INSERT INTO public.profiles (id, full_name, role, is_adviser, section_id, created_at)
  VALUES (principal_user_id, 'Test Principal', 'principal', false, NULL, now());

  -- 5) Stakeholder
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, last_sign_in_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role)
  VALUES (
    gen_random_uuid(),
    'stakeholder.test@tnhs-likha-sis.local',
    crypt('StakeholderTest2026!', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test Stakeholder","role":"stakeholder"}',
    now(), now(), 'authenticated', 'authenticated'
  )
  RETURNING id INTO stakeholder_user_id;

  INSERT INTO public.profiles (id, full_name, role, is_adviser, section_id, created_at)
  VALUES (stakeholder_user_id, 'Test Stakeholder', 'stakeholder', false, NULL, now());

  RAISE NOTICE 'Test account users created.';
END $$;

-- ============================================================================
-- DEMO DATA FOR RLS VERIFICATION
-- ============================================================================
-- Create a section, students, and a stakeholder link so RLS can be tested.

-- Create a demo section
INSERT INTO public.sections (id, grade_level, section_name, school_year, adviser_id, created_at)
VALUES ('sec-rls-test', 'Grade 7', 'RLS Test', '2026-2027', (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1), now());

-- Create demo students in that section
INSERT INTO public.students (id, lrn, full_name, birthdate, sex, address, grade_level, section_id, enrollment_status, sf10_file_url, created_at)
VALUES
  ('std-rls-1', '999999999901', 'RLS Student One', '2012-01-01', 'Male', 'Tingub', 'Grade 7', 'sec-rls-test', 'enrolled', NULL, now()),
  ('std-rls-2', '999999999902', 'RLS Student Two', '2012-02-02', 'Female', 'Tingub', 'Grade 7', 'sec-rls-test', 'enrolled', NULL, now());

-- Link stakeholder to RLS Student One
INSERT INTO public.stakeholder_links (id, stakeholder_id, student_id, relationship, created_at)
SELECT gen_random_uuid(), id, 'std-rls-1', 'Parent / Guardian', now()
FROM public.profiles WHERE role = 'stakeholder' LIMIT 1;

-- Create a sample class record grade for RLS testing
INSERT INTO public.class_record_grades (id, student_id, subject_id, quarter, written_work_raw, written_work_highest, performance_task_raw, performance_task_highest, st1_raw, st1_highest, st2_raw, st2_highest, te_raw, te_highest, initial_grade, transmuted_grade, status, adviser_id, created_at, updated_at)
VALUES
  (gen_random_uuid(), 'std-rls-1', 'sub-rls', 1, 40, 50, 80, 100, 20, 25, 27, 30, 40, 50, 82.90, 89, 'DRAFT', (SELECT id FROM public.profiles WHERE role = 'teacher' LIMIT 1), now(), now());

-- Create sample subject weight for the test subject
INSERT INTO public.subject_weights (classification, written_work_weight, performance_task_weight, examination_weight)
VALUES ('jhs_core', 0.20, 0.50, 0.30);
