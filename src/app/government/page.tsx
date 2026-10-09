"use client";

import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireSession } from "@/components/RequireSession";
import { TaluqMap } from "@/components/TaluqMap";
import { TaluqStatusBadge } from "@/components/TaluqStatusBadge";
import { TrendChart } from "@/components/TrendChart";
import { Card, Pill, Stat } from "@/components/ui";
import { resourceActionsFor } from "@/lib/engine";
import {
  formatDays,
  formatDepth,
  timeAgo,
} from "@/lib/utils";

function crisisDate(days: number | null): string {
  if (days === null) return "—";
  return new Date(Date.now() + days * 86_400_000).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function GovernmentDashboard() {
  const { taluks, loanRiskFlags, predictionRuns } = useApp();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const ranked = useMemo(
    () =>
      [...taluks].sort((a, b) => {
        const da = a.predictedCrisisInDays ?? 9999;
        const db = b.predictedCrisisInDays ?? 9999;
        return da - db;
      }),
    [taluks]
  );

  const red = taluks.filter((t) => t.status === "red");
  const yellow = taluks.filter((t) => t.status === "yellow");
  const green = taluks.filter((t) => t.status === "green");
  const in90 = red.length + yellow.length;

  const selected =
    taluks.find((t) => t.id === selectedId) ?? ranked[0];
  const selectedFlag = loanRiskFlags.find((f) => f.talukId === selected.id);
  const lastRun = predictionRuns[0];

  return (
    <RequireSession>
      <DashboardShell role="government">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-abyss">
            State Overview — Groundwater
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Tamil Nadu · taluk-level early warning ·{" "}
            {lastRun ? `last cycle ${timeAgo(lastRun.ranAt)}` : "seed data"}
          </p>
        </div>
        <Pill tone="ocean">Illustrative data — not official CGWB/IMD</Pill>
      </div>

      {/* Headline rollups */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          value={in90}
          label="Taluks predicted to reach crisis in 90 days"
          sub={`${red.length} red · ${yellow.length} yellow`}
          tone={in90 > 0 ? "red" : "green"}
        />
        <Stat value={red.length} label="Taluks in red (<45 days)" sub={red.map((t) => t.name).join(", ")} tone="red" />
        <Stat
          value={Math.round(
            taluks.reduce((s, t) => s + t.extractionRateIndex, 0) / taluks.length
          )}
          label="Avg extraction index (0–100)"
          sub="state-wide average"
          tone="amber"
        />
        <Stat
          value={green.length}
          label="Taluks safe (>90 days)"
          sub={green.map((t) => t.name).join(", ")}
          tone="green"
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Map */}
        <Card
          title="Taluk risk map"
          subtitle="Click a taluk to inspect it"
          className="lg:col-span-3"
        >
          <TaluqMap
            taluks={taluks}
            selectedId={selected.id}
            onSelect={setSelectedId}
            showLabels
          />
        </Card>

        {/* Ranked list */}
        <Card
          title="Highest-risk taluks"
          subtitle="Ranked by predicted crisis timeline"
          className="lg:col-span-2"
          padded={false}
        >
          <ul className="divide-y divide-line">
            {ranked.map((t, i) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelectedId(t.id)}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-surface/70 ${
                    selected.id === t.id ? "bg-foam/60" : ""
                  }`}
                >
                  <span className="w-5 text-center text-[12px] font-bold tabular-nums text-slate-400">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-abyss">
                      {t.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      {t.district} · crisis ~{crisisDate(t.predictedCrisisInDays)}
                    </span>
                  </span>
                  <span className="text-right">
                    <TaluqStatusBadge
                      status={t.status}
                      daysToCrisis={t.predictedCrisisInDays}
                      size="sm"
                      showDays={false}
                    />
                    <span className="mt-0.5 block text-[10px] tabular-nums text-slate-400">
                      extraction {t.extractionRateIndex}/100
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Selected taluk detail */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Card
            title={`${selected.name} taluk — 12-month depth history`}
            subtitle={`${selected.district} district · last updated ${timeAgo(selected.lastUpdated)}`}
            actions={
              <TaluqStatusBadge
                status={selected.status}
                daysToCrisis={selected.predictedCrisisInDays}
              />
            }
          >
            <TrendChart
              data={selected.historicalDepthTrend}
              threshold={selected.criticalDepthFt}
              thresholdLabel="Critical"
              color="#11576e"
              height={180}
            />
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Current depth</div>
                <div className="text-lg font-bold tabular-nums text-abyss">
                  {formatDepth(selected.currentGroundwaterDepthFt)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Crisis in</div>
                <div className="text-lg font-bold tabular-nums text-abyss">
                  {formatDays(selected.predictedCrisisInDays)}
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Rainfall (90d)</div>
                <div className="text-lg font-bold tabular-nums text-abyss">
                  {selected.rainfallMmLast90Days} mm
                </div>
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">Extraction</div>
                <div className="text-lg font-bold tabular-nums text-abyss">
                  {selected.extractionRateIndex}/100
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Soil Health Profile"
            subtitle="Agriculture Department Data"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Primary Soil Type
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-700">
                  {selected.soilProfile?.type || "Unknown"}
                </div>
                <div className="mt-2 text-[12px] text-slate-500">
                  pH Level: <span className="font-semibold text-abyss">{selected.soilProfile?.ph}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border bg-slate-50 p-2">
                  <div className="text-[10px] uppercase text-slate-400">Nitrogen</div>
                  <div className={`mt-1 font-bold ${selected.soilProfile?.nitrogen === 'Low' ? 'text-red' : 'text-green'}`}>{selected.soilProfile?.nitrogen}</div>
                </div>
                <div className="rounded border bg-slate-50 p-2">
                  <div className="text-[10px] uppercase text-slate-400">Phosphorus</div>
                  <div className={`mt-1 font-bold ${selected.soilProfile?.phosphorus === 'Low' ? 'text-red' : 'text-green'}`}>{selected.soilProfile?.phosphorus}</div>
                </div>
                <div className="rounded border bg-slate-50 p-2">
                  <div className="text-[10px] uppercase text-slate-400">Potassium</div>
                  <div className={`mt-1 font-bold ${selected.soilProfile?.potassium === 'Low' ? 'text-red' : 'text-green'}`}>{selected.soilProfile?.potassium}</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card
            title="90-day forward projection"
            subtitle="Simulated AI projection from extraction + recharge"
          >
            <TrendChart
              data={selected.projection90Day}
              threshold={selected.criticalDepthFt}
              thresholdLabel="Critical"
              color={selected.status === "red" ? "#c0392b" : selected.status === "yellow" ? "#b45309" : "#1a7f4b"}
              height={150}
            />
          </Card>

          <Card
            title="Resource allocation"
            subtitle="Suggested actions for this taluk"
          >
            <ul className="space-y-2">
              {resourceActionsFor(selected).map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px] leading-snug text-slate-700"
                >
                  <span className="mt-0.5 text-ocean">▸</span>
                  {a}
                </li>
              ))}
            </ul>
          </Card>

          {selectedFlag && (
            <Card title="Bank risk flag" subtitle="Shared with the Regional Risk Desk">
              <div className="flex items-center gap-2">
                <Pill
                  tone={
                    selectedFlag.recommendedAction === "restrict"
                      ? "red"
                      : selectedFlag.recommendedAction === "monitor"
                        ? "amber"
                        : "green"
                  }
                >
                  {selectedFlag.recommendedAction}
                </Pill>
                <Pill tone="slate">risk: {selectedFlag.riskLevel}</Pill>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-600">
                {selectedFlag.reasoning}
              </p>
            </Card>
          )}
        </div>
      </div>
      </DashboardShell>
    </RequireSession>
  );
}
