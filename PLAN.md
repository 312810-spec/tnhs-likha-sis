# PLAN.md: TNHS LIKHA-SIS

## What this is
TNHS LIKHA-SIS is the school information system for Tingub National
High School (JHS and SHS). It manages enrollment, class records,
grading under DepEd Order No. 015, s. 2026, an approval pipeline,
DepEd school forms, and anecdotal records, across six roles.

## Grading rule, DO 015, s. 2026
Effective SY 2026-2027. Repeals DO 8, s. 2015 and DO 36, s. 2016.

Step 1, Initial Grade:
Written Works % = WW raw total / WW highest possible * 100
Performance Tasks % = PT raw total / PT highest possible * 100
Examinations % = (ST1 % * 0.30) + (ST2 % * 0.30) + (TE % * 0.40)
Initial Grade = (WW % * WW weight) + (PT % * PT weight) + (EX % * EX weight)

Step 2, Transmuted Grade, SY 2026-2027 only:
Look up the Initial Grade in the Adjusted Transmutation Table below.
The Transmuted Grade is the official grade on report cards and forms.
Full zero-based grading, where the Transmuted Grade equals the
Initial Grade with no lookup, starts SY 2027-2028. Keep
school_settings.grading_mode switchable between adjusted_transmutation
and zero_based so this does not require a rebuild later.

## Weighted components by classification
JHS, Grades 7-10:
- jhs_core (English, Filipino, Math, Science, AP, GMRC/VE): 20 / 50 / 30
- jhs_tle_mapeh (EPP/TLE, MAPEH): 20 / 60 / 20

SHS, Grades 11-12:
- shs_core (Core Subjects, Academic Electives): 20 / 50 / 30
- shs_field_exposure (Field Exposure, Arts Apprenticeship, Creative
  Production and Innovation): 15 / 70 / 15
- shs_arts_sports_wellness (Arts, Sports, Health and Wellness
  Electives): 20 / 60 / 20
- shs_research_design (Research Electives, Design and Innovation): 40 / 60 / 0
- shs_techpro (TechPro Electives): 15 / 65 / 20
- shs_work_immersion (Work Immersion): 20 / 80 / 0

Order is Written Works / Performance Tasks / Examinations.

## Adjusted Transmutation Table, SY 2026-2027 only
Format is Initial Grade range: Transmuted Grade.
0.00-4.67:60, 4.68-9.34:61, 9.35-14.00:62, 14.01-18.67:63,
18.68-23.34:64, 23.35-28.00:65, 28.01-32.67:66, 32.68-37.33:67,
37.34-42.00:68, 42.01-46.66:69, 46.67-51.33:70, 51.34-56.00:71,
56.01-60.66:72, 60.67-65.33:73, 65.34-69.99:74, 70.00-71.17:75,
71.18-72.35:76, 72.36-73.53:77, 73.54-74.71:78, 74.72-75.89:79,
75.90-77.07:80, 77.08-78.25:81, 78.26-79.43:82, 79.44-80.61:83,
80.62-81.79:84, 81.80-82.97:85, 82.98-84.15:86, 84.16-85.33:87,
85.34-86.51:88, 86.52-87.69:89, 87.70-88.87:90, 88.88-90.05:91,
90.06-91.23:92, 91.24-92.41:93, 92.42-93.59:94, 93.60-94.77:95,
94.78-95.95:96, 95.96-97.13:97, 97.14-98.31:98, 98.32-99.49:99,
99.50-100.00:100

Academic Excellence Awards (Grades 4-12): General Average 90 or
higher, no Final Grade below 80 in any learning area, no derogatory
or disciplinary record.

## Design
Theme comes from the school seal: laurel wreath, blue gear, gold and
orange sunburst, open book and torch, black text on white. Flat and
simple. Full tokens are in AGENTS.md. Signature touch: a light
sunburst pattern on the login screen only, everywhere else stays plain.

## Roles
| Role | What they do | Data access |
|---|---|---|
| teacher | Enters WW/PT/EX scores for their own subject and section | Own subject and section only |
| adviser | A teacher flag. Also writes anecdotal records and preps SF1/SF2 for their section | Own section |
| master_teacher | Reviews and approves or rejects submitted grades | Pending submissions in their department |
| ict_coordinator | Creates accounts, manages SF10 uploads and enrollment | Profiles and students, for account and enrollment tasks |
| principal | Views school-wide dashboards, signs off on forms | Read access to everything, write access to sign-off only |
| stakeholder | Views their own linked learner's record | Only students linked to them |

Note: the original tier list named four groups. This plan keeps
master_teacher from the source architecture doc, since the approval
pipeline depends on it, and treats adviser as a flag on a teacher
account rather than a separate login.

## Data flow
An SF10 upload creates a student record. A teacher enters WW/PT/EX
scores offline through Dexie.js, which syncs to Supabase once online.
The engine computes the Initial Grade, then the Transmuted Grade. A
master_teacher reviews and approves or rejects each submission.
Approved records feed the DepEd forms exporter and the principal's
overview dashboard.

## Roadmap
| Phase | Builds |
|---|---|
| 1 | Theme and design tokens |
| 2 | Core schema, roles, Row Level Security |
| 3 | SF10 upload and enrollment |
| 4 | Offline grading engine with transmutation |
| 5 | Master teacher approval pipeline |
| 6 | Anecdotal records repository |
| 7 | DepEd forms exporter and student ID |
| 8 | Principal, ICT coordinator, and stakeholder dashboards |
| 9 | Deploy and final QA |