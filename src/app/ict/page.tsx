import Link from "next/link";
import { Card } from "@/components/ui/Card";

const quickLinks = [
  { title: "Learner Registry", description: "Browse learners and flag missing SF10 records.", href: "/ict/learners", badge: "Registry" },
  { title: "Bulk Learner Import", description: "Onboard learners from a CSV in one pass.", href: "/ict/bulk-import", badge: "Import" },
  { title: "Enrollment", description: "Manage SF10 uploads and learner verification.", href: "/ict/enrollment", badge: "Enrollment" },
  { title: "Account Management", description: "Provision teacher and staff accounts.", href: "/ict/accounts", badge: "Accounts" },
  { title: "Grade Center", description: "Oversee grade encoding and data quality.", href: "/ict/grade-center", badge: "Grades" },
  { title: "Composite Grades", description: "Inspect the full grade registry at a glance.", href: "/ict/composite-grades", badge: "Reports" },
  { title: "Reports & Analytics", description: "Generate DepEd forms and summary reports.", href: "/ict/reports", badge: "Reports" },
  { title: "Forms & IDs", description: "Coordinate official school forms and student IDs.", href: "/ict/forms", badge: "Forms" },
  { title: "Student ID Generator", description: "Generate ID cards with QR support.", href: "/ict/id-generator", badge: "IDs" },
];

export default function IctDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-[8px] border border-ink/15 bg-paper p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tingub-blue">ICT coordinator</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Coordinator Dashboard</h1>
            <p className="mt-2 text-sm text-ink/70 font-normal">
              Administer accounts, enrollment tasks, and learner data with the same shared navigation shell used across the system.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/ict/accounts" className="inline-flex items-center justify-center rounded-[8px] border border-tingub-blue/20 bg-tingub-blue px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-tingub-blue/90">
              Manage accounts
            </Link>
            <Link href="/ict/enrollment" className="inline-flex items-center justify-center rounded-[8px] border border-ink/20 bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5">
              Review enrollment
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => (
          <Card key={item.href} title={item.title} subtitle={item.description} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-tingub-blue/20 bg-tingub-blue/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tingub-blue">
                {item.badge}
              </span>
              <Link href={item.href} className="inline-flex items-center justify-center rounded-[8px] border border-ink/20 bg-paper px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-ink/5">
                Open
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
