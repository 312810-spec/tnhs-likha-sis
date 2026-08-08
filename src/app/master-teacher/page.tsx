import Link from "next/link";
import { Card } from "@/components/ui/Card";

const quickLinks = [
  { title: "Review & Approval", description: "Check pending submissions and approve or reject them.", href: "/master-teacher/review", badge: "Pending" },
  { title: "Grade Center", description: "Review the current grade encoding state.", href: "/master-teacher/grade-center", badge: "Grades" },
  { title: "Composite Grades", description: "Inspect the broader grade registry.", href: "/master-teacher/composite-grades", badge: "Registry" },
  { title: "Reports & Analytics", description: "Prepare schoolwide summaries and forms.", href: "/master-teacher/reports", badge: "Reports" },
  { title: "Individual Academic", description: "Review an individual learner’s record.", href: "/master-teacher/individual-academic", badge: "Learner" },
  { title: "Certificate Generator", description: "Issue award certificates for excellence.", href: "/master-teacher/certificate-generator", badge: "Awards" },
  { title: "Anecdotal Records", description: "Review behavior and achievement notes.", href: "/master-teacher/anecdotal", badge: "Records" },
];

export default function MasterTeacherDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-[8px] border border-ink/15 bg-paper p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tingub-orange">Master teacher</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Master Teacher Dashboard</h1>
            <p className="mt-2 text-sm text-ink/70 font-normal">
              Review submissions, verify compliance, and guide the approval pipeline from a consistent dashboard shell.
            </p>
          </div>
          <Link href="/master-teacher/review" className="inline-flex items-center justify-center rounded-[8px] border border-tingub-orange/20 bg-tingub-orange px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-tingub-orange/90">
            Review pending
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => (
          <Card key={item.href} title={item.title} subtitle={item.description} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-tingub-orange/20 bg-tingub-orange/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tingub-orange">
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
