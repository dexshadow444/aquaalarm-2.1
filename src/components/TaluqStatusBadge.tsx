"use client";

import type { TalukStatus } from "@/lib/types";
import { formatDays, STATUS_META } from "@/lib/utils";

export function TaluqStatusBadge({
  status,
  daysToCrisis,
  showDays = true,
  size = "md",
}: {
  status: TalukStatus;
  daysToCrisis?: number | null;
  showDays?: boolean;
  size?: "sm" | "md";
}) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold ${meta.bg} ${meta.text} ${
        size === "sm"
          ? "px-2 py-0.5 text-[10px]"
          : "px-2.5 py-1 text-[11px]"
      }`}
      title={`${meta.label}${daysToCrisis != null ? ` · crisis in ${formatDays(daysToCrisis)}` : ""}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
      {showDays && daysToCrisis != null && (
        <span className="font-medium opacity-80">
          · {formatDays(daysToCrisis)}
        </span>
      )}
    </span>
  );
}
