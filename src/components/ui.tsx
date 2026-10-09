"use client";

import React from "react";

export function Card({
  title,
  subtitle,
  actions,
  children,
  className = "",
  padded = true,
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-white shadow-[0_1px_2px_rgba(13,47,64,0.06)] ${className}`}
    >
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-deep">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
          {actions}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Stat({
  value,
  label,
  sub,
  tone = "deep",
}: {
  value: React.ReactNode;
  label: string;
  sub?: React.ReactNode;
  tone?: "deep" | "green" | "amber" | "red" | "ocean";
}) {
  const tones: Record<string, string> = {
    deep: "text-deep",
    green: "text-green",
    amber: "text-amber",
    red: "text-red",
    ocean: "text-ocean",
  };
  return (
    <div className="rounded-xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(13,47,64,0.06)]">
      <div className={`text-3xl font-bold tabular-nums ${tones[tone]}`}>{value}</div>
      <div className="mt-1 text-xs font-medium text-slate-600">{label}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

export function Pill({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "green" | "amber" | "red" | "ocean" | "deep";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-600",
    green: "bg-greenbg text-green",
    amber: "bg-amberbg text-amber",
    red: "bg-redbg text-red",
    ocean: "bg-foam text-ocean",
    deep: "bg-deep text-white",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
        <defs>
          <linearGradient id="drop-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3aa7b6" />
            <stop offset="100%" stopColor="#0e7c86" />
          </linearGradient>
        </defs>
        <path
          d="M12 2.2C12 2.2 4.6 10.4 4.6 14.6a7.4 7.4 0 0 0 14.8 0C19.4 10.4 12 2.2 12 2.2Z"
          fill="url(#drop-g)"
        />
        <ellipse cx="9.2" cy="14.8" rx="2.1" ry="3.4" fill="rgba(255,255,255,0.28)" transform="rotate(-24 9.2 14.8)" />
      </svg>
      <span
        className={`text-lg font-bold tracking-tight ${dark ? "text-white" : "text-abyss"}`}
      >
        Aqua<span className="text-ocean">Alarm</span>
      </span>
    </span>
  );
}
