"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Role } from "@/lib/types";
import {
  logout,
  resetDemo,
  runCycle,
  useApp,
  useMounted,
  useSession,
} from "@/lib/store";
import { formatDays, timeAgo } from "@/lib/utils";
import { Logo, Pill } from "./ui";
import { LanguageTranslator } from "./LanguageTranslator";

const ROLE_LINKS: Record<Role, { href: string; label: string }[]> = {
  farmer: [{ href: "/farmer", label: "My Well & Alerts" }],
  bank: [{ href: "/bank", label: "Regional Risk Desk" }],
  government: [{ href: "/government", label: "State Overview" }],
};

export function GlobalAlertBanner() {
  const { taluks } = useApp();
  const mounted = useMounted();
  if (!mounted) return null;
  const red = taluks.filter((t) => t.status === "red");
  if (red.length === 0) return null;
  return (
    <div className="bg-red text-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2 text-[13px]">
        <span className="font-bold">
          ⚠ {red.length} taluk{red.length > 1 ? "s" : ""} in RED status:
        </span>
        <span>
          {red
            .map((t) => `${t.name} (~${formatDays(t.predictedCrisisInDays)})`)
            .join(", ")}
        </span>
        <Link
          href="/government"
          className="ml-auto font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Government dashboard →
        </Link>
      </div>
    </div>
  );
}

export function Nav() {
  const session = useSession();
  const mounted = useMounted();
  const pathname = usePathname();
  const router = useRouter();
  const { taluks, predictionRuns } = useApp();
  const [justRan, setJustRan] = useState(false);

  useEffect(() => {
    if (!justRan) return;
    const t = setTimeout(() => setJustRan(false), 4000);
    return () => clearTimeout(t);
  }, [justRan]);

  if (!mounted) {
    return (
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
        </div>
      </header>
    );
  }

  const links = session ? ROLE_LINKS[session.role] : [];
  const taluk = session?.talukId
    ? taluks.find((t) => t.id === session.talukId)
    : undefined;
  const lastRun = predictionRuns[0];

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" aria-label="AquaAlarm home">
          <Logo />
        </Link>

        {links.length > 0 && (
          <nav className="ml-2 flex items-center gap-1 text-sm">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-1.5 font-medium ${
                  pathname === l.href
                    ? "bg-foam text-deep"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {session?.talukId && taluk && (
            <Pill tone="ocean">{taluk.name} taluk</Pill>
          )}
          {session && (
            <Pill tone={session.role === "farmer" ? "green" : session.role === "bank" ? "amber" : "deep"}>
              {session.role}
            </Pill>
          )}

          <LanguageTranslator />
          
          <div className="ml-2 hidden sm:block">
            <ResetDemoButton />
          </div>

          <button
            onClick={() => {
              runCycle();
              setJustRan(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-md bg-abyss px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-deep"
            title="Recalculates predictions for all taluks (demo trigger for the scheduled daily cycle)"
          >
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" />
              <path d="M20 3v4h-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Run prediction cycle
          </button>

          {session ? (
            <div className="flex items-center gap-2">
              <span className="hidden text-right text-xs sm:block">
                <span className="block font-semibold text-slate-700">{session.name}</span>
                <span className="block text-slate-400">{session.subtitle ?? session.role}</span>
              </span>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-md border border-line px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:bg-slate-100"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-ocean px-3 py-1.5 text-[13px] font-semibold text-white hover:bg-deep"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>

      {justRan && lastRun && (
        <div className="border-t border-foam bg-foam px-4 py-1.5 text-[12px] text-deep">
          ✓ Prediction cycle complete — {lastRun.taluksRecalculated} taluks recalculated,{" "}
          {lastRun.redTaluks} in red, {lastRun.alertsGenerated} new alert
          {lastRun.alertsGenerated === 1 ? "" : "s"} generated.
        </div>
      )}
      {!justRan && lastRun && (
        <div className="border-t border-line px-4 py-1 text-[11px] text-slate-400">
          Last cycle: {timeAgo(lastRun.ranAt)} · {lastRun.taluksRecalculated} taluks ·{" "}
          {lastRun.redTaluks} red
        </div>
      )}
    </header>
  );
}

export function ResetDemoButton({ compact = false }: { compact?: boolean }) {
  return (
    <button
      onClick={() => {
        if (confirm("Reset all demo data back to the original seed state?")) {
          resetDemo();
        }
      }}
      className={
        compact
          ? "text-[12px] text-slate-400 underline underline-offset-2 hover:text-slate-600"
          : "rounded-md border border-line px-3 py-1.5 text-[13px] font-medium text-slate-500 hover:bg-slate-100"
      }
    >
      Reset demo data
    </button>
  );
}
