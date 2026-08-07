"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";
import {
  AnecdotalCategory,
  AnecdotalRecord,
  UserRole,
} from "@/types/database.types";

// -----------------------------------------------------------------------------
// Supabase client adapter.
// The installed supabase-js build does not resolve typed `.insert()` rows for any
// table in this worktree (existing tables behave the same), so the repo casts the
// client through `unknown` (see EnrollmentUploadForm). We keep full type safety on
// the anecdotal payloads while matching that convention.
// -----------------------------------------------------------------------------
type AnecdotalLoadResult = { data: AnecdotalRecord[] | null; error: unknown };
type AnecdotalMutationResult = { error: unknown };
export type AnecdotalInsert = Omit<AnecdotalRecord, "id" | "created_at">;

interface AnecdotalSelectChain extends PromiseLike<AnecdotalLoadResult> {
  eq: (column: string, value: string) => AnecdotalSelectChain;
  order: (column: string, options: { ascending: boolean }) => AnecdotalSelectChain;
}

const anecdotalDb = (supabase as unknown as {
  from: (table: "anecdotal_records") => {
    select: (query: string) => AnecdotalSelectChain;
    insert: (row: AnecdotalInsert) => PromiseLike<AnecdotalMutationResult>;
  };
}).from("anecdotal_records");


const CATEGORY_LABELS: Record<AnecdotalCategory, string> = {
  behavior: "Behavior",
  achievement: "Achievement",
  health: "Health",
  other: "Other",
};

const CATEGORY_STATUS: Record<
  AnecdotalCategory,
  "approved" | "warning" | "pending" | "disabled"
> = {
  behavior: "warning",
  achievement: "approved",
  health: "pending",
  other: "disabled",
};

/** Sample learners used for local / offline preview and the dashboard loader. */
export const ANECDOTAL_SAMPLE_STUDENTS: {
  id: string;
  full_name: string;
  grade_level: string;
}[] = [
  { id: "std-1", full_name: "Alvarez, Mateo Cruz", grade_level: "Grade 7" },
  { id: "std-2", full_name: "Bautista, Chloe Reyes", grade_level: "Grade 7" },
  { id: "std-3", full_name: "Dela Cruz, Juan Pedro", grade_level: "Grade 7" },
  { id: "std-4", full_name: "Garcia, Sophia Santos", grade_level: "Grade 7" },
];

interface AnecdotalRecordsViewProps {
  studentId: string;
  studentName?: string;
  students?: { id: string; full_name: string; grade_level: string }[];
  onStudentChange?: (studentId: string) => void;
}

