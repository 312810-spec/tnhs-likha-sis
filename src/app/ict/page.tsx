"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { AccountManagementForm } from "@/components/ict/AccountManagementForm";

export default function IctCoordinatorPage() {
  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="border-b border-ink/15 bg-paper px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-[8px] bg-tingub-blue text-paper flex items-center justify-center font-bold text-sm">
                TN
              </span>
              <h1 className="text-xl font-bold tracking-tight text-ink">
                ICT Coordinator — Account Management
              </h1>
            </div>
            <p className="text-xs text-ink/70 mt-0.5 font-normal">
              Provision teacher / master_teacher accounts through a server-side Edge Function • Service role key never reaches the browser • DepEd Order No. 015, s. 2026
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        <AccountManagementForm />
      </main>

      <footer className="border-t border-ink/15 bg-paper px-6 py-4 text-center text-xs text-ink/60 font-normal">
        Tingub National High School Information System (TNHS LIKHA-SIS) • DepEd Order No. 015, s. 2026 Architecture
      </footer>
    </div>
  );
}
