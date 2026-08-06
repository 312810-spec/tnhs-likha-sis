import React from "react";

export interface CardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = "",
}) => {
  return (
    <div
      className={`rounded-[8px] border border-ink/15 bg-paper p-6 text-ink ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-ink/10 pb-4">
          <div>
            {title && (
              <h3 className="text-lg font-bold tracking-tight text-ink">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-ink/70 font-normal">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
};
