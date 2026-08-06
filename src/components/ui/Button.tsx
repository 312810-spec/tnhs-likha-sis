import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "approved" | "pending" | "warning" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  children,
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs font-medium",
    md: "px-4 py-2 text-sm font-medium",
    lg: "px-6 py-3 text-base font-medium",
  };

  const variantClasses = disabled
    ? "bg-gray-300 text-gray-500 cursor-not-allowed border-transparent"
    : {
        primary: "bg-tingub-blue text-paper hover:opacity-95 active:opacity-90 border-transparent",
        approved: "bg-tingub-green text-paper hover:opacity-95 active:opacity-90 border-transparent",
        pending: "bg-tingub-gold text-ink hover:opacity-95 active:opacity-90 border-transparent",
        warning: "bg-tingub-orange text-paper hover:opacity-95 active:opacity-90 border-transparent",
        danger: "bg-tingub-orange text-paper hover:opacity-95 active:opacity-90 border-transparent",
        secondary: "bg-paper text-ink border border-ink/20 hover:bg-ink/5",
      }[variant];

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-[8px] border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-tingub-blue focus:ring-offset-1 ${sizeClasses[size]} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
