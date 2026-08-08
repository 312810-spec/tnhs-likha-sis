"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";

export function AppHeader({
  title,
  onToggleSidebar,
  user,
  onSignOut,
}: {
  title: string;
  onToggleSidebar: () => void;
  sidebarCollapsed?: boolean;
  user?: { email?: string; full_name?: string } | null;
  onSignOut?: () => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-paper text-ink">
      <div className="flex flex-col gap-3 px-4 py-3 lg:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleSidebar}
            className="!bg-paper !border-ink/10 !text-ink hover:!bg-ink/5 p-2"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </Button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-ink/50">Dashboard</p>
            <h1 className="text-xl font-bold tracking-tight text-ink">{title}</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <div className="rounded-[8px] border border-ink/10 bg-paper px-3 py-2 text-xs font-medium text-ink/70">
            {formatDate(time)}
          </div>
          <div className="rounded-[8px] border border-ink/10 bg-paper px-3 py-2 text-xs font-medium text-ink/70">
            {formatTime(time)}
          </div>

          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen((open) => !open)}
              className="inline-flex items-center gap-3 rounded-[12px] border border-ink/10 bg-paper px-4 py-2 text-sm font-medium text-ink transition hover:bg-ink/5"
              type="button"
            >
              <span className="h-9 w-9 rounded-full bg-tingub-blue text-paper grid place-items-center text-sm font-bold">
                {user?.full_name?.charAt(0) ?? user?.email?.charAt(0) ?? "U"}
              </span>
              <span className="hidden sm:inline-flex truncate">
                {user?.full_name || user?.email || "Account"}
              </span>
              <svg
                className={`h-4 w-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M6 7L10 11L14 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-[12px] border border-ink/10 bg-paper text-left shadow-none">
                <div className="p-4 border-b border-ink/10">
                  <p className="text-sm font-semibold text-ink">
                    {user?.full_name || user?.email || "Account"}
                  </p>
                  <p className="mt-1 text-xs text-ink/60">
                    {user?.email ?? "Signed in"}
                  </p>
                </div>
                <div className="flex flex-col px-2 py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      onSignOut?.();
                    }}
                    className="w-full rounded-[10px] px-3 py-2 text-sm font-medium text-tingub-blue transition hover:bg-tingub-blue/5"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
