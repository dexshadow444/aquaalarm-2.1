// ─────────────────────────────────────────────────────────────────────────────
// AquaAlarm prediction engine (simulated AI — no real ML training).
//
// Model: net daily depth change = extraction pressure − monsoon recharge
//
//   net_daily_drop(ft/day) =
//       extractionRateIndex × EXTRACTION_FT_PER_INDEX_PER_DAY
//     − rainfallMmLast90Days × RECHARGE_FT_PER_MM / HORIZON_DAYS
//
//   depth(t) = currentGroundwaterDepthFt + net_daily_drop × t
//   days_to_crisis = (criticalDepthFt − currentDepthFt) / net_daily_drop
//
// Status: green  → no crisis within 90 days (or water table rising)
//         yellow → crisis in 45–90 days
//         red    → crisis in under 45 days
//
// Constants are calibrated so the demo shows a believable spread of
// green / yellow / red taluks; swap them for real CGWB/IMD-derived
// calibration when live feeds are available.
// ─────────────────────────────────────────────────────────────────────────────

import type { Alert, AppState, DepthPoint, LoanRiskFlag, PredictionRun, Taluk, TalukStatus } from "./types";
import { flagForTaluk } from "./data/seed";

export const HORIZON_DAYS = 90;
export const RED_DAYS = 45;
export const EXTRACTION_FT_PER_INDEX_PER_DAY = 0.0033;
/** Total recharge (ft) contributed by 1 mm of rainfall across the horizon. */
export const RECHARGE_FT_PER_MM = 0.02;
export const PROJECTION_STEP_DAYS = 7;

const round1 = (n: number) => Math.round(n * 10) / 10;

export interface Prediction {
  projection: DepthPoint[];
  daysToCrisis: number | null;
  status: TalukStatus;
  /** Net depth change per day, ft (positive = depleting). */
  netDailyDropFt: number;
}

/** Project a taluk's depth forward over the 90-day horizon. */
export function predictGroundwaterTrend(
  taluk: Pick<
    Taluk,
    | "currentGroundwaterDepthFt"
    | "criticalDepthFt"
    | "rainfallMmLast90Days"
    | "extractionRateIndex"
  >,
  horizonDays = HORIZON_DAYS
): Prediction {
  const rechargePerDay =
    (taluk.rainfallMmLast90Days * RECHARGE_FT_PER_MM) / horizonDays;
  const netDailyDropFt =
    taluk.extractionRateIndex * EXTRACTION_FT_PER_INDEX_PER_DAY - rechargePerDay;

  const projection: DepthPoint[] = [];
  for (let day = 0; day <= horizonDays; day += PROJECTION_STEP_DAYS) {
    projection.push({
      label: day === 0 ? "Today" : `Day ${day}`,
      depth: round1(taluk.currentGroundwaterDepthFt + netDailyDropFt * day),
    });
  }

  const daysToCrisis =
    netDailyDropFt > 0.0001
      ? Math.max(
          1,
          Math.round(
            (taluk.criticalDepthFt - taluk.currentGroundwaterDepthFt) /
              netDailyDropFt
          )
        )
      : null;

  const status: TalukStatus =
    daysToCrisis === null
      ? "green"
      : daysToCrisis < RED_DAYS
        ? "red"
        : daysToCrisis <= horizonDays
          ? "yellow"
          : "green";

  return { projection, daysToCrisis, status, netDailyDropFt };
}

/** Recompute a single taluk's prediction in place. */
export function recalcTaluk(taluk: Taluk): Taluk {
  const p = predictGroundwaterTrend(taluk);
  return {
    ...taluk,
    status: p.status,
    predictedCrisisInDays: p.daysToCrisis,
    projection90Day: p.projection,
    lastUpdated: new Date().toISOString(),
  };
}

/** Human-readable critical alert for a taluk. */
function criticalAlertFor(t: Taluk, role: "all" | "bank" | "government"): Alert {
  const days = t.predictedCrisisInDays;
  const now = new Date().toISOString();
  const roleSuffix = role === "all" ? "farmer" : role;
  if (role === "bank") {
    return {
      id: `alert-${t.id}-${roleSuffix}-${now}`,
      talukId: t.id,
      severity: "critical",
      message: `${t.name} taluk: auto-restrict new crop loans. Projected crisis in ~${days} days — extraction index ${t.extractionRateIndex}/100.`,
      createdAt: now,
      targetRole: "bank",
    };
  }
  if (role === "government") {
    return {
      id: `alert-${t.id}-${roleSuffix}-${now}`,
      talukId: t.id,
      severity: "critical",
      message: `${t.name} taluk crossed into RED. Prioritise tanker allocation, borewell audit and the millet-subsidy campaign within the next ${days} days.`,
      createdAt: now,
      targetRole: "government",
    };
  }
  return {
    id: `alert-${t.id}-${roleSuffix}-${now}`,
    talukId: t.id,
    severity: "critical",
    message: `${t.name} taluk: predicted to cross critical depth (~${t.criticalDepthFt} ft) in ~${days} days. Check your well, conserve water and switch to low-water crops.`,
    createdAt: now,
    targetRole: "all",
  };
}

/** The "daily" prediction cycle: recalc every taluk, then emit alerts and
 *  loan-risk flags for any taluk in (or newly in) red status. */
export function runPredictionCycle(state: AppState): AppState {
  const taluks = state.taluks.map(recalcTaluk);

  const flags: LoanRiskFlag[] = [];
  for (const t of taluks) flags.push(flagForTaluk(t, new Date().toISOString()));

  const alerts = [...state.alerts];
  let alertsGenerated = 0;
  const autoRestriction = { ...state.autoRestriction };

  for (const t of taluks) {
    if (t.status !== "red") continue;
    autoRestriction[t.id] = autoRestriction[t.id] ?? true;
    for (const role of ["all", "bank", "government"] as const) {
      const msg = criticalAlertFor(t, role).message;
      const dup = alerts.some(
        (a) => a.talukId === t.id && a.message === msg
      );
      if (!dup) {
        alerts.unshift(criticalAlertFor(t, role));
        alertsGenerated++;
      }
    }
  }

  const run: PredictionRun = {
    id: `run-${Date.now()}`,
    ranAt: new Date().toISOString(),
    taluksRecalculated: taluks.length,
    redTaluks: taluks.filter((t) => t.status === "red").length,
    alertsGenerated,
  };

  return {
    ...state,
    taluks,
    loanRiskFlags: flags,
    alerts,
    autoRestriction,
    predictionRuns: [run, ...state.predictionRuns].slice(0, 20),
  };
}

/** Suggested resource-allocation actions per taluk (government dashboard). */
export function resourceActionsFor(t: Taluk): string[] {
  if (t.status === "red") {
    return [
      `Approve emergency borewell survey — ${t.name} blocks`,
      `Deploy 4 water-tanker routes/week for drinking water`,
      `Launch millet subsidy campaign in ${t.name} (red-zone blocks)`,
      `Fast-track 60% drip-kit subsidy applications (PMKSY)`,
    ];
  }
  if (t.status === "yellow") {
    return [
      `Start check-dam / recharge-pond work before next monsoon`,
      `Issue monsoon contingency advisory to ${t.district} district`,
      `Pre-position tanker routes (standby)`,
      `Census of borewells > ${Math.round(t.criticalDepthFt - 6)} ft depth`,
    ];
  }
  return [
    `Continue monthly recharge monitoring (${t.rainfallMmLast90Days} mm / 90 days)`,
    `Promote surplus crops for the next season`,
    `Audit extraction permits — maintain green status`,
  ];
}
