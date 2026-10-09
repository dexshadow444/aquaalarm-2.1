"use client";

import { useApp } from "@/lib/store";
import { DashboardShell } from "@/components/DashboardShell";
import { RequireSession } from "@/components/RequireSession";
import { AlertFeed } from "@/components/AlertFeed";
import { TaluqStatusBadge } from "@/components/TaluqStatusBadge";
import { Sparkline, TrendChart } from "@/components/TrendChart";
import { Card, Pill } from "@/components/ui";
import { predictGroundwaterTrend } from "@/lib/engine";
import { CROP_WATER_USE } from "@/lib/data/seed";
import {
  formatDays,
  formatDepth,
  formatLiters,
  STATUS_META,
  statusExplain,
} from "@/lib/utils";
import type { CropRecommendation } from "@/lib/types";

export default function FarmerDashboard() {
  const { farmers, wells, taluks, cropRecommendations, alerts, session } = useApp();

  const farmer =
    farmers.find((f) => f.name === session?.name) ?? farmers[0];
  if (!farmer) return null;

  const well = wells.find((w) => w.farmerId === farmer.id);
  const taluk = taluks.find((t) => t.id === farmer.talukId) ?? taluks[0];
  if (!well || !taluk) return null;

  const wellPrediction = predictGroundwaterTrend({
    currentGroundwaterDepthFt: well.currentDepthFt,
    criticalDepthFt: taluk.criticalDepthFt,
    rainfallMmLast90Days: taluk.rainfallMmLast90Days,
    extractionRateIndex: taluk.extractionRateIndex,
  });

  const currentCropWater = CROP_WATER_USE[farmer.currentCrop];
  const savingsVsCurrent = (rec: CropRecommendation) =>
    currentCropWater
      ? Math.round(
          ((currentCropWater - rec.waterRequirementLiters) /
            currentCropWater) *
            100
        )
      : rec.waterSavingsPercent;

  // Only recommend crops that actually save water vs the farmer's current
  // crop (a ragi farmer doesn't need to be told to switch to ragi).
  const recs = cropRecommendations
    .filter((c) => c.talukId === taluk.id)
    .map((rec) => ({ rec, savings: savingsVsCurrent(rec) }))
    .filter(({ savings }) => savings > 0)
    .sort((a, b) => b.savings - a.savings)
    .map(({ rec, savings }) => ({ rec, savings }));

  const topRec = recs[0]?.rec;
  const subsidies = recs.filter(({ rec }) => rec.subsidyAvailable);
  const talukAlerts = alerts.filter((a) => a.talukId === taluk.id);
  const meta = STATUS_META[taluk.status];

  return (
    <RequireSession>
      <DashboardShell role="farmer">
      {/* Taluk status banner */}
      <div
        className={`rounded-xl border px-5 py-4 ${meta.border} ${meta.bg}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold text-abyss">
              {farmer.name.split(".")[1] ?? farmer.name} — {taluk.name} taluk
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-700">
              {statusExplain(taluk)}
            </p>
          </div>
          <TaluqStatusBadge
            status={taluk.status}
            daysToCrisis={taluk.predictedCrisisInDays}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Left / main column ─────────────────────────────────────────── */}
        <div className="space-y-6 lg:col-span-2">
          {/* Your Well */}
          <Card
            title="Your well"
            subtitle={`${farmer.landSizeAcres} acres · ${farmer.currentCrop} · ${farmer.phone}`}
          >
            <div className="grid gap-6 sm:grid-cols-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Current depth
                </div>
                <div className="mt-1 text-4xl font-bold tabular-nums text-abyss">
                  {formatDepth(well.currentDepthFt)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  below surface · critical at {formatDepth(taluk.criticalDepthFt)}
                </div>
                <div className="mt-2">
                  <Pill
                    tone={
                      well.wellStatus === "critical"
                        ? "red"
                        : well.wellStatus === "stressed"
                          ? "amber"
                          : "green"
                    }
                  >
                    {well.wellStatus === "critical"
                      ? "Well at critical level"
                      : well.wellStatus === "stressed"
                        ? "Well under stress"
                        : "Well healthy"}
                  </Pill>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Days until local crisis
                </div>
                <div
                  className={`mt-1 text-4xl font-bold tabular-nums ${
                    wellPrediction.status === "red"
                      ? "text-red"
                      : wellPrediction.status === "yellow"
                        ? "text-amber"
                        : "text-green"
                  }`}
                >
                  {formatDays(wellPrediction.daysToCrisis)}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  at current extraction + recharge trends
                </div>
              </div>
              <div className="sm:col-span-1">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Depth trend · 12 months
                </div>
                <div className="mt-2">
                  <Sparkline
                    data={well.depthHistory}
                    color={
                      wellPrediction.status === "red"
                        ? "#c0392b"
                        : wellPrediction.status === "yellow"
                          ? "#b45309"
                          : "#1a7f4b"
                    }
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Soil Health Card */}
          <Card
            title="Soil Health Profile"
            subtitle={`Government Agriculture Department Data · ${taluk.name} Ward`}
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Primary Soil Type
                </div>
                <div className="mt-1 text-2xl font-bold text-amber-700">
                  {taluk.soilProfile?.type || "Unknown"}
                </div>
                <div className="mt-2 text-[12px] text-slate-500">
                  pH Level: <span className="font-semibold text-abyss">{taluk.soilProfile?.ph}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded border bg-slate-50 p-2">
                  <div className="text-[10px] uppercase text-slate-400">Nitrogen</div>
                  <div className={`mt-1 font-bold ${taluk.soilProfile?.nitrogen === 'Low' ? 'text-red' : 'text-green'}`}>{taluk.soilProfile?.nitrogen}</div>
                </div>
                <div className="rounded border bg-slate-50 p-2">
                  <div className="text-[10px] uppercase text-slate-400">Phosphorus</div>
                  <div className={`mt-1 font-bold ${taluk.soilProfile?.phosphorus === 'Low' ? 'text-red' : 'text-green'}`}>{taluk.soilProfile?.phosphorus}</div>
                </div>
                <div className="rounded border bg-slate-50 p-2">
                  <div className="text-[10px] uppercase text-slate-400">Potassium</div>
                  <div className={`mt-1 font-bold ${taluk.soilProfile?.potassium === 'Low' ? 'text-red' : 'text-green'}`}>{taluk.soilProfile?.potassium}</div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recommended crops */}
          <Card
            title="Recommended crops"
            subtitle={`vs your current crop (${farmer.currentCrop}) · next season`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {recs.map(({ rec, savings }) => {
                const isTop = topRec?.id === rec.id;
                return (
                  <div
                    key={rec.id}
                    className={`rounded-lg border p-4 ${
                      isTop ? "border-ocean bg-foam/50" : "border-line bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-abyss">{rec.cropName}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          {formatLiters(rec.waterRequirementLiters)}/acre/season ·{" "}
                          {rec.suitableSeason}
                        </div>
                      </div>
                      {isTop && <Pill tone="ocean">Best switch</Pill>}
                    </div>
                    <div className="mt-2 text-xl font-bold text-ocean">
                      {savings}% less water
                    </div>
                    <div className="text-[11px] text-slate-400">
                      vs your current crop ({farmer.currentCrop})
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rec.subsidyAvailable ? (
                        <Pill tone="green">Govt subsidy attached</Pill>
                      ) : (
                        <Pill tone="slate">No direct subsidy</Pill>
                      )}
                      {rec.extraSubsidyAvailable && (
                        <Pill tone="ocean">🌟 AquaAlarm Bonus</Pill>
                      )}
                    </div>
                    <div className="mt-3 border-t border-line pt-2">
                      <div className="text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">Soil Match: </span>
                        <span className={rec.soilSuitability === "Optimal" ? "text-green font-semibold" : "text-amber font-semibold"}>
                          {rec.soilSuitability}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] text-slate-400 leading-tight">
                        {rec.soilReasoning}
                      </p>
                    </div>
                    {rec.marketTrend && (
                      <div className="mt-2 border-t border-line pt-2">
                        <div className="text-[11px] font-semibold text-ocean">
                          📈 {rec.marketTrend}
                        </div>
                        {rec.contractAvailable && (
                          <button className="mt-1.5 w-full rounded bg-deep/5 px-2 py-1.5 text-[11px] font-semibold text-deep hover:bg-deep/10 transition text-center">
                            🤝 {rec.contractDetails || "Sign Buy-Guarantee"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Subsidies */}
          <Card
            title="Government subsidies you qualify for"
            subtitle={`${taluk.name} taluk · 2025–26 schemes`}
          >
            <ul className="divide-y divide-line">
              {subsidies.map(({ rec }) => (
                <li key={rec.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="mt-0.5 text-green">✓</span>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-700">
                      {rec.cropName}
                    </div>
                    <p className="text-[12px] leading-relaxed text-slate-500">
                      {rec.subsidyDetails}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* ── Right column ───────────────────────────────────────────────── */}
        <div className="space-y-6">
          <Card
            title="Taluk forecast"
            subtitle="90-day groundwater projection"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-wide text-slate-400">
                  {taluk.name} taluk
                </div>
                <div className="text-2xl font-bold text-abyss">
                  {formatDepth(taluk.currentGroundwaterDepthFt)}
                </div>
              </div>
              <TaluqStatusBadge
                status={taluk.status}
                daysToCrisis={taluk.predictedCrisisInDays}
              />
            </div>
            <div className="mt-3">
              <TrendChart
                data={taluk.projection90Day}
                threshold={taluk.criticalDepthFt}
                thresholdLabel="Critical"
                color="#0e7c86"
                height={150}
              />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
              Simulated projection from extraction index{" "}
              {taluk.extractionRateIndex}/100 and{" "}
              {taluk.rainfallMmLast90Days} mm rainfall (90 days). Runs on the
              daily prediction cycle.
            </p>
          </Card>

          <Card
            title="Alerts for your taluk"
            subtitle="In-app feed — no SMS required"
          >
            <AlertFeed alerts={talukAlerts} taluks={[taluk]} limit={6} />
          </Card>

          <Card
            title="AI Voice & WhatsApp Alerts"
            subtitle="Communication Accessibility"
          >
            <div className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold text-[13px] text-abyss flex items-center gap-2">
                  <span>🤖</span> Enable Smart AI Calls
                </div>
                <div className="relative h-5 w-9 shrink-0 rounded-full bg-ocean transition cursor-pointer">
                  <span className="absolute top-0.5 left-[18px] h-4 w-4 rounded-full bg-white shadow" />
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
                If your region enters a water crisis, the AquaAlarm AI will automatically call or WhatsApp you in your local language to explain soil-specific mitigation steps.
              </p>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] uppercase font-bold text-slate-400">Language preference</label>
                <select className="text-[12px] p-1.5 border rounded-md" defaultValue="ta">
                  <option value="ta">தமிழ் (Tamil)</option>
                  <option value="ml">മലയാളം (Malayalam)</option>
                  <option value="en">English</option>
                </select>
                <button 
                  className="mt-2 w-full rounded bg-abyss px-3 py-2 text-[12px] font-bold text-white hover:bg-deep transition"
                  onClick={(e) => {
                    alert("Calling " + farmer.phone + " using AI Voice Assistant (Demo Simulation)...");
                  }}
                >
                  📞 Send Demo Test Call
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
      </DashboardShell>
    </RequireSession>
  );
}
