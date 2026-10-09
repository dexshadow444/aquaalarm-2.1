"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { login } from "@/lib/store";
import { DEMO_USERS, dashboardFor, ROLE_BLURB } from "@/lib/demoUsers";
import type { Role } from "@/lib/types";
import { Logo, Pill } from "@/components/ui";

const ROLES: (Role | "all")[] = ["all", "farmer", "bank", "government"];

const ROLE_LABEL: Record<Role, string> = {
  farmer: "Farmer",
  bank: "Bank Officer",
  government: "Government Official",
};

export default function LoginPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<Role | "all">("all");

  const users =
    filter === "all" ? DEMO_USERS : DEMO_USERS.filter((u) => u.role === filter);

  const enterAs = (id: string) => {
    const user = DEMO_USERS.find((u) => u.id === id);
    if (!user) return;
    login(user);
    router.push(dashboardFor(user.role));
  };

  return (
    <div className="min-h-screen bg-mist">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" aria-label="Back to AquaAlarm home">
            <Logo />
          </Link>
          <Link href="/" className="text-[13px] font-medium text-slate-500 hover:text-deep">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_1.2fr]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-abyss">
            Sign in to AquaAlarm
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
            AquaAlarm is role-based: the same groundwater prediction engine
            powers a farmer&apos;s crop guidance, a bank&apos;s lending
            decisions and a government official&apos;s resource allocation.
          </p>
          <div className="mt-6 space-y-3">
            {(["farmer", "bank", "government"] as Role[]).map((role) => (
              <div key={role} className="rounded-xl border border-line bg-white p-4">
                <div className="flex items-center gap-2">
                  <Pill tone={role === "farmer" ? "green" : role === "bank" ? "amber" : "deep"}>
                    {ROLE_LABEL[role]}
                  </Pill>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-600">
                  {ROLE_BLURB[role]}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-400">
            Mock authentication for demo purposes — no real SMS/OTP or
            passwords. Pick a demo profile below.
          </p>
        </div>

        <div>
          <div className="flex flex-wrap gap-2">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                  filter === r
                    ? "bg-abyss text-white"
                    : "border border-line bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r === "all" ? "All roles" : ROLE_LABEL[r]}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => enterAs(u.id)}
                className="flex w-full items-center gap-4 rounded-xl border border-line bg-white p-4 text-left transition hover:border-ocean hover:shadow-md"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-foam text-sm font-bold text-deep">
                  {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-abyss">{u.name}</span>
                  <span className="block truncate text-[12px] text-slate-400">{u.subtitle}</span>
                </span>
                <Pill tone={u.role === "farmer" ? "green" : u.role === "bank" ? "amber" : "deep"}>
                  {ROLE_LABEL[u.role]}
                </Pill>
                <span className="text-ocean">→</span>
              </button>
            ))}
            {users.length === 0 && (
              <p className="rounded-xl border border-dashed border-line bg-white p-6 text-center text-sm text-slate-400">
                No demo profiles for this role.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
