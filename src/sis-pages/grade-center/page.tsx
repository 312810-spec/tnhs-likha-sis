"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface StudentGradeRow {
  lrn: string;
  name: string;
  wwRaw: number;
  wwHigh: number;
  ptRaw: number;
  ptHigh: number;
  exRaw: number;
  exHigh: number;
}

const INITIAL_STUDENTS: StudentGradeRow[] = [
  { lrn: "109823471001", name: "Alvarez, Mateo Cruz", wwRaw: 42, wwHigh: 50, ptRaw: 88, ptHigh: 100, exRaw: 44, exHigh: 50 },
  { lrn: "109823471002", name: "Bautista, Chloe Reyes", wwRaw: 48, wwHigh: 50, ptRaw: 94, ptHigh: 100, exRaw: 47, exHigh: 50 },
  { lrn: "109823471003", name: "Dela Cruz, Juan Pedro", wwRaw: 38, wwHigh: 50, ptRaw: 76, ptHigh: 100, exRaw: 39, exHigh: 50 },
  { lrn: "109823471004", name: "Garcia, Sophia Santos", wwRaw: 45, wwHigh: 50, ptRaw: 90, ptHigh: 100, exRaw: 45, exHigh: 50 },
  { lrn: "109823471005", name: "Hernandez, Luis Miguel", wwRaw: 32, wwHigh: 50, ptRaw: 70, ptHigh: 100, exRaw: 35, exHigh: 50 },
  { lrn: "109823471006", name: "Lim, Maria Clara", wwRaw: 49, wwHigh: 50, ptRaw: 98, ptHigh: 100, exRaw: 49, exHigh: 50 },
];

