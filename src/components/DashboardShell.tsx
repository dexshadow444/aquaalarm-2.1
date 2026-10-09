"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role } from "@/lib/types";
import { useMounted, useSession } from "@/lib/store";
import { GlobalAlertBanner, Nav, ResetDemoButton } from "./Nav";
import { Logo } from "./ui";

function ShellSkeleton() {
  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Logo />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="h-6 w-64 animate-pulse rounded bg-slate-200" />
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200" />
          ))}
        </div>
      </main>
    </div>
  );
}

const ROLE_LABEL: Record<Role, string> = {
  farmer: "Farmer",
  bank: "Bank Officer",
  government: "Government Official",
};

export function DashboardShell({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const session = useSession();
  const mounted = useMounted();
  const router = useRouter();

  useEffect(() => {
    if (!mounted) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== role) {
      router.replace(
        session.role === "farmer"
          ? "/farmer"
          : session.role === "bank"
            ? "/bank"
            : "/government"
      );
    }
  }, [mounted, session, role, router]);

  if (!mounted || !session || session.role !== role) {
    return <ShellSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <GlobalAlertBanner />
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-[12px] text-slate-400">
          <p>
            <span className="font-semibold text-slate-500">
              AquaAlarm — {ROLE_LABEL[role]} view
            </span>{" "}
            · concept demo. All groundwater, rainfall and prediction data are
            simulated; not official CGWB/IMD data. No real financial
            transactions or SMS alerts occur.
          </p>
          <ResetDemoButton compact />
        </div>
      </footer>
    </div>
  );
}
