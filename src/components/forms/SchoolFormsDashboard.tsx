"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SF1SchoolRegister } from "./SF1SchoolRegister";
import { SF2AttendancePlaceholder } from "./SF2AttendancePlaceholder";
import { SF5ReportOnPromotion } from "./SF5ReportOnPromotion";
import { SF6SummarizedPromotionReport } from "./SF6SummarizedPromotionReport";
import { SF9ReportCard } from "./SF9ReportCard";
import { SF10PermanentRecord } from "./SF10PermanentRecord";
import { StudentIdCard } from "./StudentIdCard";

type FormTab =
  | "sf1"
  | "sf2"
  | "sf5"
  | "sf6"
  | "sf9"
  | "sf10"
  | "id";

const TABS: { key: FormTab; label: string }[] = [
  { key: "sf1", label: "SF1 Register" },
  { key: "sf2", label: "SF2/SF4 Attendance" },
  { key: "sf5", label: "SF5 Promotion" },
  { key: "sf6", label: "SF6 Summary" },
  { key: "sf9", label: "SF9 Report Card" },
  { key: "sf10", label: "SF10 Permanent" },
  { key: "id", label: "Student ID" },
];

/**
 * Consolidated DepEd School Forms & Student ID dashboard (Prompt 4).
 * SF3 (books), SF7 (personnel) and SF8 (health) are intentionally out of scope for
 * this build; SF2/SF4 show an "Attendance Log, coming soon" placeholder because
 * daily attendance data is not collected, per the build brief.
 */
export function SchoolFormsDashboard() {
  const [tab, setTab] = useState<FormTab>("sf1");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        {TABS.map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {tab === "sf1" && <SF1SchoolRegister />}
      {tab === "sf2" && <SF2AttendancePlaceholder />}
      {tab === "sf5" && <SF5ReportOnPromotion />}
      {tab === "sf6" && <SF6SummarizedPromotionReport />}
      {tab === "sf9" && <SF9ReportCard />}
      {tab === "sf10" && <SF10PermanentRecord />}
      {tab === "id" && <StudentIdCard />}
    </div>
  );
}
