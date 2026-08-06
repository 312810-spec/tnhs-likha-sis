================================================================================
          TINGUB NATIONAL HIGH SCHOOL INFORMATION SYSTEM (SIS)
              DO 015, s. 2026 ARCHITECTURE & DEVELOPMENT PLAN
================================================================================

1. EXECUTIVE SUMMARY & POLICY COMPLIANCE
--------------------------------------------------------------------------------
- Target Institution: Tingub National High School (JHS & SHS).
- System Purpose: Multi-platform, offline-first School Information System (SIS) 
  for managing student data, class records, report cards, approval pipelines, 
  and official DepEd school forms.
- Governing Policy: DepEd Order No. 015, s. 2026 (Revised Guidelines on 
  Classroom Assessment, Grading System, and Awards and Recognition for the 
  K to 12 Basic Education Program).
- Core Policy Requirements Implemented:
  * Zero-Based / Raw Percentage Computation: Eliminates legacy DO 8, s. 2015 
    arbitrary transmutation tables. Apply transmutation table lookup ONLY when
    school_settings.grading_mode is adjusted_transmutation.
  * Component Weightings (DO 015, s. 2026):
    - JHS & SHS Core / Academic Electives: 
      20% Written Works (WW), 50% Performance Tasks (PT), 30% Examinations (EX)
    - SHS Field Exposure / Creative Production: 
      15% Written Works (WW), 70% Performance Tasks (PT), 15% Examinations (EX)
    - SHS Research Electives, Design & Innovation: 
      40% Written Works (WW), 60% Performance Tasks (PT), 0% Examinations
    - SHS Work Immersion: 
      20% Written Works (WW), 80% Performance Tasks (PT)
  * Formative Data Isolation: Non-graded formative entries (ESRU model) 
    tracked in formative_logs without altering quarterly GPA.
- Infrastructure Strategy: 100% Free-Tier Architecture (Vercel + Supabase 
  PostgreSQL/Auth + Dexie.js for local IndexedDB offline storage).

2. ROLES & PERMISSIONS
--------------------------------------------------------------------------------
- teacher: Enters raw scores, submits quarterly class records.
- master_teacher: Reviews class records, verifies DO 015 compliance, approves/rejects records.
- ict_coordinator: System admin, manages users, final record locking, triggers official form compilations.
- principal: Executive oversight, views dashboards, signs off on school forms & official records.
- stakeholder: Parent/Student view-only access for progress cards (SF9) and notifications.

3. TECHNICAL STACK & OFFLINE ARCHITECTURE
--------------------------------------------------------------------------------
               +----------------------------------------------+
               |      Tingub NHS Web/PWA Client (Vercel)      |
               +----------------------+-----------------------+
                                      |
            +-------------------------+-------------------------+
            |                                                   |
            v                                                   v
+-------------------------------+               +-------------------------------+
|   Online Mode (Supabase API)  |               |  Offline Mode (Dexie.js DB)   |
|  - Row-Level Security (RLS)   |               |  - IndexedDB Local Storage    |
|  - Auth & Role Management     |               |  - Immediate Local Read/Write |
+---------------+---------------+               +---------------+---------------+
                |                                               |
                +-------------------------+---------------------+
                                          |
                                          | (Background Sync Protocol)
                                          v
                           +------------------------------+
                           |   Approval Pipeline & Forms  |
                           |  - Teacher -> MT -> Admin    |
                           |  - SF1, SF5, SF9, SF10 Export|
                           +------------------------------+

4. APPROVAL PIPELINE WORKFLOW
--------------------------------------------------------------------------------
1. Subject Teacher / Class Adviser:
   - Enters raw scores for Written Works, Performance Tasks, and Examinations 
     into the offline-capable E-Class Record UI.
   - Generates quarterly summaries and initial Formative/Summative diagnostic 
     logs.
2. Master Teacher / Department Head:
   - Reviews grade entries via the MT Verification Dashboard.
   - Inspects flags for out-of-bound scores, missing entries, or weighting 
     errors under DO 015, s. 2026.
   - Action: Approve (locks records and forwards to Admin) or Reject 
     (returns with review notes to Teacher).
3. ICT Coordinator / School Head:
   - Executes administrative final lock.
   - Triggers automated compilation for official DepEd School Forms 
     (SF1, SF2, SF5, SF9 / Learner Progress Report Card, SF10 / Permanent 
     Record) and Student ID rendering.

