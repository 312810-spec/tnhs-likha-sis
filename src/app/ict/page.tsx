import Link from "next/link";

export default function IctDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">ICT Coordinator Dashboard</h1>
        <p className="text-sm text-ink/60 font-normal">
          System administration, enrollment, and account management
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <Link href="/ict/learners">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Learner Registry</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Browse learners & filter missing SF10</p>
          </div>
        </Link>
        <Link href="/ict/bulk-import">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Bulk Learner Import</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Onboard learners from a CSV in one pass</p>
          </div>
        </Link>
        <Link href="/ict/enrollment">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Enrollment</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">SF10 upload & learner verification</p>
          </div>
        </Link>
        <Link href="/ict/accounts">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Account Management</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Provision teacher accounts</p>
          </div>
        </Link>
        <Link href="/ict/grade-center">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Grade Center</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Oversee grade encoding</p>
          </div>
        </Link>
        <Link href="/ict/composite-grades">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Composite Grades</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Full grade registry</p>
          </div>
        </Link>
        <Link href="/ict/reports">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Reports & Analytics</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Generate DepEd forms</p>
          </div>
        </Link>
        <Link href="/ict/forms">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Forms & IDs</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Official school forms</p>
          </div>
        </Link>
        <Link href="/ict/id-generator">
          <div className="rounded-[8px] border border-ink/15 bg-paper p-5 hover:border-tingub-blue/50 transition-colors cursor-pointer">
            <h3 className="text-sm font-bold text-ink">Student ID Generator</h3>
            <p className="text-xs text-ink/60 font-normal mt-1">Generate ID cards with QR</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
