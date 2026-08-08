"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface StudentProfile {
  id: string;
  name: string;
  lrn: string;
  gradeLevel: string;
  section: string;
  sex: string;
  birthdate: string;
  trackStrand: string;
  adviser: string;
  schoolYear: string;
  subjects: {
    name: string;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    final: number;
    rating: string;
    remarks: string;
  }[];
}

const DEMO_STUDENTS: StudentProfile[] = [
  {
    id: "std-1",
    name: "Alvarez, Mateo Cruz",
    lrn: "109823471001",
    gradeLevel: "Grade 7",
    section: "Sampaguita",
    sex: "Male",
    birthdate: "March 14, 2012",
    trackStrand: "JHS Academic Curriculum",
    adviser: "Maria Santos, LPT",
    schoolYear: "2025-2026",
    subjects: [
      { name: "Filipino", q1: 87, q2: 88, q3: 87, q4: 89, final: 88, rating: "VS", remarks: "Passed" },
      { name: "English", q1: 89, q2: 90, q3: 91, q4: 90, final: 90, rating: "O", remarks: "Passed" },
      { name: "Mathematics", q1: 84, q2: 85, q3: 86, q4: 85, final: 85, rating: "VS", remarks: "Passed" },
      { name: "Science", q1: 86, q2: 87, q3: 88, q4: 87, final: 87, rating: "VS", remarks: "Passed" },
      { name: "Araling Panlipunan (AP)", q1: 88, q2: 89, q3: 89, q4: 90, final: 89, rating: "VS", remarks: "Passed" },
      { name: "Edukasyon sa Pagpapakakatao (EsP)", q1: 90, q2: 91, q3: 91, q4: 92, final: 91, rating: "O", remarks: "Passed" },
      { name: "Technology and Livelihood Education (TLE)", q1: 85, q2: 86, q3: 87, q4: 86, final: 86, rating: "VS", remarks: "Passed" },
      { name: "MAPEH", q1: 87, q2: 88, q3: 88, q4: 89, final: 88, rating: "VS", remarks: "Passed" },
    ],
  },
  {
    id: "std-2",
    name: "Bautista, Chloe Reyes",
    lrn: "109823471002",
    gradeLevel: "Grade 7",
    section: "Sampaguita",
    sex: "Female",
    birthdate: "July 22, 2012",
    trackStrand: "JHS Academic Curriculum",
    adviser: "Maria Santos, LPT",
    schoolYear: "2025-2026",
    subjects: [
      { name: "Filipino", q1: 91, q2: 93, q3: 92, q4: 94, final: 92, rating: "O", remarks: "Passed" },
      { name: "English", q1: 94, q2: 95, q3: 96, q4: 95, final: 95, rating: "O", remarks: "Passed" },
      { name: "Mathematics", q1: 89, q2: 91, q3: 90, q4: 92, final: 90, rating: "O", remarks: "Passed" },
      { name: "Science", q1: 92, q2: 94, q3: 93, q4: 95, final: 93, rating: "O", remarks: "Passed" },
      { name: "Araling Panlipunan (AP)", q1: 90, q2: 91, q3: 92, q4: 93, final: 91, rating: "O", remarks: "Passed" },
      { name: "Edukasyon sa Pagpapakakatao (EsP)", q1: 95, q2: 97, q3: 96, q4: 97, final: 96, rating: "O", remarks: "Passed" },
      { name: "Technology and Livelihood Education (TLE)", q1: 88, q2: 89, q3: 90, q4: 90, final: 89, rating: "VS", remarks: "Passed" },
      { name: "MAPEH", q1: 93, q2: 95, q3: 94, q4: 96, final: 94, rating: "O", remarks: "Passed" },
    ],
  },
];

const ATTENDANCE_MONTHS = [
  { month: "June", days: 22, present: 21, absent: 1 },
  { month: "July", days: 20, present: 19, absent: 1 },
  { month: "August", days: 23, present: 22, absent: 1 },
  { month: "September", days: 21, present: 20, absent: 1 },
  { month: "October", days: 22, present: 21, absent: 1 },
  { month: "November", days: 19, present: 18, absent: 1 },
  { month: "December", days: 15, present: 15, absent: 0 },
  { month: "January", days: 22, present: 21, absent: 1 },
  { month: "February", days: 20, present: 19, absent: 1 },
  { month: "March", days: 23, present: 22, absent: 1 },
  { month: "April", days: 18, present: 18, absent: 0 },
];

