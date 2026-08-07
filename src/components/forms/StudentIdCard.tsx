"use client";

import React, { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { db } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import {
  getStudents,
  getSections,
  FormStudent,
  FormSection,
  SCHOOL_NAME,
  SCHOOL_ADDRESS,
  SCHOOL_YEAR,
} from "@/lib/formsData";

/**
 * Ensure the learner has a validation token on their row. Generate + persist to the
 * Dexie offline store first, then best-effort upsert to Supabase so the token lives
 * on the student's row in the cloud (matching the build brief).
 */
async function ensureToken(student: FormStudent): Promise<string> {
  if (student.validation_token) return student.validation_token;
  const token =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tnhs-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await db.students.update(student.id, {
    validation_token: token,
    token_issued_at: new Date().toISOString(),
  });

  // Best-effort mirror to Supabase (RLS allows teachers/advisers on their section).
  try {
    const client = supabase as unknown as {
      from: (t: string) => {
        update: (patch: Record<string, unknown>) => {
          eq: (col: string, val: string) => Promise<{ error: unknown }>;
        };
      };
    };
    const { error } = await client
      .from("students")
      .update({ validation_token: token })
      .eq("id", student.id);
    if (error) {
      throw new Error(error instanceof Error ? error.message : "Failed to mirror token to Supabase.");
    }
  } catch (err) {
    // Offline — the token is safe locally and will sync later in production.
    if (typeof window !== "undefined" && navigator.onLine) {
      console.warn("Token mirror to Supabase failed:", err);
    }
  }
  return token;
}

/** Derive initials (e.g. "Alvarez, Mateo Cruz" -> "MA") for the photo placeholder. */
function initialsOf(name: string): string {
  const parts = name.replace(/,/g, " ").split(" ").filter(Boolean);
  const first = parts[parts.length - 1]?.[0] || "";
  const second = parts[0]?.[0] || "";
  return (first + second).toUpperCase();
}

export function StudentIdCard() {
  const [students, setStudents] = useState<FormStudent[]>([]);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [studentId, setStudentId] = useState("");
  const [student, setStudent] = useState<FormStudent | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getStudents(), getSections()]).then(([s, secs]) => {
      if (!active) return;
      setStudents(s);
      setSections(secs);
      if (s.length > 0 && !studentId) setStudentId(s[0].id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve selected learner and ensure they carry a validation token.
  useEffect(() => {
    if (!studentId) return;
    let active = true;
    setTokenError(null);
    (async () => {
      try {
        const list = await getStudents();
        const resolved = list.find((x) => x.id === studentId) || null;
        const tok = resolved ? await ensureToken(resolved) : null;
        if (!active) return;
        setStudent(resolved);
        setToken(tok);
      } catch (err) {
        if (!active) return;
        setTokenError(err instanceof Error ? err.message : "Unable to generate validation token.");
      }
    })();
    return () => {
      active = false;
    };
  }, [studentId]);

  const section = sections.find((s) => s.id === student?.section_id);

  // Public validation URL the QR code links to.
  const validationUrl = useMemo(() => {
    if (!token) return null;
    const base =
      (typeof window !== "undefined" && window.location.origin) ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://tnhs-likha-sis.vercel.app";
    return `${base}/students/validate?token=${encodeURIComponent(token)}`;
  }, [token]);

  useEffect(() => {
    if (!validationUrl) return;
    let active = true;
    QRCode.toDataURL(validationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 180,
      color: { dark: "#1A1A1A", light: "#FFFFFF" },
    })
      .then((url) => {
        if (active) setQrDataUrl(url);
      })
      .catch(() => {
        if (active) setQrDataUrl(null);
      });
    return () => {
      active = false;
    };
  }, [validationUrl]);

  const select = (
    <div className="print:hidden flex flex-wrap items-center gap-3 pb-4">
      <label className="text-sm font-medium text-ink">Learner:</label>
      <select
        value={studentId}
        onChange={(e) => setStudentId(e.target.value)}
        className="px-3 py-1.5 border border-ink/20 rounded-[8px] bg-paper text-ink text-sm font-medium focus:outline-none focus:border-tingub-blue"
      >
        {students.map((s) => (
          <option key={s.id} value={s.id}>
            {s.full_name} ({s.grade_level})
          </option>
        ))}
      </select>
      <Button variant="primary" size="sm" onClick={() => window.print()}>
        Print ID Card
      </Button>
    </div>
  );

  return (
    <Card title="Student ID Card" subtitle="QR code links to the learner's validation token stored on their row">
      {select}

      {tokenError && (
        <p className="p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
          {tokenError}
        </p>
      )}

      {!student || !token ? (
        <p className="text-sm text-ink/70 font-normal">Loading ID card...</p>
      ) : (
        <div className="flex justify-center">
          {/* Printable card surface (credit-card proportions, flat surfaces only) */}
          <div className="w-[340px] rounded-[8px] border border-ink/20 bg-paper overflow-hidden print:border-ink">
            {/* Header band */}
            <div className="bg-tingub-blue text-paper px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-[8px] bg-paper text-tingub-blue flex items-center justify-center font-bold text-sm">
                TN
              </span>
              <div>
                <div className="text-[11px] font-bold leading-tight uppercase tracking-wide">
                  {SCHOOL_NAME}
                </div>
                <div className="text-[9px] font-normal opacity-90">{SCHOOL_ADDRESS}</div>
              </div>
            </div>

            {/* Body */}
            <div className="flex gap-4 p-4">
              {/* Photo / initials placeholder */}
              <div className="w-20 h-24 shrink-0 rounded-[8px] bg-tingub-gold/25 border border-tingub-gold/40 flex items-center justify-center text-tingub-blue font-bold text-2xl">
                {initialsOf(student.full_name)}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 text-xs space-y-1">
                <div className="text-[9px] uppercase tracking-wide text-ink/60 font-normal">Learner Name</div>
                <div className="font-bold leading-snug">{student.full_name}</div>
                <div className="mt-1">
                  <div className="text-[9px] uppercase tracking-wide text-ink/60 font-normal">LRN</div>
                  <div className="font-mono font-normal">{student.lrn}</div>
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-ink/60 font-normal">Grade</div>
                    <div className="font-medium">{student.grade_level}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-ink/60 font-normal">Section</div>
                    <div className="font-medium">{section?.section_name || "—"}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] uppercase tracking-wide text-ink/60 font-normal">School Year</div>
                  <div className="font-medium">{SCHOOL_YEAR}</div>
                </div>
              </div>
            </div>

            {/* QR strip */}
            <div className="border-t border-ink/15 px-4 py-3 flex items-center gap-3">
              <div className="bg-white p-1 rounded-[4px] shrink-0">
                {qrDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrDataUrl} alt="Student ID validation QR" width={92} height={92} />
                ) : (
                  <div className="w-[92px] h-[92px] flex items-center justify-center text-[9px] text-ink/50 font-normal">
                    QR
                  </div>
                )}
              </div>
              <div className="text-[9px] leading-relaxed text-ink/70 font-normal">
                <div className="font-medium text-ink">Scan to validate this ID card</div>
                <div className="break-all mt-1 font-mono text-[8px]">{token}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

