import React from "react";
import { Button } from "./Button";

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-ink/20 bg-paper p-8 text-center ${className}`}
    >
      {icon && (
        <div className="mb-3 rounded-[8px] bg-ink/5 p-3 text-ink/70">
          {icon}
        </div>
      )}
      <h4 className="text-base font-bold text-ink">{title}</h4>
      <p className="mt-1 text-sm text-ink/70 max-w-md font-normal">
        {description}
      </p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button variant="primary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
};
