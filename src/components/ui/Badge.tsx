import React from "react";

export type StatusType = "approved" | "success" | "pending" | "warning" | "disabled";

export interface BadgeProps {
  status: StatusType;
  label?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  status,
  label,
  className = "",
}) => {
  const statusConfig = {
    approved: {
      bg: "bg-tingub-green text-paper",
      defaultText: "Approved",
    },
    success: {
      bg: "bg-tingub-green text-paper",
      defaultText: "Success",
    },
    pending: {
      bg: "bg-tingub-gold text-ink",
      defaultText: "Pending",
    },
    warning: {
      bg: "bg-tingub-orange text-paper",
      defaultText: "Warning",
    },
    disabled: {
      bg: "bg-gray-200 text-gray-700 border border-gray-300",
      defaultText: "Disabled",
    },
  };

  const current = statusConfig[status] || statusConfig.disabled;
  const textContent = label || current.defaultText;

  return (
    <span
      className={`inline-flex items-center rounded-[8px] px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${current.bg} ${className}`}
    >
      {textContent}
    </span>
  );
};