export default function GradeCenterPage() {
  const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
  const [students, setStudents] = useState<StudentGradeRow[]>(INITIAL_STUDENTS);

  // DO 015, s. 2026 Core/Academic Weights: WW 20%, PT 50%, EX 30%
  const calculateGrade = (row: StudentGradeRow) => {
    const wwPct = row.wwHigh > 0 ? (row.wwRaw / row.wwHigh) * 100 : 0;
    const ptPct = row.ptHigh > 0 ? (row.ptRaw / row.ptHigh) * 100 : 0;
    const exPct = row.exHigh > 0 ? (row.exRaw / row.exHigh) * 100 : 0;

    const initialScore = wwPct * 0.2 + ptPct * 0.5 + exPct * 0.3;
    // Transmutation lookup optional; standard DO 015 s. 2026 raw score percentage
    const transmutedGrade = Math.round(initialScore);
    return { initialScore: initialScore.toFixed(2), transmutedGrade };
  };

  const handleInputChange = (
    index: number,
    field: keyof StudentGradeRow,
    val: number
  ) => {
    const next = [...students];
    next[index] = { ...next[index], [field]: val };
    setStudents(next);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-ink">Grade Center</h1>
          <p className="text-sm text-ink/60 font-normal">
            Select a quarter card to begin grade encoding for your assigned subject
          </p>
        </div>
      </div>

      {/* Quarter Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((qNum) => {
          const active = selectedQuarter === qNum;
          return (
            <div
              key={qNum}
              onClick={() => setSelectedQuarter(qNum)}
              className={`cursor-pointer rounded-[8px] p-5 border transition-all ${
                active
                  ? "border-tingub-blue bg-tingub-blue text-white"
                  : "border-ink/15 bg-paper hover:border-tingub-blue/50 text-ink"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    active ? "text-tingub-gold" : "text-ink/60"
                  }`}
                >
                  Grade Encoding
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-[8px] ${
                    active
                      ? "bg-tingub-gold text-[#12265C]"
                      : "bg-ink/10 text-ink/70"
                  }`}
                >
                  {active ? "Active" : "Select"}
                </span>
              </div>
              <h2 className="text-2xl font-bold mt-2">Quarter {qNum}</h2>
              <p
                className={`text-xs mt-1 font-normal ${
                  active ? "text-white/80" : "text-ink/60"
                }`}
              >
                {active
                  ? "Currently editing scores for Q" + qNum
                  : "Click to edit raw scores for Q" + qNum}
              </p>
            </div>
          );
        })}
      </div>

      {/* Grade Matrix Table */}
      <Card
        title={`Quarter ${selectedQuarter} — Grade Encoding Matrix`}
        subtitle="DO 015, s. 2026 Component Weightings: Written Works (20%), Performance Tasks (50%), Examinations (30%)"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-tingub-blue text-white">
                <th className="border border-white/20 p-2.5 text-left font-bold">Student Name</th>
                <th className="border border-white/20 p-2.5 text-center font-bold">LRN</th>
                <th className="border border-white/20 p-2 text-center font-bold" colSpan={2}>
                  Written Works (20%)
                </th>
                <th className="border border-white/20 p-2 text-center font-bold" colSpan={2}>
                  Performance Tasks (50%)
                </th>
                <th className="border border-white/20 p-2 text-center font-bold" colSpan={2}>
                  Quarter Exam (30%)
                </th>
                <th className="border border-white/20 p-2.5 text-center font-bold text-tingub-gold">
                  Initial %
                </th>
                <th className="border border-white/20 p-2.5 text-center font-bold">
                  Transmuted
                </th>
              </tr>
              <tr className="bg-tingub-blue/90 text-white text-[11px]">
                <th className="border border-white/20 p-1"></th>
                <th className="border border-white/20 p-1"></th>
                <th className="border border-white/20 p-1 text-center font-normal">Score</th>
                <th className="border border-white/20 p-1 text-center font-normal">Max</th>
                <th className="border border-white/20 p-1 text-center font-normal">Score</th>
                <th className="border border-white/20 p-1 text-center font-normal">Max</th>
                <th className="border border-white/20 p-1 text-center font-normal">Score</th>
                <th className="border border-white/20 p-1 text-center font-normal">Max</th>
                <th className="border border-white/20 p-1"></th>
                <th className="border border-white/20 p-1 font-normal">(Official)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/10">
              {students.map((stu, i) => {
                const { initialScore, transmutedGrade } = calculateGrade(stu);
                return (
                  <tr key={stu.lrn} className="hover:bg-ink/5">
                    <td className="border border-ink/10 p-2.5 font-medium text-ink">
                      {stu.name}
                    </td>
                    <td className="border border-ink/10 p-2.5 text-center font-mono text-ink/70">
                      {stu.lrn}
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <input
                        type="number"
                        value={stu.wwRaw}
                        onChange={(e) =>
                          handleInputChange(i, "wwRaw", Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono font-medium focus:border-tingub-blue"
                      />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <input
                        type="number"
                        value={stu.wwHigh}
                        onChange={(e) =>
                          handleInputChange(i, "wwHigh", Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono font-medium focus:border-tingub-blue"
                      />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <input
                        type="number"
                        value={stu.ptRaw}
                        onChange={(e) =>
                          handleInputChange(i, "ptRaw", Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono font-medium focus:border-tingub-blue"
                      />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <input
                        type="number"
                        value={stu.ptHigh}
                        onChange={(e) =>
                          handleInputChange(i, "ptHigh", Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono font-medium focus:border-tingub-blue"
                      />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <input
                        type="number"
                        value={stu.exRaw}
                        onChange={(e) =>
                          handleInputChange(i, "exRaw", Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono font-medium focus:border-tingub-blue"
                      />
                    </td>
                    <td className="border border-ink/10 p-2 text-center">
                      <input
                        type="number"
                        value={stu.exHigh}
                        onChange={(e) =>
                          handleInputChange(i, "exHigh", Number(e.target.value))
                        }
                        className="w-14 px-1.5 py-1 border border-ink/20 rounded-[8px] bg-paper text-center font-mono font-medium focus:border-tingub-blue"
                      />
                    </td>
                    <td className="border border-ink/10 p-2 text-center font-mono font-bold text-tingub-gold">
                      {initialScore}
                    </td>
                    <td className="border border-ink/10 p-2 text-center font-mono font-bold text-tingub-green text-sm">
                      {transmutedGrade}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end gap-3">
          <Button variant="secondary">Reset</Button>
          <Button variant="primary">Save changes</Button>
        </div>
      </Card>
    </div>
  );
}