5. SCOPED DEVELOPMENT PROMPTS (STEP-BY-STEP EXECUTION)
--------------------------------------------------------------------------------

[ PROMPT 1: Supabase Database Schema & DO 015, s. 2026 Config ]

Apply the updated DepEd Order No. 015, s. 2026 grading rules to the Supabase 
database schema for Tingub NHS SIS:

1) Update or create the `subject_weights` configuration table to store 
   component weights per subject classification:
   - JHS & SHS Core / Academic: 
     written_work_weight = 0.20, performance_task_weight = 0.50, 
     examination_weight = 0.30.
   - SHS Field Exposure / Creative: 
     written_work_weight = 0.15, performance_task_weight = 0.70, 
     examination_weight = 0.15.
   - SHS Research Electives & Design: 
     written_work_weight = 0.40, performance_task_weight = 0.60, 
     examination_weight = 0.00.
   - SHS Work Immersion: 
     written_work_weight = 0.20, performance_task_weight = 0.80, 
     examination_weight = 0.00.
2) Create the `class_record_grades` schema supporting raw scores, learner 
   total raw scores, highest possible scores, and component percentage scores.
3) Ensure non-graded formative assessments are isolated in a separate 
   `formative_logs` table and excluded from final quarterly grade computations.
4) Every table holding student data must have Row Level Security (RLS) enabled.

[ PROMPT 2: Offline E-Class Record & Calculation Engine (Dexie.js) ]

Update the front-end calculation engine and Dexie.js offline store for Tingub NHS SIS:

1) Implement the DO 015, s. 2026 raw percentage calculation logic:
   - Raw Score % = (Learner Total Raw Score / Highest Possible Score) * 100
   - Weighted Score = Raw Score % * Component Weight
   - Final Quarterly Grade = Sum of Weighted Scores (WW + PT + EX).
2) Apply transmutation_table lookup ONLY when school_settings.grading_mode is adjusted_transmutation.
3) Store all local changes in Dexie.js IndexedDB first, with a sync queue 
   manager that auto-pushes queued updates to Supabase whenever an active 
   internet connection is detected.

[ PROMPT 3: Master Teacher Review & Approval Pipeline UI ]

Implement the approval pipeline and verification UI for Tingub NHS SIS:

1) Build the Master Teacher (MT) verification dashboard displaying pending 
   quarterly class records submitted by subject teachers.
2) Include validation checks that highlight missing summative assessment 
   scores, invalid component weightings, or missing performance tasks before 
   sign-off.
3) Add Approve and Reject controls with a text feedback box for rejection 
   notes. Rejection unlocks the record for teacher edit; approval advances 
   the status to "MT_APPROVED" and locks record fields.

[ PROMPT 4: DepEd School Form Exporters & Student ID Engine ]

Create the school forms exporter and printable engine for Tingub NHS SIS:

1) Implement printable export generators for DepEd School Forms:
   - SF1 (School Register)
   - SF5 (Report on Promotion and Level of Proficiency)
   - SF9 (Learner Progress Report Card following DO 015, s. 2026 raw score 
     grading scale)
   - SF10 (Learner's Permanent Academic Record)
2) Integrate student anecdotal records logging into the student profile 
   module.
3) Implement an automated student ID card generator layout with QR code 
   rendering linking to student validation tokens in Supabase.

6. IMPLEMENTATION ROADMAP & MILESTONES
--------------------------------------------------------------------------------
+---------+--------------------+-----------------------------------+-----------+
| Phase   | Core Objective     | Key Deliverable                   | Target    |
+---------+--------------------+-----------------------------------+-----------+
| Phase 1 | Database & Rules   | Configure Supabase schemas with   | Weeks 1-2 |
|         |                    | DO 015, s. 2026 weights and RLS   |           |
+---------+--------------------+-----------------------------------+-----------+
| Phase 2 | Offline Grader     | Build Dexie.js offline store and  | Weeks 3-4 |
|         |                    | raw score calculation engine      |           |
+---------+--------------------+-----------------------------------+-----------+
| Phase 3 | Approval Engine    | Deploy MT review dashboard,       | Weeks 5-6 |
|         |                    | validation flags, and lock states |           |
+---------+--------------------+-----------------------------------+-----------+
| Phase 4 | Forms & IDs        | Build print layouts for SF1, SF5, | Weeks 7-8 |
|         |                    | SF9, SF10, and Student IDs        |           |
+---------+--------------------+-----------------------------------+-----------+
