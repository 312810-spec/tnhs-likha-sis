"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { NavigationShell } from "@/components/layout/NavigationShell";
import { UserRole } from "@/types/database.types";

const ROLE_ROUTES = {
  teacher: "/teacher",
  master_teacher: "/master-teacher",
  ict_coordinator: "/ict",
  principal: "/principal",
  stakeholder: "/stakeholder",
};

const ROLE_NAV_ITEMS = {
  teacher: [
    { key: "dashboard", label: "Dashboard", href: "/teacher" },
    { key: "grade-center", label: "Grade Center", href: "/teacher/grade-center" },
    { key: "composite-grades", label: "Composite Grades", href: "/teacher/composite-grades" },
    { key: "reports", label: "Reports & Analytics", href: "/teacher/reports" },
    { key: "individual-academic", label: "Individual Academic", href: "/teacher/individual-academic" },
    { key: "certificate-generator", label: "Certificate Generator", href: "/teacher/certificate-generator" },
    { key: "anecdotal", label: "Anecdotal Records", href: "/teacher/anecdotal" },
  ],
  master_teacher: [
    { key: "dashboard", label: "Dashboard", href: "/master-teacher" },
    { key: "grade-center", label: "Grade Center", href: "/master-teacher/grade-center" },
    { key: "composite-grades", label: "Composite Grades", href: "/master-teacher/composite-grades" },
    { key: "reports", label: "Reports & Analytics", href: "/master-teacher/reports" },
    { key: "individual-academic", label: "Individual Academic", href: "/master-teacher/individual-academic" },
    { key: "certificate-generator", label: "Certificate Generator", href: "/master-teacher/certificate-generator" },
    { key: "anecdotal", label: "Anecdotal Records", href: "/master-teacher/anecdotal" },
    { key: "review", label: "Review & Approval", href: "/master-teacher/review" },
  ],
  ict_coordinator: [
    { key: "dashboard", label: "Dashboard", href: "/ict" },
    { key: "enrollment", label: "Enrollment", href: "/ict/enrollment" },
    { key: "accounts", label: "Account Management", href: "/ict/accounts" },
    { key: "grade-center", label: "Grade Center", href: "/ict/grade-center" },
    { key: "composite-grades", label: "Composite Grades", href: "/ict/composite-grades" },
    { key: "reports", label: "Reports & Analytics", href: "/ict/reports" },
    { key: "forms", label: "Forms & IDs", href: "/ict/forms" },
    { key: "id-generator", label: "Student ID Generator", href: "/ict/id-generator" },
  ],
  principal: [
    { key: "dashboard", label: "Dashboard", href: "/principal" },
    { key: "enrollment", label: "Enrollment", href: "/principal/enrollment" },
    { key: "grade-center", label: "Grade Center", href: "/principal/grade-center" },
    { key: "composite-grades", label: "Composite Grades", href: "/principal/composite-grades" },
    { key: "reports", label: "Reports & Analytics", href: "/principal/reports" },
    { key: "forms", label: "Forms & IDs", href: "/principal/forms" },
    { key: "anecdotal", label: "Anecdotal Records", href: "/principal/anecdotal" },
  ],
  stakeholder: [
    { key: "dashboard", label: "Dashboard", href: "/stakeholder" },
    { key: "progress-card", label: "Progress Card (SF9)", href: "/stakeholder/progress-card" },
    { key: "anecdotal", label: "Anecdotal Records", href: "/stakeholder/anecdotal" },
  ],
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user || !profile) {
      router.push("/");
      return;
    }
    const correctRoute = ROLE_ROUTES[profile.role];
    if (pathname !== correctRoute && !pathname.startsWith(correctRoute + "/")) {
      router.push(correctRoute);
    }
  }, [loading, user, profile, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-ink/70 font-normal">Loading session...</p>
      </div>
    );
  }

  if (!user || !profile) return null;

  const navItems = ROLE_NAV_ITEMS[profile.role] || [];

  return (
    <NavigationShell navItems={navItems}>
      {children}
    </NavigationShell>
  );
}
