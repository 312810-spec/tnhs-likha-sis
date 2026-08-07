"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { supabase } from "@/lib/supabase";

/**
 * ICT Coordinator — Account Management form.
 *
 * Provisions a new teacher or master_teacher account (email + full name + role)
 * by calling the server-side `create-account` Supabase Edge Function.
 *
 * Security guarantees:
 *  - This component NEVER calls an admin-level Supabase function and NEVER holds
 *    the service role key. It only invokes the Edge Function through
 *    `supabase.functions.invoke`, which forwards the caller's session.
 *  - The Edge Function verifies the caller is an ict_coordinator, creates the
 *    auth user + profile using the service role key, and returns a single-use
 *    temporary password shown to the coordinator exactly once.
 */

type AccountRole = "teacher" | "master_teacher";

interface CreateAccountResult {
  ok?: boolean;
  error?: string;
  email?: string;
  full_name?: string;
  role?: AccountRole;
  password?: string;
  message?: string;
}

// Loose adapter for the installed supabase-js build (same convention as the
// rest of the repo: keeps full type safety on our payloads while matching the
// existing untyped `.functions` calls).
interface SupabaseFunctionsAdapter {
  invoke: (name: string, opts: { body: Record<string, unknown> }) => Promise<{
    data: unknown;
    error: { message?: string; context?: unknown } | null;
  }>;
}

export function AccountManagementForm() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AccountRole>("teacher");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<CreateAccountResult | null>(null);

  const clearForm = () => {
    setEmail("");
    setFullName("");
    setRole("teacher");
    setErrorMessage(null);
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setResult(null);

    try {
      const fn = supabase as unknown as { functions: SupabaseFunctionsAdapter };
      const { data, error } = await fn.functions.invoke("create-account", {
        body: {
          email: email.trim(),
          full_name: fullName.trim(),
          role,
        },
      });

      if (error) {
        const message =
          error.message ||
          (typeof error.context === "string" && error.context) ||
          "Account could not be created.";
        setErrorMessage(message);
        return;
      }

      const payload = (data ?? {}) as CreateAccountResult;
      if (payload.ok) {
        setResult(payload);
        // Clear the form for the next provisioning.
        setEmail("");
        setFullName("");
        setRole("teacher");
      } else if (payload.error) {
        setErrorMessage(payload.error);
      }
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Account creation service unavailable."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Create Teacher / Master Teacher Account"
        subtitle="Provisioned securely through the server-side Edge Function"
      >
        <div className="mb-4 p-3 bg-tingub-blue/10 border border-tingub-blue/20 rounded-[8px] text-xs text-ink font-normal">
          This form calls the <code>create-account</code> Supabase Edge Function.
          The service role key never touches the browser, and only an ICT
          Coordinator can provision accounts. A single-use temporary password is
          returned for you to hand to the new user.
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="accountRole" className="block text-sm font-medium text-ink mb-1">
                Role *
              </label>
              <select
                id="accountRole"
                required
                value={role}
                onChange={(e) => setRole(e.target.value as AccountRole)}
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue"
              >
                <option value="teacher">Teacher</option>
                <option value="master_teacher">Master Teacher</option>
              </select>
            </div>

            <div>
              <label htmlFor="accountEmail" className="block text-sm font-medium text-ink mb-1">
                School Email *
              </label>
              <input
                id="accountEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. juandelacruz@deped.gov.ph"
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="accountFullName" className="block text-sm font-medium text-ink mb-1">
                Full Name *
              </label>
              <input
                id="accountFullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Juan Dela Cruz"
                className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink text-sm font-normal focus:outline-none focus:ring-2 focus:ring-tingub-blue placeholder:text-ink/40"
              />
                        </div>
          </div>

          {errorMessage && (
            <p className="p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
              {errorMessage}
            </p>
          )}

          <div className="pt-3 border-t border-ink/10 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" onClick={clearForm}>
              Clear form
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <Card title="Account created" subtitle="Share the temporary password once">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge status="approved" label={result.role === "master_teacher" ? "Master Teacher" : "Teacher"} />
              <span className="text-sm font-medium text-ink">{result.full_name}</span>
            </div>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between gap-4">
                <dt className="text-ink/70 font-normal">Email</dt>
                <dd className="font-mono font-medium text-right">{result.email}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink/70 font-normal">Temporary password</dt>
                <dd className="font-mono font-bold text-tingub-blue text-right">{result.password}</dd>
              </div>
            </dl>
            <p className="p-3 bg-tingub-gold/15 border border-tingub-gold/40 rounded-[8px] text-xs text-ink font-normal">
              Copy and securely hand this temporary password to the new user. It is
              shown only once and should be changed on first sign-in.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}


