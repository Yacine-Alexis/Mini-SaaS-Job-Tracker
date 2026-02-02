"use client";

import { useRouter } from "next/navigation";
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
  onRowClick,
  emptyMessage = "No data available"
}: Props<T>) {
  const router = useRouter();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        {emptyMessage}
      </div>
    );
  }

  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    } else if (linkHref) {
      router.push(linkHref(item));
    }
  };

  const isClickable = !!linkHref || !!onRowClick;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            {columns.map((col) => (
              <th key={String(col.key)} className="text-left py-2 px-3 font-medium text-zinc-700 dark:text-zinc-300">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr
              key={String(item[keyField])}
              className={`border-b hover:bg-zinc-50 dark:hover:bg-zinc-800 ${isClickable ? "cursor-pointer" : ""}`}
              onClick={isClickable ? () => handleRowClick(item) : undefined}
              onKeyDown={isClickable ? (e) => e.key === "Enter" && handleRowClick(item) : undefined}
              tabIndex={isClickable ? 0 : undefined}
              role={isClickable ? "button" : undefined}
            >
              {columns.map((col) => (
                <td key={String(col.key)} className="py-2 px-3">
                  {col.render ? col.render(item) : item[col.key as keyof T]}
                </td>
              ))}
            </tr>
          ))}
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
