"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp, login, useMounted } from "@/lib/store";
import { DEMO_USERS, dashboardFor, ROLE_BLURB } from "@/lib/demoUsers";
import type { Role } from "@/lib/types";
import { TaluqMap } from "@/components/TaluqMap";
import { GlobalAlertBanner } from "@/components/Nav";
import { Card, Logo, Pill } from "@/components/ui";

const ROLE_ICON: Record<Role, string> = {
  farmer: "🌾",
  bank: "🏦",
  government: "🏛️",
};

export default function LandingPage() {
  const router = useRouter();
  const { taluks, predictionRuns } = useApp();
  const mounted = useMounted();

  const red = taluks.filter((t) => t.status === "red");
  const yellow = taluks.filter((t) => t.status === "yellow");
  const green = taluks.filter((t) => t.status === "green");

  const enterAs = (role: Role) => {
    const user = DEMO_USERS.find((u) => u.role === role) ?? DEMO_USERS[0];
    login(user);
    router.push(dashboardFor(role));
  };

  return (
    <div className="min-h-screen bg-surface">
      <GlobalAlertBanner />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-abyss text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(62,167,182,0.35), transparent 45%), radial-gradient(circle at 15% 90%, rgba(17,87,110,0.5), transparent 40%)",
          }}
        />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Logo dark />
          <Link
            href="/login"
            className="rounded-md border border-white/30 px-3.5 py-1.5 text-[13px] font-semibold hover:bg-white/10"
          >
            Sign in
          </Link>
        </header>

        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <Pill tone="ocean">
              {mounted && red.length > 0
                ? `⚠ ${red.length} Tamil Nadu taluks in crisis window`
                : "Groundwater early-warning platform"}
            </Pill>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight md:text-5xl">
              Know your groundwater{" "}
              <span className="text-aqua">90 days before</span> the crisis.
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-slate-200">
              Tamil Nadu is losing 3–4 feet of groundwater every year. When
              wells run dry, farmers dig deeper — draining the shared aquifer
              faster and collapsing wells across a whole taluk. AquaAlarm gives
              farmers, banks and policymakers one shared, predictive view of
              groundwater health, so they can act 30–90 days early instead of
              after the damage.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {(
                [
                  ["farmer", "I'm a Farmer"],
                  ["bank", "I'm a Bank Officer"],
                  ["government", "I'm a Government Official"],
                ] as [Role, string][]
              ).map(([role, label]) => (
                <button
                  key={role}
                  onClick={() => enterAs(role)}
                  className="group rounded-xl border border-white/15 bg-white/5 px-4 py-4 text-left backdrop-blur transition hover:border-aqua hover:bg-white/10"
                >
                  <div className="text-xl">{ROLE_ICON[role]}</div>
                  <div className="mt-2 text-sm font-bold">{label}</div>
                  <div className="mt-1 text-[11px] leading-snug text-slate-300">
                    {ROLE_BLURB[role].split(".")[0]}.
                  </div>
                  <div className="mt-2 text-[11px] font-semibold text-aqua opacity-0 transition group-hover:opacity-100">
                    Enter demo →
                  </div>
                </button>
              ))}
            </div>
            <p className="mt-3 text-[11px] text-slate-400">
              One-click demo login · mock auth, no real account needed
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Live taluk status board
              </h2>
              <span className="text-[11px] text-slate-400">
                last cycle: {mounted ? (predictionRuns[0] ? "auto" : "seed") : "…"}
              </span>
            </div>
            <TaluqMap taluks={taluks} showLabels={false} />
          </div>
        </div>

        <div className="relative border-t border-white/10 bg-black/20">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-6 md:grid-cols-4">
            {[
              { v: mounted ? String(taluks.length) : "10", l: "taluks monitored" },
              { v: mounted ? String(red.length) : "3", l: "in crisis window (<45 days)", tone: "text-red-400" },
              { v: mounted ? String(yellow.length) : "4", l: "under watch (45–90 days)", tone: "text-amber-300" },
              { v: mounted ? String(green.length) : "3", l: "safe (>90 days)", tone: "text-emerald-300" },
            ].map((s) => (
              <div key={s.l}>
                <div className={`text-3xl font-bold tabular-nums ${s.tone ?? "text-white"}`}>{s.v}</div>
                <div className="mt-1 text-[12px] text-slate-300">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold text-abyss">One shared prediction, three jobs to do</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          The same groundwater projection feeds every role — so a farmer’s crop
          choice, a bank’s lending decision and a district’s tanker allocation
          all respond to the same early-warning signal.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Card title="① Predict" subtitle="Simulated AI projection engine">
            <p className="text-sm leading-relaxed text-slate-600">
              Each taluk’s depth is projected 90 days out from extraction
              pressure and monsoon recharge. Status:{" "}
              <b className="text-green">green</b> (safe) →{" "}
              <b className="text-amber">yellow</b> (45–90 days) →{" "}
              <b className="text-red">red</b> (&lt;45 days). Red crossings
              auto-generate alerts and bank risk flags.
            </p>
          </Card>
          <Card title="② Guide" subtitle="Farmer + bank decisions">
            <p className="text-sm leading-relaxed text-slate-600">
              Farmers get their well’s outlook, low-water crop swaps with real
              savings, and subsidies. Banks get per-taluk loan actions —{" "}
              <b>approve / monitor / restrict</b> — and redirect credit to
              drip irrigation and drought-resistant seeds.
            </p>
          </Card>
          <Card title="③ Protect" subtitle="Government resource allocation">
            <p className="text-sm leading-relaxed text-slate-600">
              Officials see the state ranked by risk, historical trends and
              ready-to-run actions per taluk: borewell surveys, tanker
              routes, millet subsidy campaigns — weeks before the crisis hits.
            </p>
          </Card>
        </div>
      </section>

      {/* ── Role deep-dive ────────────────────────────────────────────────── */}
      <section className="border-t border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold text-abyss">Explore a role</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {(
              [
                ["farmer", "Farmer dashboard", "Your well, your taluk, your next crop"],
                ["bank", "Bank dashboard", "Risk-gate credit, reward water-smart farming"],
                ["government", "Government dashboard", "State risk map, ranked taluks, allocation"],
              ] as [Role, string, string][]
            ).map(([role, title, sub]) => (
              <button
                key={role}
                onClick={() => enterAs(role)}
                className="group rounded-xl border border-line bg-surface p-6 text-left transition hover:border-ocean hover:shadow-md"
              >
                <div className="text-2xl">{ROLE_ICON[role]}</div>
                <div className="mt-3 text-base font-bold text-abyss">{title}</div>
                <div className="mt-1 text-[13px] text-slate-500">{sub}</div>
                <div className="mt-4 text-[13px] font-semibold text-ocean">
                  Open {role} view →
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-line bg-mist">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-[12px] text-slate-400 md:flex-row md:items-center md:justify-between">
          <p>
            <span className="font-semibold text-slate-500">AquaAlarm</span> —
            concept demo for a groundwater early-warning platform. All data is
            simulated; this is not official CGWB/IMD information.
          </p>
          <p>Built as a public-infrastructure software concept · Tamil Nadu, India</p>
        </div>
      </footer>
    </div>
  );
}