export default function IndividualAcademicPage() {
  const [selectedStudentId, setSelectedStudentId] = useState("std-1");
  const student = DEMO_STUDENTS.find((s) => s.id === selectedStudentId) || DEMO_STUDENTS[0];

  const totalDays = ATTENDANCE_MONTHS.reduce((sum, m) => sum + m.days, 0);
  const totalPresent = ATTENDANCE_MONTHS.reduce((sum, m) => sum + m.present, 0);
  const totalAbsent = ATTENDANCE_MONTHS.reduce((sum, m) => sum + m.absent, 0);
  const attendancePct = ((totalPresent / totalDays) * 100).toFixed(1);

  const generalAvg =
    student.subjects.reduce((sum, s) => sum + s.final, 0) / student.subjects.length;

  return (
    <div className="space-y-6">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-ink">Individual Academic Performance & Attendance Report</h1>
          <p className="text-sm text-ink/60 font-normal">
            Official printable learner transcript and attendance records (DO 015, s. 2026)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-ink">Select Student:</label>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-sm font-medium focus:outline-none focus:border-tingub-blue"
          >
            {DEMO_STUDENTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.lrn})
              </option>
            ))}
          </select>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            Print Report
          </Button>
        </div>
      </div>

      {/* Printable Printable Container */}
      <div className="rounded-[8px] border border-ink/15 bg-white p-8 text-ink shadow-none print:p-0 print:border-none">
        {/* a) DepEd Header */}
        <div className="text-center border-b-2 border-ink pb-4 mb-6">
          <p className="text-xs font-bold uppercase tracking-widest text-ink/80">Republic of the Philippines</p>
          <p className="text-sm font-bold text-ink">Department of Education</p>
          <p className="text-xs font-medium text-ink/70">REGION VII — CENTRAL VISAYAS</p>
          <p className="text-xs font-medium text-ink/70">DIVISION OF MANDAUE CITY</p>
          <p className="text-lg font-bold text-tingub-blue mt-1">TINGUB NATIONAL HIGH SCHOOL</p>
          <p className="text-[11px] font-normal text-ink/70">School ID: 303080 | Tingub, Mandaue City</p>
          <h2 className="text-sm font-bold uppercase tracking-wide text-ink mt-3">
            INDIVIDUAL ACADEMIC PERFORMANCE & ATTENDANCE REPORT
          </h2>
        </div>

        {/* b) Learner Demographic Details Block */}
        <div className="rounded-[8px] border border-ink/20 p-4 mb-6 bg-paper/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-tingub-blue mb-3">
            Learner Demographic Details
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-ink/60 font-normal">Learner Name: </span>
              <span className="font-bold text-ink block">{student.name}</span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">LRN: </span>
              <span className="font-mono font-bold text-ink block">{student.lrn}</span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">Grade & Section: </span>
              <span className="font-bold text-ink block">
                {student.gradeLevel} - {student.section}
              </span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">School Year: </span>
              <span className="font-bold text-ink block">{student.schoolYear}</span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">Sex: </span>
              <span className="font-medium text-ink block">{student.sex}</span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">Date of Birth: </span>
              <span className="font-medium text-ink block">{student.birthdate}</span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">Curriculum Track: </span>
              <span className="font-medium text-ink block">{student.trackStrand}</span>
            </div>
            <div>
              <span className="text-ink/60 font-normal">Class Adviser: </span>
              <span className="font-medium text-ink block">{student.adviser}</span>
            </div>
          </div>
        </div>

        {/* c) Academic Grades Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-tingub-blue mb-3">
            Academic Performance Summary (DO 015, s. 2026)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-tingub-blue text-white">
                  <th className="border border-ink/20 p-2 text-left font-bold">Learning Area / Subject</th>
                  <th className="border border-ink/20 p-1.5 text-center font-bold">Q1</th>
                  <th className="border border-ink/20 p-1.5 text-center font-bold">Q2</th>
                  <th className="border border-ink/20 p-1.5 text-center font-bold">Q3</th>
                  <th className="border border-ink/20 p-1.5 text-center font-bold">Q4</th>
                  <th className="border border-ink/20 p-2 text-center font-bold">Final Grade</th>
                  <th className="border border-ink/20 p-2 text-center font-bold">Rating</th>
                  <th className="border border-ink/20 p-2 text-center font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {student.subjects.map((sub, idx) => (
                  <tr key={idx} className="odd:bg-paper even:bg-white">
                    <td className="border border-ink/20 p-2 font-medium text-ink">{sub.name}</td>
                    <td className="border border-ink/20 p-1.5 text-center font-mono">{sub.q1}</td>
                    <td className="border border-ink/20 p-1.5 text-center font-mono">{sub.q2}</td>
                    <td className="border border-ink/20 p-1.5 text-center font-mono">{sub.q3}</td>
                    <td className="border border-ink/20 p-1.5 text-center font-mono">{sub.q4}</td>
                    <td className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-blue">
                      {sub.final}
                    </td>
                    <td className="border border-ink/20 p-2 text-center font-bold text-ink">{sub.rating}</td>
                    <td className="border border-ink/20 p-2 text-center font-bold text-tingub-green">
                      {sub.remarks}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-ink/10">
                  <td className="border border-ink/20 p-2 font-bold text-ink">General Average</td>
                  <td colSpan={4} className="border border-ink/20 p-2 text-center text-ink/60 font-normal">
                    Annual Summary
                  </td>
                  <td className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-blue text-sm">
                    {generalAvg.toFixed(2)}
                  </td>
                  <td className="border border-ink/20 p-2 text-center font-bold text-tingub-green">
                    {generalAvg >= 90 ? "Outstanding" : "Very Satisfactory"}
                  </td>
                  <td className="border border-ink/20 p-2 text-center font-bold text-tingub-green">
                    PROMOTED
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* d) Attendance Summary 2x2 Grid + Monthly Logs */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-tingub-blue mb-3">
            Attendance Summary & Monthly Breakdown
          </h3>

          {/* 2x2 Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-[8px] border border-ink/15 p-3 text-center bg-paper">
              <p className="text-2xl font-bold text-ink font-mono">{totalDays}</p>
              <p className="text-[11px] text-ink/60 font-normal">Days of School</p>
            </div>
            <div className="rounded-[8px] border border-ink/15 p-3 text-center bg-paper">
              <p className="text-2xl font-bold text-tingub-green font-mono">{totalPresent}</p>
              <p className="text-[11px] text-ink/60 font-normal">Days Present</p>
            </div>
            <div className="rounded-[8px] border border-ink/15 p-3 text-center bg-paper">
              <p className="text-2xl font-bold text-tingub-orange font-mono">{totalAbsent}</p>
              <p className="text-[11px] text-ink/60 font-normal">Days Absent</p>
            </div>
            <div className="rounded-[8px] border border-ink/15 p-3 text-center bg-paper">
              <p className="text-2xl font-bold text-tingub-blue font-mono">{attendancePct}%</p>
              <p className="text-[11px] text-ink/60 font-normal">Attendance Rate</p>
            </div>
          </div>

          {/* Monthly Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-tingub-green text-white">
                  <th className="border border-ink/20 p-2 text-left font-bold">Month</th>
                  {ATTENDANCE_MONTHS.map((m) => (
                    <th key={m.month} className="border border-ink/20 p-1 text-center font-bold min-w-[45px]">
                      {m.month.slice(0, 3)}
                    </th>
                  ))}
                  <th className="border border-ink/20 p-2 text-center font-bold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="odd:bg-paper">
                  <td className="border border-ink/20 p-2 font-medium">No. of School Days</td>
                  {ATTENDANCE_MONTHS.map((m) => (
                    <td key={m.month} className="border border-ink/20 p-1 text-center font-mono">
                      {m.days}
                    </td>
                  ))}
                  <td className="border border-ink/20 p-2 text-center font-mono font-bold">{totalDays}</td>
                </tr>
                <tr className="even:bg-white">
                  <td className="border border-ink/20 p-2 font-medium">No. of Days Present</td>
                  {ATTENDANCE_MONTHS.map((m) => (
                    <td key={m.month} className="border border-ink/20 p-1 text-center font-mono text-tingub-green">
                      {m.present}
                    </td>
                  ))}
                  <td className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-green">
                    {totalPresent}
                  </td>
                </tr>
                <tr className="odd:bg-paper">
                  <td className="border border-ink/20 p-2 font-medium">No. of Days Absent</td>
                  {ATTENDANCE_MONTHS.map((m) => (
                    <td key={m.month} className="border border-ink/20 p-1 text-center font-mono text-tingub-orange">
                      {m.absent}
                    </td>
                  ))}
                  <td className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-orange">
                    {totalAbsent}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* e) Signature Lines */}
        <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs border-t border-ink/20">
          <div>
            <div className="font-bold text-ink">{student.adviser}</div>
            <div className="border-t border-ink/40 mt-10 pt-1 font-normal text-ink/70">Class Adviser</div>
          </div>
          <div>
            <div className="font-bold text-ink">DR. LEAH M. ROSALES</div>
            <div className="border-t border-ink/40 mt-10 pt-1 font-normal text-ink/70">School Head / Principal</div>
          </div>
          <div>
            <div className="font-bold text-ink">PARENT / GUARDIAN</div>
            <div className="border-t border-ink/40 mt-10 pt-1 font-normal text-ink/70">
              Signature over Printed Name
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
