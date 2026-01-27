"use client";

export default function WeeklyBarChart({
  data
}: {
  data: { weekStart: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="mt-3 text-zinc-900">
      <div className="text-sm text-zinc-600">Weekly applications (last 8 weeks)</div>
      <svg width="100%" height="140" viewBox="0 0 800 140" className="mt-2">
        <line x1="20" y1="120" x2="780" y2="120" stroke="currentColor" opacity="0.2" />

        {data.map((d, i) => {
          const barW = 80;
          const gap = 10;
          const x = 20 + i * (barW + gap);
          const h = Math.round((d.count / max) * 90);
          const y = 120 - h;

          return (
            <g key={d.weekStart}>
              <rect x={x} y={y} width={barW} height={h} rx="8" ry="8" opacity="0.9" fill="currentColor" />
              <text x={x + barW / 2} y="135" textAnchor="middle" fontSize="10" opacity="0.6">
                {d.weekStart.slice(5)}
              </text>
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fontSize="10" opacity="0.7">
                {d.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
