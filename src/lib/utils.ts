import type { TalukStatus, AlertSeverity } from "./types";

export const round1 = (n: number) => Math.round(n * 10) / 10;

export function formatDepth(ft: number): string {
  return `${ft.toFixed(1)} ft`;
}

export function formatDays(days: number | null | undefined): string {
  if (days === null || days === undefined) return "—";
  if (days <= 0) return "now";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export function formatLiters(liters: number): string {
  if (liters >= 1_000_000) return `${(liters / 1_000_000).toFixed(1)} M L`;
  if (liters >= 1_000) return `${Math.round(liters / 1_000)}k L`;
  return `${liters} L`;
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export const STATUS_META: Record<
  TalukStatus,
  { label: string; text: string; bg: string; dot: string; border: string }
> = {
  green: {
    label: "Green",
    text: "text-green",
    bg: "bg-greenbg",
    dot: "bg-green",
    border: "border-green/30",
  },
  yellow: {
    label: "Yellow",
    text: "text-amber",
    bg: "bg-amberbg",
    dot: "bg-amber",
    border: "border-amber/30",
  },
  red: {
    label: "Red",
    text: "text-red",
    bg: "bg-redbg",
    dot: "bg-red",
    border: "border-red/30",
  },
};

export const SEVERITY_META: Record<
  AlertSeverity,
  { label: string; text: string; bg: string; icon: string }
> = {
  critical: { label: "Critical", text: "text-red", bg: "bg-redbg", icon: "⚠" },
  warning: { label: "Warning", text: "text-amber", bg: "bg-amberbg", icon: "▲" },
  info: { label: "Info", text: "text-deep", bg: "bg-foam", icon: "ℹ" },
};

export function statusExplain(t: {
  status: TalukStatus;
  predictedCrisisInDays: number | null;
  name: string;
}): string {
  if (t.status === "red") {
    return `${t.name} taluk: ~${t.predictedCrisisInDays} days until crisis level. Act now — restrict water use and switch to low-water crops.`;
  }
  if (t.status === "yellow") {
    return `${t.name} taluk: crisis possible in ~${t.predictedCrisisInDays} days. Start conserving water and plan crop changes.`;
  }
  return `${t.name} taluk: recharge outlook healthy. No crisis predicted within 90 days.`;
}

export const TALUKS_BY_DISTRICT_SORT = (
  a: { district: string; name: string },
  b: { district: string; name: string }
) => a.district.localeCompare(b.district) || a.name.localeCompare(b.name);
