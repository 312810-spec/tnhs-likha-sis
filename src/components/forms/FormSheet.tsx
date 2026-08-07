import React from "react";
import { Button } from "@/components/ui/Button";

/**
 * Generic "Print / Save as PDF" control. Each form sheet marks its surrounding
 * selectors with `print:hidden` (`no-print`) so only the printable table body is
 * sent to the printer / PDF engine.
 */
export function PrintButton({ label = "Print / Save as PDF" }: { label?: string }) {
  return (
    <div className="print:hidden">
      <Button variant="primary" size="sm" onClick={() => window.print()}>
        {label}
      </Button>
    </div>
  );
}

/** Shared DepEd form masthead shown at the top of every printable sheet. */
export function FormSheetHeader({
  formLabel,
  schoolYear,
}: {
  formLabel: string;
  schoolYear: string;
}) {
  return (
    <div className="border-b border-ink/25 pb-3 mb-4 text-center">
      <h2 className="text-base font-bold text-ink tracking-wide uppercase">{formLabel}</h2>
      <p className="text-xs text-ink/80 font-normal mt-0.5">
        Tingub National High School • Tingub, Mandaue City, Cebu • School Year {schoolYear} • DepEd Order No. 015, s. 2026
      </p>
    </div>
  );
}
