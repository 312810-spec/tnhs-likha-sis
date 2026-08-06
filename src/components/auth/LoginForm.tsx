"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SunburstBackground } from "@/components/ui/SunburstBackground";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("teacher");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Signing in as ${role}...`);
  };

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
              onChange={(e) => setRole(e.target.value)}
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

          <div className="pt-2">
            {/* Button names explicit action: "Sign in to account" */}
            <Button variant="primary" size="lg" type="submit" className="w-full">
              Sign in to account
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
