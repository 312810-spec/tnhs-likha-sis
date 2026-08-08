"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import DepEdFormPreview from "@/components/modals/DepEdFormPreview";

const REPORTS = [
  { key: "cmss", label: "CMSS", desc: "Classroom Management & Scoring Summary", icon: "📊" },
  { key: "grades", label: "GRADES", desc: "Full grade registry per section", icon: "📈" },
  { key: "iar", label: "IAR", desc: "Individual Academic Record", icon: "📋" },
  { key: "anecdotal", label: "ANECDOTAL", desc: "Behavior & achievement logs", icon: "📝" },
];

function ReportsContent() {
  const searchParams = useSearchParams();
  const formParam = searchParams.get("form");

  const [showModal, setShowModal] = useState<boolean>(
    ["sf10", "sf9", "sf8", "sf2", "sardo", "cmss", "anecdotal"].includes(formParam || "")
  );
  const [activeForm, setActiveForm] = useState<string>(formParam || "sf10");

  const openForm = (key: string) => {
    setActiveForm(key);
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Reports & Analytics</h1>
        <p className="text-sm text-ink/60 font-normal">
          Generate, preview, and export official DepEd forms and analytics
        </p>
      </div>

      {/* Main Report Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {REPORTS.map((r) => (
          <div
            key={r.key}
            className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer"
            onClick={() => openForm(r.key)}
          >
            <div className="text-3xl mb-2">{r.icon}</div>
            <h3 className="text-base font-bold text-ink">{r.label}</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">{r.desc}</p>
          </div>
        ))}
      </div>

      {/* SARDO Card */}
      <div className="rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-tingub-orange">SARDO</h3>
            <span className="text-xs font-medium text-ink/70">
              (Students at Risk of Dropping Out)
            </span>
          </div>
          <p className="text-xs text-ink/60 font-normal mt-1">
            Identified learners requiring academic and attendance intervention
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center rounded-[8px] bg-tingub-orange text-white px-3 py-1 text-xs font-bold font-mono">
            12 Alerted
          </span>
          <Button variant="warning" size="sm" onClick={() => openForm("sardo")}>
            View Report →
          </Button>
        </div>
      </div>

      {/* DepEd Official Form Previews */}
      <div>
        <h2 className="text-base font-bold text-ink mb-3">DepEd Official School Forms</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { key: "sf10", label: "SF10 Permanent Record", desc: "Learner scholastic history" },
            { key: "sf9", label: "SF9 Progress Report Card", desc: "Quarterly official grades" },
            { key: "sf8", label: "SF8 Health Record", desc: "Height, weight, BMI matrix" },
            { key: "sf2", label: "SF2 Daily Attendance", desc: "Monthly daily attendance matrix" },
          ].map((f) => (
            <div
              key={f.key}
              className="rounded-[8px] border border-ink/15 bg-paper p-4 hover:border-tingub-blue transition-colors cursor-pointer"
              onClick={() => openForm(f.key)}
            >
              <span className="text-[10px] font-bold text-tingub-blue uppercase tracking-wider block mb-1">
                DepEd Form
              </span>
              <h3 className="text-sm font-bold text-ink">{f.label}</h3>
              <p className="text-xs text-ink/60 font-normal mt-1">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <DepEdFormPreview form={activeForm} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-xs text-ink/70">Loading reports...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
