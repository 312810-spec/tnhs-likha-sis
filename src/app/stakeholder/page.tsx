import Link from "next/link";
import { Card } from "@/components/ui/Card";

const quickLinks = [
  { title: "Progress Card (SF9)", description: "View official quarterly grades for the linked learner.", href: "/stakeholder/progress-card", badge: "Grades" },
  { title: "Anecdotal Records", description: "Review behavior and achievement notes for the linked learner.", href: "/stakeholder/anecdotal", badge: "Records" },
];

export default function StakeholderDashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-[8px] border border-ink/15 bg-paper p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-tingub-blue">Stakeholder</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink">Stakeholder Portal</h1>
            <p className="mt-2 text-sm text-ink/70 font-normal">
              Review a linked learner’s progress card and anecdotal records from a clean, role-specific view.
            </p>
          </div>
          <Link href="/stakeholder/progress-card" className="inline-flex items-center justify-center rounded-[8px] border border-tingub-blue/20 bg-tingub-blue px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-tingub-blue/90">
            View progress card
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
