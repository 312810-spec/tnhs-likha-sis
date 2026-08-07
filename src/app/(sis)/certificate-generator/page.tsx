"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

interface AwardCandidate {
  id: string;
  name: string;
  lrn: string;
  gradeSection: string;
  ga: number;
  honor: string;
  schoolYear: string;
  dateGiven: string;
}

const CANDIDATES: AwardCandidate[] = [
  {
    id: "std-6",
    name: "MARIA CLARA LIM",
    lrn: "109823471006",
    gradeSection: "Grade 7 - Sampaguita",
    ga: 95.38,
    honor: "With Highest Honors",
    schoolYear: "2025-2026",
    dateGiven: "April 10, 2026",
  },
  {
    id: "std-2",
    name: "CHLOE REYES BAUTISTA",
    lrn: "109823471002",
    gradeSection: "Grade 7 - Sampaguita",
    ga: 92.50,
    honor: "With High Honors",
    schoolYear: "2025-2026",
    dateGiven: "April 10, 2026",
  },
  {
    id: "std-4",
    name: "SOPHIA SANTOS GARCIA",
    lrn: "109823471004",
    gradeSection: "Grade 7 - Sampaguita",
    ga: 89.00,
    honor: "With Honors",
    schoolYear: "2025-2026",
    dateGiven: "April 10, 2026",
  },
  {
    id: "std-1",
    name: "MATEO CRUZ ALVAREZ",
    lrn: "109823471001",
    gradeSection: "Grade 7 - Sampaguita",
    ga: 87.75,
    honor: "With Honors",
    schoolYear: "2025-2026",
    dateGiven: "April 10, 2026",
  },
];

export default function CertificateGeneratorPage() {
  const [selectedId, setSelectedId] = useState<string>("std-6");
  const candidate = CANDIDATES.find((c) => c.id === selectedId) || CANDIDATES[0];
  const [honorLevel, setHonorLevel] = useState<string>(candidate.honor);

  return (
    <div className="space-y-6">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-ink">Certificate Generator</h1>
          <p className="text-sm text-ink/60 font-normal">
            Generate and print official DepEd Academic Excellence Award certificates
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="text-xs font-medium text-ink mr-2">Candidate:</label>
            <select
              value={selectedId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedId(id);
                const found = CANDIDATES.find((c) => c.id === id);
                if (found) setHonorLevel(found.honor);
              }}
              className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-sm font-medium focus:outline-none focus:border-tingub-blue"
            >
              {CANDIDATES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.ga.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-ink mr-2">Honor Award:</label>
            <select
              value={honorLevel}
              onChange={(e) => setHonorLevel(e.target.value)}
              className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-sm font-medium focus:outline-none focus:border-tingub-blue"
            >
              <option value="With Honors">With Honors</option>
              <option value="With High Honors">With High Honors</option>
              <option value="With Highest Honors">With Highest Honors</option>
            </select>
          </div>
          <Button variant="primary" size="sm" onClick={() => window.print()}>
            Print Certificate
          </Button>
        </div>
      </div>

      {/* Formal Printable Certificate Layout */}
      <div className="bg-white p-6 sm:p-10 rounded-[8px] border border-ink/15 print:p-0 print:border-none flex justify-center">
        <div
          className="w-full max-w-4xl bg-[#FAFAF8] p-8 sm:p-12 relative text-ink border-[6px] border-double border-[#1B3B8C] shadow-lg print:shadow-none print:w-full print:max-w-none"
          style={{ minHeight: "650px" }}
        >
          {/* Inner Accent Line */}
          <div className="border border-[#F5A623] p-6 sm:p-8 h-full flex flex-col justify-between text-center relative">
            {/* Header / Seals Block */}
            <div className="flex items-center justify-between px-4 mb-4">
              {/* DepEd Seal Crest Icon */}
              <div className="w-16 h-16 rounded-full bg-[#1E6B3A]/10 border border-[#1E6B3A]/30 flex items-center justify-center text-[#1E6B3A] font-bold text-xs">
                DepEd Seal
              </div>

              {/* Header Text */}
              <div className="space-y-0.5">
                <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/70">
                  Republic of the Philippines
                </p>
                <p className="text-sm font-bold text-[#1A1A1A]">Department of Education</p>
                <p className="text-xs font-medium text-[#1A1A1A]/80">
                  REGION VII — CENTRAL VISAYAS | DIVISION OF MANDAUE CITY
                </p>
                <p className="text-base font-bold text-[#1B3B8C] tracking-wide">
                  TINGUB NATIONAL HIGH SCHOOL
                </p>
                <p className="text-[10px] text-[#1A1A1A]/60">School ID: 303080</p>
              </div>

              {/* Tingub NHS Crest Icon */}
              <div className="w-16 h-16 rounded-full bg-[#1B3B8C]/10 border border-[#1B3B8C]/30 flex items-center justify-center text-[#1B3B8C] font-bold text-xs">
                TNHS Crest
              </div>
            </div>

            {/* Title */}
            <div className="my-4">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B3B8C] tracking-widest uppercase font-serif">
                Academic Excellence Award
              </h1>
              <p className="text-xs text-[#E8720C] font-bold uppercase tracking-widest mt-1">
                DepEd Order No. 015, s. 2026
              </p>
            </div>

            {/* Award Body */}
            <div className="space-y-4 my-6">
              <p className="text-xs text-[#1A1A1A]/80 italic">This certificate of recognition is proudly presented to</p>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-[#1A1A1A] tracking-wider underline decoration-[#F5A623] decoration-2 underline-offset-8">
                {candidate.name}
              </h2>

              <p className="text-xs font-mono text-[#1A1A1A]/70">
                LRN: {candidate.lrn} | {candidate.gradeSection}
              </p>

              <p className="text-sm text-[#1A1A1A]/90 leading-relaxed max-w-2xl mx-auto font-normal">
                for outstanding academic achievement and exemplary performance during the School Year{" "}
                <span className="font-bold">{candidate.schoolYear}</span>, having obtained a General Average of{" "}
                <span className="font-bold text-[#1B3B8C] font-mono text-base">
                  {candidate.ga.toFixed(2)}
                </span>
                , hereby conferring the distinction of
              </p>

              <div className="inline-block bg-[#F5A623]/20 border border-[#F5A623] px-6 py-2 rounded-[8px]">
                <span className="text-xl sm:text-2xl font-black text-[#12265C] tracking-wide uppercase">
                  {honorLevel}
                </span>
              </div>
            </div>

            {/* Date & Location */}
            <p className="text-xs text-[#1A1A1A]/70 font-normal">
              Given this <span className="font-medium">{candidate.dateGiven}</span> at Tingub National High School, Mandaue City, Philippines.
            </p>

            {/* Signature Lines */}
            <div className="grid grid-cols-2 gap-12 pt-10 text-xs text-center">
              <div>
                <p className="font-bold text-[#1A1A1A]">MARIA SANTOS, LPT</p>
                <div className="border-t border-[#1A1A1A]/50 mt-8 pt-1 text-[11px] text-[#1A1A1A]/70 font-medium">
                  Class Adviser
                </div>
              </div>
              <div>
                <p className="font-bold text-[#1A1A1A]">DR. LEAH M. ROSALES</p>
                <div className="border-t border-[#1A1A1A]/50 mt-8 pt-1 text-[11px] text-[#1A1A1A]/70 font-medium">
                  School Head / Principal
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
