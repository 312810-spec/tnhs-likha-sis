"use client";

import React, { useState, useEffect } from "react";
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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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
    <header className="sticky top-0 z-30 border-b border-paper/10 bg-tingub-blue text-paper">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleSidebar}
            className="!bg-paper/10 !border-paper/20 !text-paper hover:!bg-paper/20 p-2"
            aria-label="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </Button>
          <div>
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
            <p className="text-[10px] text-paper/70 font-normal hidden sm:block">
              TNHS LIKHA-SIS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden md:inline-flex items-center rounded-[8px] bg-paper/10 border border-paper/20 px-3 py-1 text-xs font-medium">
            TINGUB NATIONAL HIGH SCHOOL
          </span>
          <div className="font-mono text-sm font-bold bg-paper/10 rounded-[8px] px-3 py-1 border border-paper/20">
            {formatDate(time)} | {formatTime(time)}
          </div>
          {user && (
            <div className="flex items-center gap-2">
              <span className="hidden lg:inline-flex text-xs text-paper/80 font-normal">
                {user.email || user.full_name}
              </span>
              {onSignOut && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onSignOut}
                  className="!bg-paper/10 !border-paper/20 !text-paper hover:!bg-paper/20"
                >
                  Sign out
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
