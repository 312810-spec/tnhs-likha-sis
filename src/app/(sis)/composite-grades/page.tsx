"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const SUBJECTS = [
  "Filipino",
  "English",
  "Mathematics",
  "Science",
  "AP",
  "EsP",
  "TLE",
  "MAPEH",
];

const COMPOSITE_STUDENTS = [
  {
    lrn: "109823471001",
    name: "Alvarez, Mateo Cruz",
    subjects: { Filipino: 88, English: 90, Mathematics: 85, Science: 87, AP: 89, EsP: 91, TLE: 86, MAPEH: 88 },
    qScores: [87, 88, 87, 89],
    finalGrade: 88,
    ga: 87.75,
    status: "PROMOTED",
  },
  {
    lrn: "109823471002",
    name: "Bautista, Chloe Reyes",
    subjects: { Filipino: 92, English: 95, Mathematics: 90, Science: 93, AP: 91, EsP: 96, TLE: 89, MAPEH: 94 },
    qScores: [92, 93, 91, 94],
    finalGrade: 93,
    ga: 92.50,
    status: "PROMOTED",
  },
  {
    lrn: "109823471003",
    name: "Dela Cruz, Juan Pedro",
    subjects: { Filipino: 78, English: 80, Mathematics: 75, Science: 79, AP: 81, EsP: 82, TLE: 77, MAPEH: 80 },
    qScores: [79, 78, 80, 81],
    finalGrade: 80,
    ga: 79.00,
    status: "PROMOTED",
  },
  {
    lrn: "109823471004",
    name: "Garcia, Sophia Santos",
    subjects: { Filipino: 89, English: 91, Mathematics: 88, Science: 90, AP: 87, EsP: 92, TLE: 86, MAPEH: 89 },
    qScores: [89, 90, 88, 91],
    finalGrade: 90,
    ga: 89.00,
    status: "PROMOTED",
  },
  {
    lrn: "109823471005",
    name: "Hernandez, Luis Miguel",
    subjects: { Filipino: 76, English: 75, Mathematics: 74, Science: 78, AP: 77, EsP: 79, TLE: 75, MAPEH: 76 },
    qScores: [75, 76, 77, 78],
    finalGrade: 77,
    ga: 76.25,
    status: "PROMOTED",
  },
  {
    lrn: "109823471006",
    name: "Lim, Maria Clara",
    subjects: { Filipino: 95, English: 97, Mathematics: 94, Science: 96, AP: 95, EsP: 98, TLE: 92, MAPEH: 96 },
    qScores: [95, 96, 94, 97],
    finalGrade: 96,
    ga: 95.38,
    status: "PROMOTED",
  },
];

export default function CompositeGradesPage() {
  const [selectedQuarter, setSelectedQuarter] = useState(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Composite Grades Summary</h1>
          <p className="text-sm text-ink/60 font-normal">
            Dense grade registry for all subjects and quarterly performances
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[1, 2, 3, 4].map((q) => (
            <button
              key={q}
              onClick={() => setSelectedQuarter(q)}
              className={
                "px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors " +
                (selectedQuarter === q
                  ? "bg-tingub-blue text-white font-bold"
                  : "bg-paper border border-ink/20 text-ink hover:bg-ink/5")
              }
            >
              Quarter {q}
            </button>
          ))}
          <div className="h-4 w-px bg-ink/20 mx-1 hidden sm:block" />
          <Button variant="secondary" size="sm">
            Export Excel
          </Button>
          <Button variant="secondary" size="sm">
            Export PDF
          </Button>
        </div>
      </div>

      <Card
        title={`Grade Registry — Quarter ${selectedQuarter} Summary`}
        subtitle="Learner LRN, Name, Subject Groupings, Quarterly Scores, Final Grade, General Average & Status"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-tingub-blue text-white">
                <th rowSpan={2} className="border border-white/20 p-2.5 text-left font-bold min-w-[120px]">
                  LRN
                </th>
                <th rowSpan={2} className="border border-white/20 p-2.5 text-left font-bold min-w-[160px]">
                  Student Name
                </th>
                <th colSpan={8} className="border border-white/20 p-2 text-center font-bold">
                  Subject Groupings (DO 015, s. 2026)
                </th>
                <th colSpan={4} className="border border-white/20 p-2 text-center font-bold">
                  Quarterly Scores
                </th>
                <th rowSpan={2} className="border border-white/20 p-2.5 text-center font-bold min-w-[80px]">
                  Final Grade
                </th>
                <th rowSpan={2} className="border border-white/20 p-2.5 text-center font-bold min-w-[90px]">
                  General Avg
                </th>
                <th rowSpan={2} className="border border-white/20 p-2.5 text-center font-bold min-w-[90px]">
                  Status
                </th>
              </tr>
              <tr className="bg-tingub-blue/90 text-white text-[11px]">
                {SUBJECTS.map((s) => (
                  <th key={s} className="border border-white/20 p-1.5 text-center font-normal">
                    {s}
                  </th>
                ))}
                <th className="border border-white/20 p-1 text-center font-normal">Q1</th>
                <th className="border border-white/20 p-1 text-center font-normal">Q2</th>
                <th className="border border-white/20 p-1 text-center font-normal">Q3</th>
                <th className="border border-white/20 p-1 text-center font-normal">Q4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {COMPOSITE_STUDENTS.map((stu) => (
                <tr key={stu.lrn} className="hover:bg-ink/5 odd:bg-paper even:bg-ink/5">
                  <td className="border border-ink/15 p-2 font-mono text-ink/80">{stu.lrn}</td>
                  <td className="border border-ink/15 p-2 font-medium text-ink">{stu.name}</td>
                  {SUBJECTS.map((s) => (
                    <td key={s} className="border border-ink/15 p-2 text-center font-mono font-normal">
                      {stu.subjects[s as keyof typeof stu.subjects] || "—"}
                    </td>
                  ))}
                  {stu.qScores.map((score, idx) => (
                    <td
                      key={idx}
                      className={`border border-ink/15 p-2 text-center font-mono ${
                        selectedQuarter === idx + 1 ? "bg-tingub-gold/20 font-bold" : ""
                      }`}
                    >
                      {score}
                    </td>
                  ))}
                  <td className="border border-ink/15 p-2 text-center font-mono font-bold text-tingub-blue">
                    {stu.finalGrade}
                  </td>
                  <td className="border border-ink/15 p-2 text-center font-mono font-bold text-ink">
                    {stu.ga.toFixed(2)}
                  </td>
                  <td className="border border-ink/15 p-2 text-center">
                    <span className="inline-flex items-center rounded-[8px] bg-tingub-green text-white px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">
                      {stu.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
