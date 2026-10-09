"use client";

import { useMemo, useState } from "react";
import { toggleAutoRestriction, useApp } from "@/lib/store";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireSession } from "@/components/RequireSession";
import { TaluqStatusBadge } from "@/components/TaluqStatusBadge";
import { Sparkline } from "@/components/TrendChart";
import { Card, Pill, Stat } from "@/components/ui";
import { CROP_WATER_USE } from "@/lib/data/seed";
import { formatDays, formatDepth } from "@/lib/utils";
import type { RiskAction } from "@/lib/types";

const ACTION_META: Record<
  RiskAction,
  { label: string; tone: "green" | "amber" | "red" }
> = {
  approve: { label: "Approve", tone: "green" },
  monitor: { label: "Monitor", tone: "amber" },
  restrict: { label: "Restrict", tone: "red" },
};

function loanFor(farmerCrop: string): string {
  if (farmerCrop === "Cotton (flood)")
    return "Drip irrigation kit loan — 60% subsidy, up to ₹55,000/ha";
  if (farmerCrop === "Sugarcane" || farmerCrop === "Paddy")
    return "Crop-switch + drip retrofit loan (water-smart pack)";
  if (farmerCrop === "Banana")
    return "Micro-irrigation retrofit loan";
  return "Drought-resistant seed financing + mulching support";
}

