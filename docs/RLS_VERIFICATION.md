# Row Level Security (RLS) Verification Checklist

## Overview

This document describes how to verify that Row Level Security (RLS) policies are
working correctly for each role in TNHS LIKHA-SIS.

## Prerequisites

1. Run the test accounts migration via Supabase Dashboard SQL Editor or CLI:
   ```bash
   supabase migration up
   ```
   Or apply `supabase/migrations/20260807000005_test_accounts.sql` directly.

2. Confirm the test accounts exist in **Supabase Dashboard > Authentication > Users**.

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Teacher | teacher.test@tnhs-likha-sis.local | TeacherTest2026! |
| Master Teacher | master.teacher.test@tnhs-likha-sis.local | MasterTeacher2026! |
| ICT Coordinator | ict.test@tnhs-likha-sis.local | ICTTest2026! |
| Principal | principal.test@tnhs-likha-sis.local | PrincipalTest2026! |
| Stakeholder | stakeholder.test@tnhs-likha-sis.local | StakeholderTest2026! |

> Change these passwords after verification. They are temporary.

## Verification Steps

### 1. Teacher

Sign in: teacher.test@tnhs-likha-sis.local / TeacherTest2026!

| Table / Feature | Expected Behavior |
|-----------------|-------------------|
| students (via Enrollment) | Can view students in section sec-rls-test only |
| students (other sections) | Blocked � RLS filters by section_id |
| class_record_grades | Can manage grades for students in sec-rls-test only |
| anecdotal_records | Can create records for students in sec-rls-test |
| stakeholder_links | No access |
| create-account Edge Function | Blocked (403 Forbidden) |

### 2. Master Teacher

Sign in: master.teacher.test@tnhs-likha-sis.local / MasterTeacher2026!

| Table / Feature | Expected Behavior |
|-----------------|-------------------|
| students | Read-only across all sections |
| class_record_grades | Can view all records; can update status only |
| class_record_grades (row data) | Cannot modify raw scores |
| anecdotal_records | Read-only |
| stakeholder_links | Read-only |
| create-account Edge Function | Blocked (403 Forbidden) |

### 3. ICT Coordinator

Sign in: ict.test@tnhs-likha-sis.local / ICTTest2026!

| Table / Feature | Expected Behavior |
|-----------------|-------------------|
| students | Full access (ALL operations) |
| sections | Full access (ALL operations) |
| class_record_grades | Full access (ALL operations) |
| anecdotal_records | Full access (ALL operations) |
| stakeholder_links | Full access (ALL operations) |
| profiles | Full access (ALL operations) |
| create-account Edge Function | Allowed (only ICT Coordinator can invoke) |

### 4. Principal

Sign in: principal.test@tnhs-likha-sis.local / PrincipalTest2026!

| Table / Feature | Expected Behavior |
|-----------------|-------------------|
| students | Read-only across all sections |
| class_record_grades | Read-only across all sections |
| anecdotal_records | Read-only across all sections |
| stakeholder_links | Read-only across all sections |
| sections | Read-only |
| create-account Edge Function | Blocked (403 Forbidden) |
| Enrollment form | Blocked (no insert/update access to students) |

### 5. Stakeholder

Sign in: stakeholder.test@tnhs-likha-sis.local / StakeholderTest2026!

| Table / Feature | Expected Behavior |
|-----------------|-------------------|
| students | Can view only linked students (std-rls-1) |
| students (unlinked) | Blocked — std-rls-2 is not visible |
| class_record_grades | Can view only linked students' grades |
| anecdotal_records | Can view only linked students' records |
| stakeholder_links | Can view own links only |
| sections | Blocked |
| create-account Edge Function | Blocked |
| SF9 Report Card | Can view only linked learner's SF9 |

## RLS Policy Reference

| Table | Teacher | Master Teacher | ICT Coordinator | Principal | Stakeholder |
|-------|---------|----------------|-----------------|-----------|-------------|
| students | SELECT/UPDATE (own section) | SELECT (all) | ALL | SELECT (all) | SELECT (linked only) |
| sections | SELECT (all) | SELECT (all) | ALL | SELECT (all) | No access |
| class_record_grades | ALL (own section) | SELECT (all) + UPDATE status | ALL | SELECT (all) | SELECT (linked only) |
| anecdotal_records | ALL (own section) | SELECT (all) | ALL | SELECT (all) | SELECT (linked only) |
| stakeholder_links | No access | SELECT (all) | ALL | SELECT (all) | SELECT (own only) |
| profiles | SELECT (own) | SELECT (all) | ALL | SELECT (all) | SELECT (own) |

## Troubleshooting

- If a test account cannot sign in, verify the user exists in Supabase Dashboard > Authentication > Users.
- If RLS appears to allow too much data, check the policy definitions in `supabase/migrations/20260807000000_init_schema.sql`.
- If the Edge Function returns 403 for the ICT Coordinator, confirm the caller's profile role is `ict_coordinator`.
