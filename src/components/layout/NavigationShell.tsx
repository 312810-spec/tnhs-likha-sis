"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { AppHeader } from "@/components/layout/Header";

const VIEW_TITLES: Record<string, string> = {
  "/(sis)": "DASHBOARD",
  "/(sis)/grade-center": "GRADE CENTER",
  "/(sis)/composite-grades": "COMPOSITE-GRADES",
  "/(sis)/reports": "REPORTS & ANALYTICS",
  "/(sis)/reports?form=sf10": "SF10 PREVIEW",
  "/(sis)/reports?form=sf9": "SF9 PREVIEW",
  "/(sis)/reports?form=sf8": "SF8 HEALTH RECORD",
  "/(sis)/reports?form=sf2": "SF2 ATTENDANCE",
  "/(sis)/individual-academic": "INDIVIDUAL-ACADEMIC",
  "/(sis)/certificate-generator": "CERTIFICATE GENERATOR",
  "/enrollment": "ENROLLMENT",
  "/principal": "PRINCIPAL DASHBOARD",
  "/ict": "ACCOUNT MANAGEMENT",
};

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Get current path and search params for title
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/(sis)";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const fullPath = pathname + search;

  const title = VIEW_TITLES[fullPath] || VIEW_TITLES[pathname] || "INDIVIDUAL-ACADEMIC";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className={`transition-all duration-300 ${
          sidebarCollapsed ? "ml-16" : "ml-64"
        }`}
      >
        <AppHeader
          title={title}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          sidebarCollapsed={sidebarCollapsed}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
