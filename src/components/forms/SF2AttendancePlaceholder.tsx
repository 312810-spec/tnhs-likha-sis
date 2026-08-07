"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SCHOOL_YEAR } from "@/lib/formsData";
import { FormSheetHeader, PrintButton } from "./FormSheet";

/**
 * SF2 (Daily Attendance) and SF4 (Monthly Attendance) both need daily attendance
 * data that this build does not collect. Instead of showing a blank form, we show
 * an explicit "Attendance Log, coming soon" placeholder per the build brief.
 */
export function SF2AttendancePlaceholder() {
  return (
    <Card title="SF2 / SF4 — Attendance Log" subtitle="Daily and monthly attendance reporting">
      <div className="print:hidden pb-4">
        <PrintButton label="Print placeholder" />
      </div>

      <FormSheetHeader
        formLabel="Attendance Log (SF2 / SF4)"
        schoolYear={SCHOOL_YEAR}
      />

      <EmptyState
        title="Attendance Log, coming soon"
        description="SF2 (Daily Attendance) and SF4 (Monthly Attendance) require daily attendance data that this build does not yet collect. Once a daily attendance module lands, these forms will generate automatically from that data."
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
    </Card>
  );
}
