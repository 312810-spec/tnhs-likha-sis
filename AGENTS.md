# AGENTS.md

Tech stack: Next.js, React, Tailwind CSS, Supabase (Postgres, Auth,
Storage, Edge Functions), Dexie.js for offline storage, hosted on Vercel.

Rules:
- Read PLAN.md before starting any task.
- Never hardcode API keys or secrets in code. Use environment variables.
- Never call an admin-level Supabase function from client-side code.
  Privileged actions go through a Supabase Edge Function only.
- Keep changes inside the files named in the current prompt.
- Follow the DO 015, s. 2026 weights exactly as defined in
  subject_weights. Apply the transmutation_table lookup only when
  school_settings.grading_mode is adjusted_transmutation.
- Every table holding student data needs a Row Level Security policy
  before a feature counts as done.

Design tokens (set these up in Prompt 1, then reuse everywhere):
- Colors: tingub-blue #1B3B8C, tingub-green #1E6B3A, tingub-gold
  #F5A623, tingub-orange #E8720C, ink #1A1A1A, paper #FAFAF8.
- Font: Inter. Weight 700 headings, 500 labels and buttons, 400 body.
- Flat surfaces only. No drop shadows, no gradients, 8px corner
  radius, except one light sunburst pattern on the login screen.
- Status colors stay fixed: tingub-green for approved or success,
  tingub-gold for pending, tingub-orange for warnings, gray for
  disabled.
- Buttons name the action they take: "Save changes," "Approve,"
  "Reject." Empty states say what is missing and what to do next.

Roles: teacher, master_teacher, ict_coordinator, principal, stakeholder.
Full definitions are in PLAN.md.

# Visual Layout & Component Rules (TNHS LIKHA-SIS)

Theme & Colors:
- Primary Sidebar: tingub-blue `#1B3B8C` (Dark variant `#12265C` for background). Active item pill: tingub-gold `#F5A623` with ink `#1A1A1A` text, or white text with flat highlight.
- Header Bar: tingub-green `#1E6B3A`. Status pill: "TINGUB NATIONAL HIGH SCHOOL" on paper `#FAFAF8`.
- Content Area Background: paper `#FAFAF8`. Cards & Tables: Flat `#FFFFFF` with 8px corner radius and 1px border (`#E5E7EB`). No drop shadows or gradients.
- Badges & Accents: Success/Passed = tingub-green `#1E6B3A`, Pending/Alert = tingub-gold `#F5A623`, Warnings/SARDO = tingub-orange `#E8720C`.
- Typography: Inter font. Weight 700 headings, 500 buttons/labels, 400 body text.

Layout Shell Structure:
- Left Sidebar Navigation (14 Items): Dashboard, Learner Registry, ID Generator, Attendance Center, Learning Resources, Grade Center, Health & Nutrition, Remarks & Comments, Requirements Tracker, Forms Automation, Reports & Analytics, School Calendar, Backup & Restore, School Settings.
- Top Header: Hamburger menu button, view breadcrumb title, school identifier pill, live clock (Date & Time format: "TUESDAY, JUNE 9, 2026 | 10:06:54 PM"), and theme toggle icon.

- SF10 Upload Processing: Accept `.xlsx` spreadsheet files in addition to standard documents. Parse `.xlsx` files using the `xlsx` (SheetJS) package to automatically extract LRN, student demographics, and past scholastic grades directly into the enrollment form.