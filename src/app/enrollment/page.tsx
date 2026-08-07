"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EnrollmentUploadForm } from "@/components/enrollment/EnrollmentUploadForm";

export default function EnrollmentPage() {
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
                TNHS LIKHA-SIS Learner Enrollment
              </h1>
            </div>
            <p className="text-xs text-ink/70 mt-0.5 font-normal">
              ICT Coordinator SF10 Upload & Manual Enrollment Baseline • DepEd Order No. 015, s. 2026
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
        <div className="mb-6 p-4 bg-tingub-blue/10 border border-tingub-blue/20 rounded-[8px] flex items-start justify-between gap-4">
          <div>
            <h2 className="font-bold text-sm text-tingub-blue">
              SF10 Document Upload & Learner Verification Workflow
            </h2>
            <p className="text-xs text-ink/80 mt-1 font-normal">
              Upload the learner&apos;s SF10 permanent record file into private bucket <code>sf10-uploads</code>.
              Read the document preview and manually enter the learner profile details. Duplicate LRNs will be blocked.
            </p>
          </div>
        </div>

        {/* Enrollment Component */}
        <EnrollmentUploadForm />
      </main>

      <footer className="border-t border-ink/15 bg-paper px-6 py-4 text-center text-xs text-ink/60 font-normal">
        Tingub National High School Information System (TNHS LIKHA-SIS) • DepEd Order No. 015, s. 2026 Architecture
      </footer>
    </div>
  );
}