export default function BankDashboard() {
  const { taluks, loanRiskFlags, autoRestriction, farmers, session } = useApp();
  const [district, setDistrict] = useState<string>("all");
  const [risk, setRisk] = useState<string>("all");

  const districts = useMemo(
    () => Array.from(new Set(taluks.map((t) => t.district))).sort(),
    [taluks]
  );

  const flagsByTaluk = useMemo(
    () => new Map(loanRiskFlags.map((f) => [f.talukId, f])),
    [loanRiskFlags]
  );

  const rows = useMemo(() => {
    return taluks
      .map((t) => ({ taluk: t, flag: flagsByTaluk.get(t.id) }))
      .filter(({ taluk }) => district === "all" || taluk.district === district)
      .filter(({ flag }) => risk === "all" || flag?.riskLevel === risk)
      .sort((a, b) => {
        const da = a.taluk.predictedCrisisInDays ?? 9999;
        const db = b.taluk.predictedCrisisInDays ?? 9999;
        return da - db;
      });
  }, [taluks, flagsByTaluk, district, risk]);

  const redTaluks = taluks.filter((t) => t.status === "red");
  const restricted = redTaluks.filter((t) => autoRestriction[t.id] ?? true);

  // Farmers in red/yellow taluks eligible for redirected sustainable credit.
  const redirectCandidates = farmers
    .filter((f) => {
      const t = taluks.find((x) => x.id === f.talukId);
      if (!t || t.status === "green") return false;
      const water = CROP_WATER_USE[f.currentCrop];
      return water !== undefined && water >= 5_000_000;
    })
    .sort((a, b) => a.talukId.localeCompare(b.talukId));

  const bankRegion = taluks.find((t) => t.id === session?.talukId)?.district;

  return (
    <RequireSession>
      <DashboardShell role="bank">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-abyss">Regional Risk Desk</h1>
          <p className="mt-1 text-sm text-slate-500">
            {bankRegion ? `${bankRegion} circle` : "Tamil Nadu"} · decision
            support only — no real disbursals
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-[13px]">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-slate-700 focus:border-ocean focus:outline-none"
            aria-label="Filter by district"
          >
            <option value="all">All districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="rounded-md border border-line bg-white px-3 py-1.5 text-slate-700 focus:border-ocean focus:outline-none"
            aria-label="Filter by risk level"
          >
            <option value="all">All risk levels</option>
            <option value="high">High risk</option>
            <option value="moderate">Moderate risk</option>
            <option value="low">Low risk</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat value={taluks.length} label="Taluks in operating region" sub="10 monitored taluks" />
        <Stat value={redTaluks.length} label="Taluks in red status" sub={`${taluks.filter((t) => t.status === "yellow").length} under watch`} tone="red" />
        <Stat value={restricted.length} label="Auto-restricted taluks" sub="new crop loans blocked" tone="amber" />
        <Stat value={redirectCandidates.length} label="Sustainable-credit candidates" sub="farmers to redirect" tone="green" />
      </div>

      {/* Risk table */}
      <div className="mt-6">
        <Card
          title="Taluk risk table"
          subtitle="Predicted crisis timeline + recommended loan action per taluk"
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-5 py-3 font-semibold">Taluk</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                  <th className="px-3 py-3 font-semibold">Crisis timeline</th>
                  <th className="px-3 py-3 font-semibold">Recommended action</th>
                  <th className="px-5 py-3 font-semibold">Reasoning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map(({ taluk, flag }) => (
                  <tr key={taluk.id} className="align-top hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-abyss">{taluk.name}</div>
                      <div className="text-[11px] text-slate-400">{taluk.district}</div>
                      <div className="mt-1 text-[10px] uppercase text-amber-700 bg-amber-50 inline-block px-1 rounded border border-amber-200">
                        Soil: {taluk.soilProfile?.type || "Unknown"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <TaluqStatusBadge
                        status={taluk.status}
                        daysToCrisis={taluk.predictedCrisisInDays}
                        showDays={false}
                      />
                      <div className="mt-1 w-24">
                        <Sparkline
                          data={taluk.projection90Day}
                          color={
                            taluk.status === "red"
                              ? "#c0392b"
                              : taluk.status === "yellow"
                                ? "#b45309"
                                : "#1a7f4b"
                          }
                          height={26}
                        />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold tabular-nums text-slate-700">
                        {formatDays(taluk.predictedCrisisInDays)}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        depth {formatDepth(taluk.currentGroundwaterDepthFt)} ·{" "}
                        extraction {taluk.extractionRateIndex}/100
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {flag ? (
                        <Pill tone={ACTION_META[flag.recommendedAction].tone}>
                          {ACTION_META[flag.recommendedAction].label}
                        </Pill>
                      ) : (
                        <Pill tone="slate">—</Pill>
                      )}
                      <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                        risk: {flag?.riskLevel ?? "—"}
                      </div>
                    </td>
                    <td className="max-w-xs px-5 py-3 text-[12px] leading-relaxed text-slate-500">
                      {flag?.reasoning ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Auto-restriction rules */}
        <Card
          title="Auto-restriction rules"
          subtitle="Taluks with auto-restricted crop loans due to red status — linked to the prediction engine"
        >
          {redTaluks.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No taluks currently in red status.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {redTaluks.map((t) => {
                const on = autoRestriction[t.id] ?? true;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-abyss">{t.name}</span>
                        <TaluqStatusBadge
                          status={t.status}
                          daysToCrisis={t.predictedCrisisInDays}
                          size="sm"
                        />
                      </div>
                      <p className="mt-0.5 text-[12px] text-slate-500">
                        Depth {formatDepth(t.currentGroundwaterDepthFt)} · critical{" "}
                        {formatDepth(t.criticalDepthFt)} · extraction{" "}
                        {t.extractionRateIndex}/100 ·{" "}
                        {t.rainfallMmLast90Days} mm rain/90d
                      </p>
                    </div>
                    <button
                      onClick={() => toggleAutoRestriction(t.id)}
                      role="switch"
                      aria-checked={on}
                      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                        on ? "bg-red" : "bg-slate-300"
                      }`}
                      title={on ? "Auto-restriction active — click to lift" : "Click to enforce auto-restriction"}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                          on ? "left-[22px]" : "left-0.5"
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-slate-400">
            When a taluk crosses into red, the daily prediction cycle
            auto-generates a <b>restrict</b> flag. Toggles here simulate the
            bank&apos;s override policy layer.
          </p>
        </Card>

        {/* Redirect to sustainable credit */}
        <Card
          title="Redirect to sustainable credit"
          subtitle="Farmers in red/yellow taluks eligible for water-smart loans instead of crop loans"
        >
          {redirectCandidates.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">
              No redirect candidates right now.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {redirectCandidates.map((f) => {
                const taluk = taluks.find((t) => t.id === f.talukId);
                return (
                  <li key={f.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-semibold text-abyss">{f.name}</span>
                        <span className="text-slate-400"> · {taluk?.name} taluk</span>
                      </div>
                      <Pill tone={f.linkedBankAccount ? "green" : "slate"}>
                        {f.linkedBankAccount ? "Linked acct" : "Unbanked"}
                      </Pill>
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-500">
                      {f.landSizeAcres} acres · currently {f.currentCrop} ·{" "}
                      {formatDepth((taluk?.currentGroundwaterDepthFt ?? 0) - 4)} well depth
                    </p>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      ⚠️ Mismatch for {taluk?.soilProfile?.type} soil
                    </p>
                    <p className="mt-1 rounded-md bg-foam/60 px-2.5 py-1.5 text-[12px] font-medium text-deep">
                      → {loanFor(f.currentCrop)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 border-t border-line pt-3 text-[11px] leading-relaxed text-slate-400">
            Recommended instead of a standard crop loan: drip irrigation kits
            (60% subsidy via PMKSY), drought-resistant seed financing and
            mulching support — verified by the state water-smart credit list.
          </p>
        </Card>
      </div>
      </DashboardShell>
    </RequireSession>
  );
}
