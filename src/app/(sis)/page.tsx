"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const QUARTERS = [
  { q: 1, label: "Quarter 1", color: "tingub-blue" },
  { q: 2, label: "Quarter 2", color: "tingub-green" },
  { q: 3, label: "Quarter 3", color: "tingub-gold" },
  { q: 4, label: "Quarter 4", color: "tingub-orange" },
];

const REPORTS = [
  { key: "cmss", label: "CMSS", desc: "Classroom Management & Scoring Summary", href: "/(sis)/reports?form=cmss" },
  { key: "grades", label: "GRADES", desc: "Full grade registry per section", href: "/(sis)/composite-grades" },
  { key: "iar", label: "IAR", desc: "Individual Academic Record", href: "/(sis)/individual-academic" },
  { key: "anecdotal", label: "ANECDOTAL", desc: "Behavior & achievement logs", href: "/(sis)/reports?form=anecdotal" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Grade Center - Quarter Selector Cards */}
      <section>
        <h2 className="text-lg font-bold text-ink mb-4">Grade Center</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {QUARTERS.map((q) => (
            <Link key={q.q} href={`/(sis)/grade-center?quarter=${q.q}`}>
              <div className="rounded-[8px] border border-ink/15 bg-paper p-6 text-center hover:border-tingub-blue/50 transition-colors cursor-pointer group">
                <div className={`w-12 h-12 mx-auto rounded-[8px] bg-tingub-blue text-white flex items-center justify-center text-lg font-bold mb-3 group-hover:scale-105 transition-transform`}>
                  Q{q.q}
                </div>
                <h3 className="text-sm font-bold text-ink">{q.label}</h3>
                <p className="text-xs text-ink/60 font-normal mt-1">Grade Encoding</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card title="" className="text-center">
          <p className="text-3xl font-bold text-tingub-blue">1,247</p>
          <p className="text-xs text-ink/60 font-normal">Total Enrolled</p>
        </Card>
        <Card title="" className="text-center">
          <p className="text-3xl font-bold text-tingub-green">42</p>
          <p className="text-xs text-ink/60 font-normal">Sections</p>\n          </Card>
        <Card title="" className="text-center">
          <p className="text-3xl font-bold text-tingub-gold">89%</p>
          <p className="text-xs text-ink/60 font-normal">Average Attendance</p>
        </Card>
        <Card title="" className="text-center">
          <p className="text-3xl font-bold text-tingub-orange">12</p>
          <p className="text-xs text-ink/60 font-normal">At Risk (SARDO)</p>
        </Card>
      </section>

      {/* Reports & Analytics */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-ink">Reports & Analytics</h2>
          <Link href="/(sis)/reports">
            <Button variant="secondary" size="sm">View All Reports</Button>
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {REPORTS.map((r) => (
            <Link key={r.key} href={r.href}>
              <div className="rounded-[8px] border border-ink/15 bg-paper p-4 hover:border-tingub-blue/50 transition-colors cursor-pointer h-full">
                <h3 className="text-sm font-bold text-ink">{r.label}</h3>
                <p className="text-xs text-ink/60 font-normal mt-1">{r.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* SARDO Card */}
        <div className="mt-4">
          <Link href="/(sis)/reports?form=sardo">
            <div className="rounded-[8px] border border-tingub-orange/30 bg-tingub-orange/5 p-4 flex items-center justify-between hover:border-tingub-orange/50 transition-colors cursor-pointer">
              <div>
                <h3 className="text-sm font-bold text-tingub-orange">SARDO</h3>
                <p className="text-xs text-ink/60 font-normal mt-1">Students at Risk of Dropping Out</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center rounded-[8px] bg-tingub-orange text-white px-2.5 py-1 text-xs font-bold">
                  12
                </span>
                <span className="text-xs text-tingub-orange font-medium">View Report &rarr;</span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-lg font-bold text-ink mb-4">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Link href="/(sis)/composite-grades">
            <div className="rounded-[8px] border border-ink/15 bg-paper p-4 hover:border-tingub-blue/50 transition-colors cursor-pointer">
              <h3 className="text-sm font-bold text-ink">Composite Grades</h3>
              <p className="text-xs text-ink/60 font-normal mt-1">View full grade registry</p>
            </div>
          </Link>
          <Link href="/(sis)/individual-academic">
            <div className="rounded-[8px] border border-ink/15 bg-paper p-4 hover:border-tingub-blue/50 transition-colors cursor-pointer">
              <h3 className="text-sm font-bold text-ink">Individual Academic</h3>
              <p className="text-xs text-ink/60 font-normal mt-1">Per-learner report card</p>
            </div>
          </Link>
          <Link href="/(sis)/certificate-generator">
            <div className="rounded-[8px] border border-ink/15 bg-paper p-4 hover:border-tingub-blue/50 transition-colors cursor-pointer">
              <h3 className="text-sm font-bold text-ink">Certificate Generator</h3>
              <p className="text-xs text-ink/60 font-normal mt-1">Academic excellence awards</p>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}