export function AnecdotalRecordsView({
  studentId,
  studentName,
  students,
  onStudentChange,
}: AnecdotalRecordsViewProps) {
  const [userRole, setUserRole] = useState<UserRole>("teacher");

  // Search & filter state
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<AnecdotalCategory | "">("");

  // Create form state
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [category, setCategory] = useState<AnecdotalCategory>("behavior");
  const [note, setNote] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Data state
  const [records, setRecords] = useState<AnecdotalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const canCreate = userRole === "teacher" || userRole === "master_teacher";

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const { data, error } = await anecdotalDb
        .select("*")
        .eq("student_id", studentId)
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRecords(data || []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load anecdotal records.";
      setRecords([]);
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    // Defer the initial fetch out of the effect's synchronous body so the loading
    // state updates do not trigger a cascading-render lint warning.
    const timer = setTimeout(() => {
      loadRecords();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadRecords]);

  // Resolve the authenticated author id (optional; RLS uses auth.uid() server-side).
  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (active && user) setAuthorId(user.id);
    })();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (categoryFilter && r.category !== categoryFilter) return false;
      if (dateFrom && r.entry_date < dateFrom) return false;
      if (dateTo && r.entry_date > dateTo) return false;
      if (q && !r.note.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [records, search, dateFrom, dateTo, categoryFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setErrorMessage("Please write a note before saving.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const { error } = await anecdotalDb.insert({
        student_id: studentId,
        author_id: authorId || null,
        entry_date: entryDate,
        category,
        note: note.trim(),
      });
      if (error) throw error;
      setNote("");
      setSuccessMessage("Anecdotal record saved.");
      await loadRecords();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save the anecdotal record.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setDateFrom("");
    setDateTo("");
    setCategoryFilter("");
  };

  const activeFilterCount = [search, dateFrom, dateTo, categoryFilter].filter(
    Boolean
  ).length;

  return (
    <div className="space-y-6">
      {/* Role access control + optional learner selector */}
      <Card
        title="Anecdotal Records"
        subtitle="Behavior, achievement, health and other learner observations. Recorded by the assigned teacher or adviser; readable by the principal and linked stakeholders."
      >
        <div className="flex flex-wrap items-center gap-4 text-sm font-normal">
          <div className="flex items-center gap-2">
            <label className="text-xs text-ink/70 font-medium">
              Active User Role:
            </label>
            <select
              className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-xs font-medium focus:outline-none focus:border-tingub-blue"
              value={userRole}
              onChange={(e) => setUserRole(e.target.value as UserRole)}
            >
              <option value="teacher">Teacher / Adviser</option>
              <option value="master_teacher">Master Teacher</option>
              <option value="principal">Principal</option>
              <option value="ict_coordinator">ICT Coordinator</option>
              <option value="stakeholder">Stakeholder</option>
            </select>
          </div>

          {students && onStudentChange && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-ink/70 font-medium">Learner:</label>
              <select
                className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-xs font-medium focus:outline-none focus:border-tingub-blue"
                value={studentId}
                onChange={(e) => onStudentChange(e.target.value)}
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.grade_level})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto">
            {canCreate ? (
              <Badge status="approved" label="Can record entries" />
            ) : (
              <Badge status="disabled" label="Read-only access" />
            )}
          </div>
        </div>
      </Card>

      {/* Create entry (teacher / adviser) */}
      {canCreate && (
        <Card
          title="Add anecdotal record"
          subtitle={
            studentName
              ? `New observation for ${studentName}. You can only record learners in your assigned section.`
              : "New observation for this learner."
          }
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="entryDate"
                  className="block text-sm font-medium text-ink mb-1"
                >
                  Entry date *
                </label>
                <input
                  id="entryDate"
                  type="date"
                  required
                  max={new Date().toISOString().slice(0, 10)}
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-sm font-medium text-ink mb-1"
                >
                  Category *
                </label>
                <select
                  id="category"
                  required
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as AnecdotalCategory)
                  }
                  className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
                >
                  {(Object.keys(CATEGORY_LABELS) as AnecdotalCategory[]).map(
                    (c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="note"
                className="block text-sm font-medium text-ink mb-1"
              >
                Note *
              </label>
              <textarea
                id="note"
                required
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Consistently participates in class discussions and shows initiative in group tasks."
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
              />
            </div>

            {errorMessage && (
              <p className="text-sm text-tingub-orange font-normal">
                {errorMessage}
              </p>
            )}
            {successMessage && (
              <p className="text-sm text-tingub-green font-normal">
                {successMessage}
              </p>
            )}

            <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-3">
              <Button type="button" variant="secondary" onClick={() => setNote("")}>
                Clear note
              </Button>
              <Button type="submit" variant="approved" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save anecdotal record"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Search & filter bar */}
      <Card
        title="Search & filter entries"
        subtitle="Filter by learner (bounded to this profile), date range, category, and note text."
        action={
          activeFilterCount > 0 ? (
            <Button variant="secondary" size="sm" onClick={resetFilters}>
              Clear filters
            </Button>
          ) : undefined
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="anecdotalSearch"
              className="block text-xs font-medium text-ink/70 mb-1"
            >
              Search notes
            </label>
            <input
              id="anecdotalSearch"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="e.g. participated, concern, doctor"
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
            />
          </div>
          <div>
            <label
              htmlFor="dateFrom"
              className="block text-xs font-medium text-ink/70 mb-1"
            >
              Date from
            </label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
            />
          </div>
          <div>
            <label
              htmlFor="dateTo"
              className="block text-xs font-medium text-ink/70 mb-1"
            >
              Date to
            </label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
            />
          </div>
          <div>
            <label
              htmlFor="categoryFilter"
              className="block text-xs font-medium text-ink/70 mb-1"
            >
              Category
            </label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(e.target.value as AnecdotalCategory | "")
              }
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
            >
              <option value="">All categories</option>
              {(Object.keys(CATEGORY_LABELS) as AnecdotalCategory[]).map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Records list */}
      <Card
        title="Recorded observations"
        subtitle={`${filtered.length} of ${records.length} entr${
          records.length === 1 ? "y" : "ies"
        }`}
      >
        {errorMessage && (
          <p className="mb-3 p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
            {errorMessage}
          </p>
        )}
        {loading ? (
          <p className="text-sm text-ink/70 font-normal">
            Loading anecdotal records...
          </p>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              records.length === 0
                ? "No anecdotal records yet"
                : "No matching entries"
            }
            description={
              records.length === 0
                ? "No observations have been recorded for this learner yet. If you are the assigned teacher or adviser, use the form above to add the first one."
                : "No entries match your search or filters. Clear the filters to see all recorded observations."
            }
            icon={
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
          />
        ) : (
          <ul className="space-y-4">
            {filtered.map((rec) => (
              <li
                key={rec.id}
                className="rounded-[8px] border border-ink/15 bg-paper p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    status={CATEGORY_STATUS[rec.category]}
                    label={CATEGORY_LABELS[rec.category]}
                  />
                  <span className="text-xs font-medium text-ink/60 font-normal">
                    {rec.entry_date}
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink font-normal leading-relaxed">
                  {rec.note}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

