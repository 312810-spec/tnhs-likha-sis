"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon?: React.ReactNode;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  items,
}: {
  isCollapsed: boolean;
  onToggle: () => void;
  items: NavItem[];
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (
      href === "/teacher" ||
      href === "/master-teacher" ||
      href === "/ict" ||
      href === "/principal" ||
      href === "/stakeholder"
    ) {
      return pathname === href || pathname === `${href}/`;
    }
    return pathname.startsWith(href.split("?")[0]);
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-[#12265C] text-white flex flex-col transition-all duration-300 z-40 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[8px] bg-tingub-gold flex items-center justify-center flex-shrink-0">
            <span className="text-[#12265C] font-bold text-sm">TNHS</span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold tracking-tight text-white truncate">
                TNHS LIKHA-SIS
              </h1>
              <p className="text-[10px] text-white/70 font-normal truncate">
                TINGUB NHS
              </p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 bg-tingub-gold rounded-full flex items-center justify-center text-[#12265C] hover:bg-tingub-gold/80 transition-colors z-50"
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg
          className={`w-3 h-3 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {items.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-sm font-medium transition-colors ${
                active
                  ? "bg-tingub-gold text-[#12265C]"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon ? item.icon : null}</span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        {!isCollapsed && (
          <p className="text-[10px] text-white/50 font-normal text-center">
            TNHS LIKHA-SIS v0.1
          </p>
        )}
      </div>
    </aside>
  );
}
