"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Badge, StatusType } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { supabase } from "@/lib/supabase";
import { FormSheetHeader } from "@/components/forms/FormSheet";
import {
  buildLearnerResults,
  FormStudent,
  FormLearnerResult,
  getStudents,
  SCHOOL_YEAR,
} from "@/lib/formsData";
import { AnecdotalRecord, AnecdotalCategory } from "@/types/database.types";
import { computeAwardsEligibility } from "@/lib/awardsEligibility";

export type LinkedStudent = {
  student: FormStudent;
  relationship: string;
};

const CATEGORY_LABELS: Record<AnecdotalCategory, string> = {
  behavior: "Behavior",
  achievement: "Achievement",
  health: "Health",
  other: "Other",
};

const CATEGORY_STATUS: Record<AnecdotalCategory, StatusType> = {
  behavior: "warning",
  achievement: "success",
  health: "pending",
  other: "disabled",
};

interface ThenableResult<T> {
  data: T[] | null;
  error: unknown;
}
interface ThenableChain<T> extends PromiseLike<ThenableResult<T>> {
  select: (query: string) => ThenableChain<T>;
  eq: (col: string, val: unknown) => ThenableChain<T>;
  order: (col: string, opts: { ascending: boolean }) => ThenableChain<T>;
}
interface SupabaseLite {
  from: <T>(table: string) => {
    select: (query: string) => ThenableChain<T>;
  };
}
const supaLite = supabase as unknown as SupabaseLite;

async function fetchStakeholderLinks(): Promise<
  { student_id: string; relationship: string }[]
> {
  const { data, error } = await supaLite
    .from<{ student_id: string; relationship: string }>("stakeholder_links")
    .select("student_id, relationship");
  if (error) return [];
  return data ?? [];
}

export async function fetchAnecdotalForStudent(
  studentId: string
): Promise<AnecdotalRecord[]> {
  const { data, error } = await supaLite
    .from<AnecdotalRecord>("anecdotal_records")
    .select("*")
    .eq("student_id", studentId)
    .order("entry_date", { ascending: false });
  if (error) return [];
  return data ?? [];
}

const DEMO_LINKED_STUDENT_IDS = ["std-1", "std-2"];

