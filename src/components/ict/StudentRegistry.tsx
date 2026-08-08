"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";

interface SectionRow {
  id: string;
  section_name: string | null;
  grade_level: string | null;
}

interface StudentRow {
  id: string;
  lrn: string;
  full_name: string;
  birthdate: string | null;
  sex: string | null;
  grade_level: string;
  section_id: string | null;
  sf10_file_url: string | null;
}

type Sf10Filter = "all" | "missing" | "has";

const isMissingSf10 = (url: string | null | undefined): boolean =>
  !url || url.trim() === "";

export function StudentRegistry() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [sections, setSections] = useState<Record<string, SectionRow>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sf10Filter, setSf10Filter] = useState<Sf10Filter>("all");

  const fetchRegistry = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = supabase as unknown as {
        from: (t: string) => {
          select: (q: string) => Promise<{ data: unknown; error: unknown }>;
        };
      };

      const [{ data: studentData }, { data: sectionData }] = await Promise.all([
        client.from("students").select("*"),
        client.from("sections").select("*"),
      ]);

      if (studentData) setStudents(studentData as StudentRow[]);
      if (sectionData) {
        const map: Record<string, SectionRow> = {};
        (sectionData as SectionRow[]).forEach((s) => {
          map[s.id] = s;
        });
        setSections(map);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load the learner registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch-on-mount pattern shared across the app; loads learners + sections.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRegistry();
  }, [fetchRegistry]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (q) {
        const haystack = `${s.full_name} ${s.lrn}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (sf10Filter === "missing" && !isMissingSf10(s.sf10_file_url)) return false;
      if (sf10Filter === "has" && isMissingSf10(s.sf10_file_url)) return false;
      return true;
    });
  }, [students, search, sf10Filter]);

  const missingCount = students.filter((s) => isMissingSf10(s.sf10_file_url)).length;

  const filterButton = (value: Sf10Filter, label: string) => {
    const active = sf10Filter === value;
    return (
      <button
        key={value}
        onClick={() => setSf10Filter(value)}
        className={`rounded-[8px] px-3 py-1.5 text-xs font-medium border transition-colors ${
          active
            ? "bg-tingub-blue text-paper border-tingub-blue"
            : "bg-paper text-ink border-ink/20 hover:bg-ink/5"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink">Learner Registry</h1>
        <p className="text-sm text-ink/60 font-normal">
          All enrolled learners. Use the Missing SF10 filter to follow up and attach real files later.
        </p>
      </div>

      <Card
        title={`${filtered.length} learner${filtered.length === 1 ? "" : "s"}`}
        subtitle={missingCount > 0 ? `${missingCount} missing SF10 file(s)` : "All SF10 files attached"}
        action={
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink/50 font-normal hidden sm:inline">SF10 status:</span>
            {filterButton("all", `All (${students.length})`)}
            {filterButton("missing", `Missing SF10 (${missingCount})`)}
            {filterButton("has", "Has SF10")}
          </div>
        }
      >
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or LRN…"
          className="mb-4 w-full max-w-sm rounded-[8px] border border-ink/30 bg-paper px-3 py-2 text-sm font-normal text-ink focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
        />

        {loading ? (
          <p className="text-sm text-ink/60 font-normal">Loading learners…</p>
        ) : error ? (
          <div className="rounded-[8px] border border-tingub-orange/40 bg-tingub-orange/10 p-3 text-sm text-ink font-normal">
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={students.length === 0 ? "No learners in the registry yet" : "No learners match your filters"}
            description={
              students.length === 0
                ? "Onboard already-enrolled learners by importing a CSV from the Bulk Learner Import screen."
                : "Try changing the search text or clearing the SF10 filter to see more learners."
            }
          />
        ) : (
          <div className="rounded-[8px] border border-ink/15 overflow-hidden">
            <div className="overflow-auto max-h-[520px] bg-white">
              <table className="border-collapse text-[11px] w-full min-w-[720px]">
                <thead className="sticky top-0 z-10 bg-tingub-blue text-paper">
                  <tr>
                    {["LRN", "Full Name", "Grade Level", "Section", "Sex", "Birthdate", "SF10 Status"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium border-r border-white/20">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const section = s.section_id ? sections[s.section_id] : null;
                    const missing = isMissingSf10(s.sf10_file_url);
                    return (
                      <tr key={s.id} className="bg-white border-b border-ink/10">
                        <td className="px-3 py-2 font-mono">{s.lrn}</td>
                        <td className="px-3 py-2">{s.full_name}</td>
                        <td className="px-3 py-2">{s.grade_level}</td>
                        <td className="px-3 py-2">{section?.section_name || "—"}</td>
                        <td className="px-3 py-2">{s.sex || "—"}</td>
                        <td className="px-3 py-2">{s.birthdate || "—"}</td>
                        <td className="px-3 py-2">
                          {missing ? (
                            <Badge status="warning" label="Missing SF10" />
                          ) : (
                            <Badge status="approved" label="Attached" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
