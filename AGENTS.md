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
- Every screen lives inside the authenticated role layout at a real
  route. Never add a standalone demo, index, or preview page.
- Use Supabase Edge Functions for privileged server-side logic, never
  a Next.js API route or Server Action. The app has to run as a
  static export for the Windows and Android builds, and those do not
  run Next.js server code.
- Login stays plain email and password. No magic link, no OAuth
  redirect. Packaged desktop and mobile builds have no real https
  domain for a redirect to land on.
- Writing schema SQL to a file is not the same as applying it. After
  any create table or alter table work, apply the SQL directly to the
  live Supabase project before considering the task done; do not stop
  at writing the migration file. If the SQL cannot be run directly,
  state plainly that the SQL Editor needs to run it by hand, and
  confirm the table shows in Table Editor before calling the prompt
  done.

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