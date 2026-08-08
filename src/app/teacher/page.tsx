import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function TeacherDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Teacher Dashboard</h1>
        <p className="text-sm text-ink/60 font-normal">
          Manage grades, reports, and learner records
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link href="/teacher/grade-center">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Grade Center</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Encode quarterly grades</p>
          </div>
        </Link>
        <Link href="/teacher/composite-grades">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Composite Grades</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">View full grade registry</p>
          </div>
        </Link>
        <Link href="/teacher/reports">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Reports & Analytics</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Generate DepEd forms</p>
          </div>
        </Link>
        <Link href="/teacher/individual-academic">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Individual Academic</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Per-learner report card</p>
          </div>
        </Link>
        <Link href="/teacher/certificate-generator">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Certificate Generator</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Academic excellence awards</p>
          </div>
        </Link>
        <Link href="/teacher/anecdotal">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Anecdotal Records</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Behavior & achievement logs</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
