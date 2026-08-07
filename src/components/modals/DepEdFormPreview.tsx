"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface DepEdFormPreviewProps {
  form: string;
  onClose: () => void;
}

const STUDENTS = [
  { id: "std-1", name: "Alvarez, Mateo Cruz", lrn: "109823471001", grade: "Grade 7 - Sampaguita" },
  { id: "std-2", name: "Bautista, Chloe Reyes", lrn: "109823471002", grade: "Grade 7 - Sampaguita" },
  { id: "std-3", name: "Dela Cruz, Juan Pedro", lrn: "109823471003", grade: "Grade 7 - Sampaguita" },
  { id: "std-4", name: "Garcia, Sophia Santos", lrn: "109823471004", grade: "Grade 7 - Sampaguita" },
  { id: "std-5", name: "Hernandez, Luis Miguel", lrn: "109823471005", grade: "Grade 7 - Sampaguita" },
  { id: "std-6", name: "Lim, Maria Clara", lrn: "109823471006", grade: "Grade 7 - Sampaguita" },
];

export function DepEdFormPreview({ form, onClose }: DepEdFormPreviewProps) {
  const [activeFormTab, setActiveFormTab] = useState<string>(form || "sf10");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("std-1");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [bulkMode, setBulkMode] = useState<boolean>(false);
  const [arrangeSubjectsMode, setArrangeSubjectsMode] = useState<boolean>(false);

  const student = STUDENTS.find((s) => s.id === selectedStudentId) || STUDENTS[0];

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 10, 70));

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col overflow-hidden text-ink">
      {/* Top Toolbar Controls */}
      <div className="bg-[#12265C] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
        {/* Left: Title & Form Tabs */}
        <div className="flex items-center gap-3">
          <span className="font-bold text-sm text-tingub-gold tracking-wide uppercase">
            Interactive DepEd Form Preview
          </span>
          <div className="flex items-center gap-1 bg-white/10 rounded-[8px] p-1 border border-white/20">
            {["sf10", "sf9", "sf8", "sf2", "cmss", "sardo"].map((fKey) => (
              <button
                key={fKey}
                onClick={() => setActiveFormTab(fKey)}
                className={`px-2.5 py-1 text-xs font-bold rounded-[6px] transition-colors uppercase ${
                  activeFormTab === fKey
                    ? "bg-tingub-gold text-[#12265C]"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {fKey}
              </button>
            ))}
          </div>
        </div>

        {/* Center: Controls (Zoom, Student Selector, Arrange Subjects, Bulk Mode) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Student Selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/70 font-medium">Learner:</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-2.5 py-1 text-xs border border-white/30 rounded-[8px] bg-[#12265C] text-white font-medium focus:outline-none focus:border-tingub-gold"
            >
              {STUDENTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.lrn})
                </option>
              ))}
            </select>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/10 border border-white/20 rounded-[8px] px-2 py-0.5">
            <button
              onClick={handleZoomOut}
              className="px-1.5 py-0.5 text-xs font-bold hover:text-tingub-gold"
              title="Zoom Out"
            >
              -
            </button>
            <span className="text-xs font-mono font-bold px-1">{zoomLevel}%</span>
            <button
              onClick={handleZoomIn}
              className="px-1.5 py-0.5 text-xs font-bold hover:text-tingub-gold"
              title="Zoom In"
            >
              +
            </button>
          </div>

          {/* Arrange Subjects */}
          <button
            onClick={() => setArrangeSubjectsMode(!arrangeSubjectsMode)}
            className={`px-3 py-1 text-xs font-medium rounded-[8px] border transition-colors ${
              arrangeSubjectsMode
                ? "bg-tingub-gold text-[#12265C] border-tingub-gold font-bold"
                : "border-white/30 text-white hover:bg-white/10"
            }`}
          >
            {arrangeSubjectsMode ? "Done Arranging" : "Arrange Subjects"}
          </button>

          {/* Bulk Mode */}
          <button
            onClick={() => setBulkMode(!bulkMode)}
            className={`px-3 py-1 text-xs font-medium rounded-[8px] border transition-colors ${
              bulkMode
                ? "bg-tingub-orange text-white border-tingub-orange font-bold"
                : "border-white/30 text-white hover:bg-white/10"
            }`}
          >
            Bulk Mode: {bulkMode ? "ON" : "OFF"}
          </button>
        </div>

        {/* Right: Close Button */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-tingub-orange transition-colors font-bold text-sm"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>

      {/* Form Content Preview Body */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-ink/10 flex justify-center">
        <div
          className="bg-white rounded-[8px] shadow-xl p-6 sm:p-8 w-full max-w-5xl transition-transform duration-150 border border-ink/15"
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "top center" }}
        >
          {/* SF10 PREVIEW */}
          {activeFormTab === "sf10" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-tingub-blue">
                    SF10 — Learner Permanent Academic Record
                  </h2>
                  <p className="text-xs text-ink/60">
                    Scholastic history record per DepEd Order No. 015, s. 2026
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    Export SF10 to PDF
                  </Button>
                  <Button variant="secondary" size="sm">
                    Print Front
                  </Button>
                  <Button variant="secondary" size="sm">
                    Print Back
                  </Button>
                </div>
              </div>

              {/* Student Demographics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-paper p-3 rounded-[8px] border border-ink/15">
                <div>
                  <span className="text-ink/60">Learner Name:</span>{" "}
                  <span className="font-bold text-ink">{student.name}</span>
                </div>
                <div>
                  <span className="text-ink/60">LRN:</span>{" "}
                  <span className="font-mono font-bold">{student.lrn}</span>
                </div>
                <div>
                  <span className="text-ink/60">Grade Level:</span>{" "}
                  <span className="font-medium">{student.grade}</span>
                </div>
                <div>
                  <span className="text-ink/60">School:</span>{" "}
                  <span className="font-medium">Tingub NHS (303080)</span>
                </div>
              </div>

              {/* Scholastic History Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-tingub-blue text-white">
                      <th className="border border-white/20 p-2 text-left font-bold">School Year</th>
                      <th className="border border-white/20 p-2 text-left font-bold">Grade / Section</th>
                      <th className="border border-white/20 p-2 text-left font-bold">Learning Area</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Final Rating</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Action Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { sy: "2023-2024", gr: "Grade 5 - Sampaguita", sub: "Filipino, English, Math, Science, AP, EsP, TLE, MAPEH", rating: 88.5, action: "PASSED" },
                      { sy: "2024-2025", gr: "Grade 6 - Rose", sub: "Filipino, English, Math, Science, AP, EsP, TLE, MAPEH", rating: 90.25, action: "PASSED" },
                      { sy: "2025-2026", gr: "Grade 7 - Sampaguita", sub: "Filipino, English, Math, Science, AP, EsP, TLE, MAPEH", rating: 89.75, action: "PASSED" },
                    ].map((row, idx) => (
                      <tr key={idx} className="odd:bg-paper even:bg-white">
                        <td className="border border-ink/15 p-2 font-mono">{row.sy}</td>
                        <td className="border border-ink/15 p-2 font-medium">{row.gr}</td>
                        <td className="border border-ink/15 p-2 text-ink/80">{row.sub}</td>
                        <td className="border border-ink/15 p-2 text-center font-mono font-bold text-tingub-blue">
                          {row.rating.toFixed(2)}
                        </td>
                        <td className="border border-ink/15 p-2 text-center font-bold text-tingub-green">
                          {row.action}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SF9 PREVIEW */}
          {activeFormTab === "sf9" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-tingub-blue">
                    SF9 — Learner Progress Report Card
                  </h2>
                  <p className="text-xs text-ink/60">
                    Transmuted Grade shown as official grade (DO 015, s. 2026)
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    Export SF9 to PDF
                  </Button>
                  <Button variant="secondary" size="sm">
                    Print Front
                  </Button>
                  <Button variant="secondary" size="sm">
                    Print Back
                  </Button>
                </div>
              </div>

              {/* Progress Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-tingub-blue text-white">
                      <th className="border border-white/20 p-2 text-left font-bold">Learning Area</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Q1</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Q2</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Q3</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Q4</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Final Grade</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Filipino", q1: 88, q2: 89, q3: 88, q4: 90, final: 89, remarks: "Passed" },
                      { name: "English", q1: 90, q2: 91, q3: 92, q4: 91, final: 91, remarks: "Passed" },
                      { name: "Mathematics", q1: 85, q2: 86, q3: 87, q4: 86, final: 86, remarks: "Passed" },
                      { name: "Science", q1: 87, q2: 88, q3: 89, q4: 88, final: 88, remarks: "Passed" },
                    ].map((row, idx) => (
                      <tr key={idx} className="odd:bg-paper even:bg-white">
                        <td className="border border-ink/15 p-2 font-medium">{row.name}</td>
                        <td className="border border-ink/15 p-2 text-center font-mono">{row.q1}</td>
                        <td className="border border-ink/15 p-2 text-center font-mono">{row.q2}</td>
                        <td className="border border-ink/15 p-2 text-center font-mono">{row.q3}</td>
                        <td className="border border-ink/15 p-2 text-center font-mono">{row.q4}</td>
                        <td className="border border-ink/15 p-2 text-center font-mono font-bold text-tingub-blue">
                          {row.final}
                        </td>
                        <td className="border border-ink/15 p-2 text-center font-bold text-tingub-green">
                          {row.remarks}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SF8 PREVIEW */}
          {activeFormTab === "sf8" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-tingub-blue">
                    SF8 — Learner Health and Nutrition Report
                  </h2>
                  <p className="text-xs text-ink/60">
                    Annual physical fitness and BMI baseline monitoring table
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    Export Excel (.xlsx)
                  </Button>
                  <Button variant="secondary" size="sm">
                    Export SF8 to PDF
                  </Button>
                </div>
              </div>

              {/* Health Matrix */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-tingub-green text-white">
                      <th className="border border-white/20 p-2 text-left font-bold">LRN</th>
                      <th className="border border-white/20 p-2 text-left font-bold">Student Name</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Age</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Height (m)</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Weight (kg)</th>
                      <th className="border border-white/20 p-2 text-center font-bold">BMI</th>
                      <th className="border border-white/20 p-2 text-center font-bold">BMI Category</th>
                      <th className="border border-white/20 p-2 text-center font-bold">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STUDENTS.map((s, i) => {
                      const height = 1.45 + i * 0.03;
                      const weight = 38 + i * 2.5;
                      const bmi = (weight / (height * height)).toFixed(1);
                      const cat = Number(bmi) < 18.5 ? "Underweight" : Number(bmi) <= 24.9 ? "Normal" : "Overweight";
                      return (
                        <tr key={s.id} className="odd:bg-paper even:bg-white">
                          <td className="border border-ink/15 p-2 font-mono text-ink/70">{s.lrn}</td>
                          <td className="border border-ink/15 p-2 font-medium">{s.name}</td>
                          <td className="border border-ink/15 p-2 text-center font-mono">13</td>
                          <td className="border border-ink/15 p-2 text-center font-mono">{height.toFixed(2)}</td>
                          <td className="border border-ink/15 p-2 text-center font-mono">{weight.toFixed(1)}</td>
                          <td className="border border-ink/15 p-2 text-center font-mono font-bold">{bmi}</td>
                          <td className="border border-ink/15 p-2 text-center font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-[6px] text-[10px] uppercase ${
                                cat === "Normal"
                                  ? "bg-tingub-green text-white"
                                  : "bg-tingub-orange text-white"
                              }`}
                            >
                              {cat}
                            </span>
                          </td>
                          <td className="border border-ink/15 p-2 text-center text-ink/70">
                            Healthy Growth
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SF2 PREVIEW */}
          {activeFormTab === "sf2" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-tingub-blue">
                    SF2 — Daily Attendance Tracking Matrix
                  </h2>
                  <p className="text-xs text-ink/60">
                    Monthly daily attendance monitoring log matrix
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm">
                    Export Excel (.xlsx)
                  </Button>
                  <Button variant="secondary" size="sm">
                    Export PDF (.pdf)
                  </Button>
                  <Button variant="secondary" size="sm">
                    Print Document
                  </Button>
                </div>
              </div>

              {/* Matrix Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-tingub-blue text-white">
                      <th className="border border-white/20 p-2 text-left font-bold min-w-[140px]">Student Name</th>
                      {[...Array(20)].map((_, d) => (
                        <th key={d} className="border border-white/20 p-1 text-center font-mono text-[10px]">
                          {d + 1}
                        </th>
                      ))}
                      <th className="border border-white/20 p-1.5 text-center font-bold">Present</th>
                      <th className="border border-white/20 p-1.5 text-center font-bold">Absent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STUDENTS.map((s, idx) => (
                      <tr key={s.id} className="odd:bg-paper even:bg-white">
                        <td className="border border-ink/15 p-2 font-medium">{s.name}</td>
                        {[...Array(20)].map((_, d) => {
                          const isAbsent = (idx + d) % 9 === 0;
                          return (
                            <td
                              key={d}
                              className={`border border-ink/15 p-1 text-center font-mono font-bold ${
                                isAbsent ? "text-tingub-orange bg-tingub-orange/10" : "text-tingub-green"
                              }`}
                            >
                              {isAbsent ? "A" : "P"}
                            </td>
                          );
                        })}
                        <td className="border border-ink/15 p-1.5 text-center font-mono font-bold text-tingub-green">
                          18
                        </td>
                        <td className="border border-ink/15 p-1.5 text-center font-mono font-bold text-tingub-orange">
                          2
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CMSS & SARDO Fallbacks */}
          {["cmss", "sardo"].includes(activeFormTab) && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4">
                <div>
                  <h2 className="text-lg font-bold text-tingub-orange uppercase">
                    {activeFormTab === "sardo"
                      ? "SARDO — Students at Risk of Dropping Out Report"
                      : "CMSS — Classroom Management & Scoring Summary"}
                  </h2>
                  <p className="text-xs text-ink/60">
                    Comprehensive intervention and academic tracker
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    Export Excel
                  </Button>
                  <Button variant="secondary" size="sm">
                    Print Report
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-[8px] border border-tingub-orange/30 bg-tingub-orange/5 text-xs text-ink">
                <p className="font-bold text-tingub-orange mb-1">
                  Alert Counter: 12 Students Identified
                </p>
                <p className="text-ink/70">
                  Targeted intervention plans logged for academic deficiency and attendance thresholds under DepEd Order No. 015, s. 2026.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DepEdFormPreview;
