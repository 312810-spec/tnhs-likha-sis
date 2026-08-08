import React, { ReactNode } from "react";

interface TableProps {
  children: ReactNode;
  className?: string;
}

interface TableSectionProps {
  children: ReactNode;
  className?: string;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
}

interface TableCellProps {
  children: ReactNode;
  isHeader?: boolean;
  className?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = "" }) => (
  <table className={`min-w-full divide-y divide-ink/10 ${className}`}>{children}</table>
);

export const TableHeader: React.FC<TableSectionProps> = ({ children, className = "" }) => (
  <thead className={className}>{children}</thead>
);

export const TableBody: React.FC<TableSectionProps> = ({ children, className = "" }) => (
  <tbody className={className}>{children}</tbody>
);

export const TableRow: React.FC<TableRowProps> = ({ children, className = "" }) => (
  <tr className={className}>{children}</tr>
);

export const TableCell: React.FC<TableCellProps> = ({
  children,
  isHeader = false,
  className = "",
}) => {
  const Tag = isHeader ? "th" : "td";
  return <Tag className={className}>{children}</Tag>;
};
