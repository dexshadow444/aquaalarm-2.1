// Quick sanity check for the prediction engine + seed data.
// Run: npx tsx scripts/check-engine.ts
import { buildInitialState } from "../src/lib/data/seed";
import { predictGroundwaterTrend, runPredictionCycle } from "../src/lib/engine";

const state = buildInitialState();
console.log("Taluk status spread (seed):");
for (const t of state.taluks) {
  const p = predictGroundwaterTrend(t);
  console.log(
    `  ${t.name.padEnd(16)} depth=${String(t.currentGroundwaterDepthFt).padStart(4)}ft ` +
      `critical=${t.criticalDepthFt}ft rain=${String(t.rainfallMmLast90Days).padStart(3)}mm ` +
      `extr=${String(t.extractionRateIndex).padStart(2)} status=${t.status.padEnd(6)} ` +
      `crisis=${t.predictedCrisisInDays ?? "none"} netDaily=${p.netDailyDropFt.toFixed(4)}`
  );
}

const counts = { green: 0, yellow: 0, red: 0 };
for (const t of state.taluks) counts[t.status]++;
console.log(`\nCounts: green=${counts.green} yellow=${counts.yellow} red=${counts.red}`);
console.log(`Farmers: ${state.farmers.length} · Wells: ${state.wells.length} · Crop recs: ${state.cropRecommendations.length} · Alerts: ${state.alerts.length} · Flags: ${state.loanRiskFlags.length}`);
console.log(`Alerts in red taluks: ${state.alerts.filter((a) => a.severity === "critical").length}`);

const red = state.taluks.filter((t) => t.status === "red");
if (red.length < 1) {
  console.error("FAIL: no red taluks seeded — cross-role story won't demo");
  process.exit(1);
}
if (counts.green < 2 || counts.yellow < 2 || counts.red < 2) {
  console.error("FAIL: status spread too thin");
  process.exit(1);
}

// Cycle test
const after = runPredictionCycle(state);
const run = after.predictionRuns[0];
console.log(`\nCycle: ${run.taluksRecalculated} recalculated, ${run.redTaluks} red, ${run.alertsGenerated} new alerts`);
console.log("OK ✓");
