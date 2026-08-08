import Link from "next/link";
import { Card } from "@/components/ui/Card";

const quickLinks = [
  { title: "Enrollment", description: "Monitor overall learner enrollment and roster health.", href: "/principal/enrollment", badge: "Enrollment" },
  { title: "Grade Center", description: "Track schoolwide grade encoding progress.", href: "/principal/grade-center", badge: "Grades" },
  { title: "Composite Grades", description: "Review the comprehensive grade registry.", href: "/principal/composite-grades", badge: "Registry" },
  { title: "Reports & Analytics", description: "Review reports and forms for school oversight.", href: "/principal/reports", badge: "Reports" },
  { title: "Forms & IDs", description: "Coordinate official school forms and IDs.", href: "/principal/forms", badge: "Forms" },
  { title: "Anecdotal Records", description: "Inspect learner behavior and achievement notes.", href: "/principal/anecdotal", badge: "Records" },
];

export default function PrincipalDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-[8px] border border-ink/15 bg-paper p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tingub-green">Principal</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Principal Dashboard</h1>
            <p className="mt-2 text-sm text-ink/70 font-normal">
              Maintain schoolwide oversight with the same polished shared navigation and card treatment as the other roles.
            </p>
          </div>
          <Link href="/principal/reports" className="inline-flex items-center justify-center rounded-[8px] border border-tingub-green/20 bg-tingub-green px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-tingub-green/90">
            Review reports
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((item) => (
          <Card key={item.href} title={item.title} subtitle={item.description} className="h-full">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full border border-tingub-green/20 bg-tingub-green/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-tingub-green">
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
