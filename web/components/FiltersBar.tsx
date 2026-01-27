"use client";

import { ApplicationStage } from "@prisma/client";

type Props = {
  q: string;
  stage: ApplicationStage | "";
  onQChange: (value: string) => void;
  onStageChange: (value: ApplicationStage | "") => void;
  onReset?: () => void;
};

export default function FiltersBar({ q, stage, onQChange, onStageChange, onReset }: Props) {
  const hasFilters = q.trim() !== "" || stage !== "";

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center">
      <div className="flex gap-2 flex-1">
        <input
          className="input flex-1"
          placeholder="Search company, title, location…"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
        />
        <select
          className="input max-w-[200px]"
          value={stage}
          onChange={(e) => onStageChange(e.target.value as ApplicationStage | "")}
        >
          <option value="">All stages</option>
          {Object.values(ApplicationStage).map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {hasFilters && onReset && (
        <button className="btn text-sm" onClick={onReset}>
          Clear filters
        </button>
      )}
    </div>
  );
}
