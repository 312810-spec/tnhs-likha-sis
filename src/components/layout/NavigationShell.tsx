"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./Header";
import { useAuth } from "@/contexts/AuthContext";

const VIEW_TITLES: Record<string, string> = {
  "/teacher": "TEACHER DASHBOARD",
  "/teacher/grade-center": "GRADE CENTER",
  "/teacher/composite-grades": "COMPOSITE GRADES",
  "/teacher/reports": "REPORTS & ANALYTICS",
  "/teacher/individual-academic": "INDIVIDUAL ACADEMIC",
  "/teacher/certificate-generator": "CERTIFICATE GENERATOR",
  "/teacher/anecdotal": "ANECDOTAL RECORDS",
  "/master-teacher": "MASTER TEACHER DASHBOARD",
  "/master-teacher/grade-center": "GRADE CENTER",
  "/master-teacher/composite-grades": "COMPOSITE GRADES",
  "/master-teacher/reports": "REPORTS & ANALYTICS",
  "/master-teacher/individual-academic": "INDIVIDUAL ACADEMIC",
  "/master-teacher/certificate-generator": "CERTIFICATE GENERATOR",
  "/master-teacher/anecdotal": "ANECDOTAL RECORDS",
  "/master-teacher/review": "REVIEW & APPROVAL",
  "/ict": "ICT COORDINATOR DASHBOARD",
  "/ict/learners": "LEARNER REGISTRY",
  "/ict/bulk-import": "BULK LEARNER IMPORT",
  "/ict/enrollment": "ENROLLMENT",
  "/ict/accounts": "ACCOUNT MANAGEMENT",
  "/ict/grade-center": "GRADE CENTER",
  "/ict/composite-grades": "COMPOSITE GRADES",
  "/ict/reports": "REPORTS & ANALYTICS",
  "/ict/forms": "FORMS & IDS",
  "/ict/id-generator": "STUDENT ID GENERATOR",
  "/principal": "PRINCIPAL DASHBOARD",
  "/principal/enrollment": "ENROLLMENT",
  "/principal/grade-center": "GRADE CENTER",
  "/principal/composite-grades": "COMPOSITE GRADES",
  "/principal/reports": "REPORTS & ANALYTICS",
  "/principal/forms": "FORMS & IDS",
  "/principal/anecdotal": "ANECDOTAL RECORDS",
  "/stakeholder": "STAKEHOLDER PORTAL",
  "/stakeholder/progress-card": "PROGRESS CARD",
  "/stakeholder/anecdotal": "ANECDOTAL RECORDS",
};

export function NavigationShell({ 
  children, 
  navItems,
}: { 
  children: React.ReactNode;
  navItems: { key: string; label: string; href: string; icon?: React.ReactNode }[];
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const search = typeof window !== "undefined" ? window.location.search : "";
  const fullPath = pathname + search;

  const title = VIEW_TITLES[fullPath] || VIEW_TITLES[pathname] || "DASHBOARD";

  return (
    <div className="min-h-screen bg-paper text-ink">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        items={navItems}
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
          user={user}
          onSignOut={signOut}
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
