import Link from "next/link";

export default function StakeholderDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Stakeholder Portal</h1>
        <p className="text-sm text-ink/60 font-normal">
          View progress cards and anecdotal records for linked learners
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link href="/stakeholder/progress-card">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Progress Card (SF9)</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Official quarterly grades</p>
          </div>
        </Link>
        <Link href="/stakeholder/anecdotal">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Anecdotal Records</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Behavior & achievement logs</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
