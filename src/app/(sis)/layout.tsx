import { NavigationShell } from "@/components/layout/NavigationShell";
import React from "react";

export default function SisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <NavigationShell>{children}</NavigationShell>;
}
