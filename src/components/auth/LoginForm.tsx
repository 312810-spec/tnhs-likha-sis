"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { SunburstBackground } from "@/components/ui/SunburstBackground";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { UserRole } from "@/types/database.types";

const ROLE_ROUTES: Record<UserRole, string> = {
  teacher: "/teacher",
  master_teacher: "/master-teacher",
  ict_coordinator: "/ict",
  principal: "/principal",
  stakeholder: "/stakeholder",
};

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("teacher");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { user, role: authRole, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user && authRole) {
      const target = ROLE_ROUTES[authRole] || "/teacher";
      router.push(target);
    }
  }, [user, authRole, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMessage(error.message || "Invalid credentials.");
      }
      // On success, Supabase Auth updates the session automatically.
    } catch {
      setErrorMessage("Sign-in service unavailable. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-[550px] w-full flex items-center justify-center p-4 bg-paper rounded-[8px] border border-ink/10 overflow-hidden">
        <SunburstBackground />
        <div className="relative z-10 text-sm text-ink/70 font-normal">
          Loading session...
        </div>
      </div>
    );
  }

  if (user && authRole) {
    return null;
  }

  return (
    <div className="relative min-h-[550px] w-full flex items-center justify-center p-4 bg-paper rounded-[8px] border border-ink/10 overflow-hidden">
      {/* Light sunburst pattern on login screen ONLY, echoing school seal */}
      <SunburstBackground />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md bg-paper border-2 border-ink/20 rounded-[8px] p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-[8px] bg-tingub-blue text-paper flex items-center justify-center text-xl font-bold mb-3 border border-tingub-blue">
            TNHS
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">
            TNHS LIKHA-SIS
          </h2>
          <p className="mt-1 text-sm text-ink/70 font-normal">
            Tingub National High School Information System
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-ink mb-1">
              User Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink focus:outline-none focus:ring-2 focus:ring-tingub-blue font-normal"
            >
              <option value="teacher">Subject Teacher / Advisor</option>
              <option value="master_teacher">Master Teacher</option>
              <option value="ict_coordinator">ICT Coordinator</option>
              <option value="principal">School Principal</option>
              <option value="stakeholder">Parent / Learner</option>
            </select>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
              School Email / Account ID
            </label>
            <input
              id="email"
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. juandelacruz@deped.gov.ph"
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink focus:outline-none focus:ring-2 focus:ring-tingub-blue font-normal placeholder:text-ink/40"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-paper border border-ink/30 rounded-[8px] text-ink focus:outline-none focus:ring-2 focus:ring-tingub-blue font-normal placeholder:text-ink/40"
            />
          </div>

          {errorMessage && (
            <p className="p-3 bg-tingub-orange/10 border border-tingub-orange/40 rounded-[8px] text-sm text-tingub-orange font-normal">
              {errorMessage}
            </p>
          )}

          <div className="pt-2">
            {/* Button names explicit action: "Sign in to account" */}
            <Button variant="primary" size="lg" type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign in to account"}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-ink/60 font-normal">
          Compliant with DepEd Order No. 015, s. 2026 Assessment Standards
        </div>
      </div>
    </div>
  );
};
