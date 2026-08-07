"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  AnecdotalRecordsView,
  ANECDOTAL_SAMPLE_STUDENTS,
} from "@/components/anecdotal/AnecdotalRecordsView";

export default function StudentProfilePage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId || ANECDOTAL_SAMPLE_STUDENTS[0].id;
  const student =
    ANECDOTAL_SAMPLE_STUDENTS.find((s) => s.id === studentId) ||
    ANECDOTAL_SAMPLE_STUDENTS[0];

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Top Header Bar */}
      <header className="border-b border-ink/15 bg-paper px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-[8px] bg-tingub-blue text-paper flex items-center justify-center font-bold text-sm">
                TN
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                Learner Profile — {student.full_name}
              </h1>
            </div>
            <p className="text-xs text-ink/70 mt-0.5 font-normal">
              {student.grade_level} • LRN {studentId} • Anecdotal Records Module
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="secondary" size="sm">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <AnecdotalRecordsView
          studentId={student.id}
          studentName={student.full_name}
        />
      </main>

      <footer className="border-t border-ink/15 bg-paper px-6 py-4 text-center text-xs text-ink/60 font-normal">
        Tingub National High School Information System (TNHS LIKHA-SIS) • DepEd Order No. 015, s. 2026 Architecture
      </footer>
    </div>
  );
}
