"use client";

import type { Alert, Taluk } from "@/lib/types";
import { SEVERITY_META, timeAgo } from "@/lib/utils";

export function AlertFeed({
  alerts,
  taluks,
  limit = 8,
  empty = "No alerts for this view yet.",
}: {
  alerts: Alert[];
  taluks: Taluk[];
  limit?: number;
  empty?: string;
}) {
  const talukName = new Map(taluks.map((t) => [t.id, t.name]));
  const sorted = [...alerts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {sorted.slice(0, limit).map((a) => {
        const meta = SEVERITY_META[a.severity];
        return (
          <li key={a.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${meta.bg} ${meta.text}`}
            >
              {meta.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] leading-snug text-slate-700">{a.message}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {talukName.get(a.talukId) ?? "Statewide"} · {timeAgo(a.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
