"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";
import { PublicStudentValidation } from "@/types/database.types";

function ValidatorInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [state, setState] = useState<"loading" | "valid" | "invalid">("loading");
  const [result, setResult] = useState<PublicStudentValidation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!token) {
        setState("invalid");
        return;
      }
      try {
        const client = supabase as unknown as {
          rpc: (
            fn: "get_public_student_by_token",
            args: { p_token: string }
          ) => Promise<{ data: PublicStudentValidation[] | null; error: unknown }>;
        };
        const { data, error: rpcError } = await client.rpc("get_public_student_by_token", {
          p_token: token,
        });
        if (!active) return;
        if (rpcError) {
          setState("invalid");
          setError(rpcError instanceof Error ? rpcError.message : "Unable to validate token.");
        } else if (data && data.length > 0) {
          setResult(data[0]);
          setState("valid");
        } else {
          setState("invalid");
        }
      } catch (err) {
        if (!active) return;
        setState("invalid");
        setError(err instanceof Error ? err.message : "Validation service unavailable.");
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <header className="border-b border-ink/15 bg-paper px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <span className="w-8 h-8 rounded-[8px] bg-tingub-blue text-paper flex items-center justify-center font-bold text-sm">
            TN
          </span>
          <h1 className="text-lg font-bold">Student ID Validation</h1>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto p-6">
        <Card title="Scan result">
          {state === "loading" ? (
            <p className="text-sm text-ink/70 font-normal">Validating ID card...</p>
          ) : state === "valid" && result ? (
            <div className="space-y-3">
              <Badge status="approved" label="Valid ID" />
              <dl className="text-sm space-y-2">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/70 font-normal">Learner Name</dt>
                  <dd className="font-medium text-right">{result.full_name}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/70 font-normal">LRN</dt>
                  <dd className="font-mono text-right">{result.lrn}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/70 font-normal">Grade Level</dt>
                  <dd className="font-medium text-right">{result.grade_level}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/70 font-normal">Section</dt>
                  <dd className="font-medium text-right">{result.section_name || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink/70 font-normal">School Year</dt>
                  <dd className="font-medium text-right">{result.school_year || "—"}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="space-y-3">
              <Badge status="warning" label="ID not recognized" />
              <p className="text-sm text-ink/70 font-normal">
                This validation token does not match any learner on record
                {error ? ` (${error})` : ""}. The ID card may be counterfeit, expired,
                or the token may not have been synced to the system yet.
              </p>
            </div>
          )}
        </Card>

        <div className="mt-4 print:hidden">
          <Link href="/">
            <Button variant="secondary" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </main>

      <footer className="border-t border-ink/15 bg-paper px-6 py-4 text-center text-xs text-ink/60 font-normal">
        Tingub National High School • DepEd Order No. 015, s. 2026
      </footer>
    </div>
  );
}

export default function StudentValidationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-paper flex items-center justify-center text-sm text-ink/70 font-normal">
        Loading validation...
      </div>
    }>
      <ValidatorInner />
    </Suspense>
  );
}
