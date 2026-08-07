"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { EnrollmentUploadForm } from "@/components/enrollment/EnrollmentUploadForm";
import { LoginForm } from "@/components/auth/LoginForm";
import { GradingEngineUI } from "@/components/grading/GradingEngineUI";
import { MasterTeacherReviewDashboard } from "@/components/review/MasterTeacherReviewDashboard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"theme" | "login" | "enrollment" | "grading" | "review">("grading");
  const [sampleStatus, setSampleStatus] = useState<"pending" | "approved" | "warning">("pending");

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
                TNHS LIKHA-SIS Design System & SIS Modules
              </h1>
            </div>
            <p className="text-xs text-ink/70 mt-0.5 font-normal">
              DepEd Order No. 015, s. 2026 Compliant • Theme, Authentication & Offline Grading Engine
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={activeTab === "grading" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("grading")}
            >
              Offline Grading Engine
            </Button>
            <Button
              variant={activeTab === "review" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("review")}
            >
              Master Teacher Review
            </Button>
            <Button
              variant={activeTab === "theme" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("theme")}
            >
              View Design System
            </Button>
            <Button
              variant={activeTab === "enrollment" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("enrollment")}
            >
              Enrollment Module
            </Button>
            <Button
              variant={activeTab === "login" ? "primary" : "secondary"}
              size="sm"
              onClick={() => setActiveTab("login")}
            >
              View Login Screen
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {activeTab === "grading" ? (
          <GradingEngineUI />
        ) : activeTab === "theme" ? (
          <div className="space-y-8">
            {/* 1. Color Palette Tokens */}
            <section className="space-y-3">
              <h2 className="text-lg font-bold text-ink">
                1. Official Color Tokens
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="rounded-[8px] border border-ink/15 p-4 bg-tingub-blue text-paper">
                  <div className="font-bold text-base">tingub-blue</div>
                  <div className="text-xs font-mono opacity-90 mt-1">#1B3B8C</div>
                  <div className="text-[10px] opacity-80 mt-2 font-normal">Primary Brand / Headers</div>
                </div>

                <div className="rounded-[8px] border border-ink/15 p-4 bg-tingub-green text-paper">
                  <div className="font-bold text-base">tingub-green</div>
                  <div className="text-xs font-mono opacity-90 mt-1">#1E6B3A</div>
                  <div className="text-[10px] opacity-80 mt-2 font-normal">Approved / Success</div>
                </div>

                <div className="rounded-[8px] border border-ink/15 p-4 bg-tingub-gold text-ink">
                  <div className="font-bold text-base">tingub-gold</div>
                  <div className="text-xs font-mono opacity-90 mt-1">#F5A623</div>
                  <div className="text-[10px] opacity-80 mt-2 font-normal">Pending / Verification</div>
                </div>

                <div className="rounded-[8px] border border-ink/15 p-4 bg-tingub-orange text-paper">
                  <div className="font-bold text-base">tingub-orange</div>
                  <div className="text-xs font-mono opacity-90 mt-1">#E8720C</div>
                  <div className="text-[10px] opacity-80 mt-2 font-normal">Warnings / Rejection</div>
                </div>

                <div className="rounded-[8px] border border-ink/15 p-4 bg-ink text-paper">
                  <div className="font-bold text-base">ink</div>
                  <div className="text-xs font-mono opacity-90 mt-1">#1A1A1A</div>
                  <div className="text-[10px] opacity-80 mt-2 font-normal">Primary Text & Borders</div>
                </div>

                <div className="rounded-[8px] border border-ink/25 p-4 bg-paper text-ink">
                  <div className="font-bold text-base">paper</div>
                  <div className="text-xs font-mono opacity-90 mt-1">#FAFAF8</div>
                  <div className="text-[10px] opacity-80 mt-2 font-normal">App Background / Surfaces</div>
                </div>
              </div>
            </section>

            {/* 2. Flat Component Primitives Showcase */}
            <section className="space-y-6">
              <h2 className="text-lg font-bold text-ink">
                2. Flat Component Primitives (8px Corner Radius, No Shadows, No Gradients)
              </h2>

              {/* Status Badges */}
              <Card
                title="Status Badges"
                subtitle="Use fixed status colors across all workflows"
              >
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="flex items-center gap-2">
                    <Badge status="approved" />
                    <span className="text-xs text-ink/70 font-normal">tingub-green</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status="pending" />
                    <span className="text-xs text-ink/70 font-normal">tingub-gold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status="warning" />
                    <span className="text-xs text-ink/70 font-normal">tingub-orange</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status="disabled" />
                    <span className="text-xs text-ink/70 font-normal">plain gray</span>
                  </div>
                </div>
              </Card>

              {/* Flat Buttons */}
              <Card
                title="Flat Buttons"
                subtitle="Buttons name the action they take — never generic Submit/OK"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3 items-center">
                    <Button variant="primary" onClick={() => alert("Save changes clicked")}>
                      Save changes
                    </Button>
                    <Button variant="approved" onClick={() => setSampleStatus("approved")}>
                      Approve
                    </Button>
                    <Button variant="warning" onClick={() => setSampleStatus("warning")}>
                      Reject
                    </Button>
                    <Button variant="secondary" onClick={() => setSampleStatus("pending")}>
                      Cancel record
                    </Button>
                    <Button disabled variant="primary">
                      Disabled action
                    </Button>
                  </div>
                  <p className="text-xs text-ink/60 font-normal">
                    Button label font weight: 500 (font-medium). All corners 8px. Flat style without gradients or drop shadows.
                  </p>
                </div>
              </Card>

              {/* Class Record Card Demo */}
              <Card
                title="Class Record #2026-Q1-MATH7"
                subtitle="Grade 7 Mathematics • Quarter 1 • Advisor: Maria Santos"
                action={
                  <div className="flex items-center gap-2">
                    <Badge status={sampleStatus} />
                  </div>
                }
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm font-normal">
                    <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
                      <div className="text-xs text-ink/60">Written Works (WW)</div>
                      <div className="font-bold text-base mt-0.5 text-tingub-blue">20% Weight</div>
                    </div>
                    <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
                      <div className="text-xs text-ink/60">Performance Tasks (PT)</div>
                      <div className="font-bold text-base mt-0.5 text-tingub-blue">50% Weight</div>
                    </div>
                    <div className="p-3 bg-ink/5 rounded-[8px] border border-ink/10">
                      <div className="text-xs text-ink/60">Quarterly Exam (EX)</div>
                      <div className="font-bold text-base mt-0.5 text-tingub-blue">30% Weight</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-ink/10">
                    <Button variant="approved" size="sm" onClick={() => setSampleStatus("approved")}>
                      Approve
                    </Button>
                    <Button variant="warning" size="sm" onClick={() => setSampleStatus("warning")}>
                      Reject
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => alert("Save changes clicked")}>
                      Save changes
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Flat Empty State */}
              <Card
                title="Empty State Component"
                subtitle="Explains what is missing and what to do next, in one short line"
              >
                <EmptyState
                  title="No quarterly class records found"
                  description="No class records have been submitted for Quarter 1 yet. Click below to add a new record."
                  actionLabel="Add class record"
                  onAction={() => alert("Add class record clicked")}
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
              </Card>
            </section>
          </div>
        ) : activeTab === "enrollment" ? (
          /* Enrollment Module Tab */
          <div className="space-y-4">
            <EnrollmentUploadForm />
          </div>
        ) : activeTab === "review" ? (
          /* Master Teacher Review & Approval Pipeline Tab */
          <div className="space-y-4">
            <MasterTeacherReviewDashboard />
          </div>
        ) : (
          /* Login Screen Tab */
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="p-4 bg-tingub-gold/15 border border-tingub-gold/30 rounded-[8px] text-xs text-ink font-normal">
              <strong>Requirement 5 Notice:</strong> The light sunburst pattern appears <em>only</em> behind the form on the login screen using <code>tingub-gold</code> and <code>tingub-orange</code> at low opacity to echo the school seal. Every other screen remains strictly flat and plain.
            </div>
            <LoginForm />
          </div>
        )}
      </main>

      <footer className="border-t border-ink/15 bg-paper px-6 py-4 text-center text-xs text-ink/60 font-normal">
        Tingub National High School Information System (TNHS LIKHA-SIS) • DepEd Order No. 015, s. 2026 Architecture
      </footer>
    </div>
  );
}
