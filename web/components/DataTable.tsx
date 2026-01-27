"use client";

import Link from "next/link";
import { ApplicationStage } from "@prisma/client";

type Column<T> = {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  onRowClick?: (item: T) => void;
  linkHref?: (item: T) => string;
  emptyMessage?: string;
};

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField,
  linkHref,
  emptyMessage = "No data available"
}: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={String(col.key)} className="text-left py-2 px-3 font-medium text-zinc-700">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const row = (
              <tr key={String(item[keyField])} className="border-b hover:bg-zinc-50">
                {columns.map((col) => (
                  <td key={String(col.key)} className="py-2 px-3">
                    {col.render ? col.render(item) : item[col.key as keyof T]}
                  </td>
                ))}
              </tr>
            );

            if (linkHref) {
              return (
                <Link key={String(item[keyField])} href={linkHref(item)} className="contents">
                  {row}
                </Link>
              );
            }

            return row;
          })}
        </tbody>
      </table>
    </div>
  );
}

// Stage badge helper
export function StageBadge({ stage }: { stage: ApplicationStage }) {
  const colors: Record<ApplicationStage, string> = {
    SAVED: "bg-zinc-100 text-zinc-700",
    APPLIED: "bg-blue-100 text-blue-700",
    INTERVIEW: "bg-yellow-100 text-yellow-700",
    OFFER: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700"
  };

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded ${colors[stage]}`}>
      {stage}
    </span>
  );
}