export function StakeholderPortal() {
  const [allStudents, setAllStudents] = useState<FormStudent[]>([]);
  const [linkedStudents, setLinkedStudents] = useState<LinkedStudent[]>([]);
  const [demoFallback, setDemoFallback] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");
  const [anecdotal, setAnecdotal] = useState<AnecdotalRecord[]>([]);
  const [anecdotalLoading, setAnecdotalLoading] = useState(false);
  const [sf9Data, setSf9Data] = useState<FormLearnerResult | null>(null);
  const [sf9Loading, setSf9Loading] = useState(false);
  const [sf9Error, setSf9Error] = useState<string | null>(null);
  const [linksError, setLinksError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async () => {
    const list = await getStudents();
    setAllStudents(list);
  }, []);

  const loadLinks = useCallback(async () => {
    setLoading(true);
    setLinksError(null);
    let links: { student_id: string; relationship: string }[] = [];
    try {
      links = await fetchStakeholderLinks();
    } catch (err) {
      setLinksError(err instanceof Error ? err.message : "Unable to load linked learners.");
    }
    if (allStudents.length > 0) {
      const byId = new Map(allStudents.map((s) => [s.id, s]));
      if (links.length > 0) {
        const resolved = links
          .map((l) => ({
            student: byId.get(l.student_id),
            relationship: l.relationship,
          }))
          .filter((r): r is LinkedStudent => Boolean(r.student))
          .sort((a, b) => a.student.full_name.localeCompare(b.student.full_name));
        setLinkedStudents(resolved);
        setDemoFallback(false);
      } else {
        const resolved: LinkedStudent[] = [];
        for (const id of DEMO_LINKED_STUDENT_IDS) {
          const s = byId.get(id);
          if (s) resolved.push({ student: s, relationship: "Parent (demo preview)" });
        }
        setLinkedStudents(resolved);
        setDemoFallback(true);
      }
    }
    setLoading(false);
  }, [allStudents]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  useEffect(() => {
    if (allStudents.length === 0) return;
    const timer = setTimeout(() => {
      loadLinks();
    }, 0);
    return () => clearTimeout(timer);
  }, [allStudents, loadLinks]);

  const selectedStudent = useMemo(
    () =>
      linkedStudents.find((l) => l.student.id === selectedId)?.student ||
      linkedStudents[0]?.student,
    [linkedStudents, selectedId]
  );

  useEffect(() => {
    if (linkedStudents.length > 0 && !selectedId) {
      const timer = setTimeout(() => {
        setSelectedId(linkedStudents[0].student.id);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [linkedStudents, selectedId]);

  const loadAnecdotal = useCallback(
    (studentId: string) => {
      setAnecdotalLoading(true);
      fetchAnecdotalForStudent(studentId).then((rows) => {
        setAnecdotal(rows);
        setAnecdotalLoading(false);
      });
    },
    [setAnecdotal, setAnecdotalLoading]
  );

  const loadSf9 = useCallback(
    (student: FormStudent) => {
      setSf9Loading(true);
      setSf9Error(null);
      buildLearnerResults(student)
        .then((res) => {
          setSf9Data(res);
          setSf9Loading(false);
        })
        .catch((err) => {
          setSf9Error(
            err instanceof Error ? err.message : "Unable to build report card."
          );
          setSf9Loading(false);
        });
    },
    [setSf9Data, setSf9Loading, setSf9Error]
  );

  useEffect(() => {
    if (!selectedStudent) return;
    const timer = setTimeout(() => {
      loadAnecdotal(selectedStudent.id);
      loadSf9(selectedStudent);
    }, 0);
    return () => clearTimeout(timer);
  }, [selectedStudent, loadAnecdotal, loadSf9]);

  const QUARTERS = [1, 2, 3, 4];
  const cell = (v: number | null) =>
    v === null || v === undefined ? "--" : Number(v).toFixed(2);

  const renderReadOnlySF9 = (student: FormStudent) => {
    const awards = sf9Data
      ? computeAwardsEligibility({
          subjectResults: sf9Data.subjects,
          disciplinaryQuarters: [],
          targetQuarter: 4,
        })
      : null;

    return (
      <Card
        title="SF9 -- Learner Progress Report Card"
        subtitle={`Official Transmuted Grade (DO 015, s. 2026) for ${student.full_name} -- read-only`}
      >
        <FormSheetHeader
          formLabel="Learner Progress Report Card (SF9)"
          schoolYear={SCHOOL_YEAR}
        />
        {sf9Loading ? (
          <p className="text-sm text-ink/70 font-normal">Building report card...</p>
        ) : sf9Error ? (
          <p className="p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
            {sf9Error}
          </p>
        ) : sf9Data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-tingub-blue text-paper">
                  <th
                    rowSpan={2}
                    className="border border-ink/20 p-2 text-center font-bold"
                  >
                    Subject
                  </th>
                  {QUARTERS.map((q) => (
                    <th
                      key={q}
                      rowSpan={2}
                      className="border border-ink/20 p-2 text-center font-bold"
                    >
                      Quarter {q}
                    </th>
                  ))}
                  <th
                    rowSpan={2}
                    className="border border-ink/20 p-2 text-center font-bold"
                  >
                    Final Grade
                  </th>
                  <th
                    rowSpan={2}
                    className="border border-ink/20 p-2 text-center font-bold"
                  >
                    Remarks
                  </th>
                </tr>
              </thead>
              <tbody>
                {sf9Data.subjects.map((row) => {
                  const failed =
                    row.finalGrade !== null && row.finalGrade < 75;
                  return (
                    <tr key={row.subject.id} className="odd:bg-paper even:bg-ink/5">
                      <td className="border border-ink/20 p-2 font-medium">
                        {row.subject.name}
                      </td>
                      {row.quarters.map((c) => (
                        <td
                          key={c.quarter}
                          className="border border-ink/20 p-2 text-center font-mono"
                        >
                          {cell(c.transmuted)}
                        </td>
                      ))}
                      <td
                        className={`border border-ink/20 p-2 text-center font-mono font-bold ${
                          failed ? "text-tingub-orange" : "text-tingub-green"
                        }`}
                      >
                        {cell(row.finalGrade)}
                      </td>
                      <td
                        className={`border border-ink/20 p-2 text-center font-bold ${
                          failed ? "text-tingub-orange" : "text-tingub-green"
                        }`}
                      >
                        {row.remarks}
                      </td>
                    </tr>
                  );
                })}
                <tr className="bg-ink/10">
                  <td className="border border-ink/20 p-2 font-bold">
                    General Average
                  </td>
                  {sf9Data.quarterlyGeneralAverages.map((ga, idx) => (
                    <td
                      key={idx}
                      className="border border-ink/20 p-2 text-center font-mono font-bold"
                    >
                      {cell(ga)}
                    </td>
                  ))}
                  <td className="border border-ink/20 p-2 text-center font-mono font-bold text-tingub-blue">
                    {cell(sf9Data.generalAverage)}
                  </td>
                  <td className="border border-ink/20 p-2" />
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No report card data"
            description="No grades are available for this learner."
          />
        )}
        {sf9Data && awards && (
          <div
            className={`rounded-[8px] border p-3 text-sm mt-4 ${
              awards.eligible
                ? "border-tingub-green/40 bg-tingub-green/10 text-tingub-green"
                : "border-tingub-gold/40 bg-tingub-gold/15 text-ink"
            }`}
          >
            <strong>Recognition flag:</strong>{" "}
            {awards.eligible
              ? "Learner is eligible for academic recognition."
              : awards.reasons.length > 0
              ? awards.reasons.join(" ")
              : "Not eligible for academic recognition this quarter."}
          </div>
        )}
      </Card>
    );
  };

  const renderReadOnlyAnecdotal = (student: FormStudent) => {
    const byCategory = anecdotal.reduce((acc, rec) => {
      acc[rec.category] = (acc[rec.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <Card
        title="Anecdotal Record Summary"
        subtitle={`Observations for ${student.full_name}`}
      >
        {anecdotalLoading ? (
          <p className="text-sm text-ink/70 font-normal">
            Loading observations...
          </p>
        ) : anecdotal.length === 0 ? (
          <EmptyState
            title="No observations recorded"
            description="This learner has no anecdotal records on file."
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {(Object.keys(CATEGORY_LABELS) as AnecdotalCategory[]).map(
                (c) => (
                  <div
                    key={c}
                    className="p-2 bg-ink/5 rounded-[8px] border border-ink/10"
                  >
                    <div className="font-bold text-base text-tingub-blue">
                      {byCategory[c] ?? 0}
                    </div>
                    <div className="text-xs text-ink/60">
                      {CATEGORY_LABELS[c]}
                    </div>
                  </div>
                )
              )}
            </div>
            <ul className="space-y-3">
              {anecdotal.map((rec) => (
                <li
                  key={rec.id}
                  className="rounded-[8px] border border-ink/15 bg-paper p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      status={CATEGORY_STATUS[rec.category]}
                      label={CATEGORY_LABELS[rec.category]}
                    />
                    <span className="text-xs text-ink/60 font-normal">
                      {rec.entry_date}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-ink font-normal">
                    {rec.note}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {demoFallback && (
        <div className="p-3 bg-tingub-gold/15 border border-tingub-gold/30 rounded-[8px] text-xs text-ink font-normal">
          <strong>Demo preview:</strong> no authenticated stakeholder session
          was detected, so linked learners are synthesized from the seeded
          demo roster. In production, Supabase RLS returns only the students
          tied to the logged-in stakeholder.
        </div>
      )}

      {linksError && (
        <p className="p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
          {linksError}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink/70 font-normal">
          Loading your linked learners...
        </p>
      ) : linkedStudents.length === 0 ? (
        <EmptyState
          title="No linked learners found"
          description={
            demoFallback
              ? "No demo learners are available in the offline store."
              : "You are not yet linked to any learner. Ask the school registrar to add a stakeholder link (parent/guardian) to your account in the stakeholders module."
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="linkedStudent"
                className="block text-sm font-medium text-ink mb-1"
              >
                Linked learner
              </label>
              <select
                id="linkedStudent"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full px-3 py-1.5 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-medium focus:outline-none focus:ring-2 focus:ring-tingub-blue"
              >
                {linkedStudents.map((l) => (
                  <option key={l.student.id} value={l.student.id}>
                    {l.student.full_name} ({l.student.grade_level})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-xs text-ink/60 font-normal">
              Relationship:{" "}
              <span className="font-medium text-ink">
                {linkedStudents.find((l) => l.student.id === selectedId)
                  ?.relationship || "--"}
              </span>
            </div>
          </div>

          {selectedStudent ? (
            <div className="space-y-4">
              <div>{renderReadOnlySF9(selectedStudent)}</div>
              <div>{renderReadOnlyAnecdotal(selectedStudent)}</div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}