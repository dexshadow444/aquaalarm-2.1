// ─────────────────────────────────────────────────────────────────────────────
// AquaAlarm seed data + deterministic generators.
//
// All "observed" depth histories are simulated. Numbers are calibrated to be
// credible for Tamil Nadu (hard-rock taluks in the west/north are deeper and
// more stressed; delta taluks like Thanjavur are shallow), but they are NOT
// real CGWB/IMD readings. See README.md → Research & data caveats.
// ─────────────────────────────────────────────────────────────────────────────

import { predictGroundwaterTrend } from "../engine";

import type {
  AppState,
  CropRecommendation,
  Farmer,
  LoanRiskFlag,
  Taluk,
  Well,
} from "../types";

// Deterministic PRNG so SSR + client + every reload produce identical seed data.
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export const SEED_TIMESTAMP = "2026-08-13T06:00:00.000Z";

// ── Taluk master data ─────────────────────────────────────────────────────────

interface TalukSeed {
  id: string;
  name: string;
  district: string;
  depth: number;
  critical: number;
  rain: number;
  extraction: number;
  lon: number;
  lat: number;
  soilType: import("../types").SoilType;
}

export const TALUK_SEEDS: TalukSeed[] = [
  { id: "dharmapuri",   name: "Dharmapuri",        district: "Dharmapuri",        depth: 96, critical: 104, rain: 245, extraction: 82, lon: 78.16, lat: 12.13, soilType: "Red Sandy" },
  { id: "salem",        name: "Salem",             district: "Salem",             depth: 88, critical: 96,  rain: 280, extraction: 74, lon: 78.15, lat: 11.65, soilType: "Red Sandy" },
  { id: "coimbatore",   name: "Coimbatore",        district: "Coimbatore",        depth: 79, critical: 88,  rain: 470, extraction: 63, lon: 76.96, lat: 11.02, soilType: "Black Cotton" },
  { id: "erode",        name: "Erode",             district: "Erode",             depth: 83, critical: 92,  rain: 385, extraction: 58, lon: 77.72, lat: 11.34, soilType: "Black Cotton" },
  { id: "madurai",      name: "Madurai",           district: "Madurai",           depth: 92, critical: 99,  rain: 210, extraction: 77, lon: 78.12, lat: 9.93,  soilType: "Laterite" },
  { id: "trichy",       name: "Tiruchirappalli",   district: "Tiruchirappalli",   depth: 71, critical: 81,  rain: 350, extraction: 68, lon: 78.70, lat: 10.79, soilType: "Alluvial" },
  { id: "theni",        name: "Theni",             district: "Theni",             depth: 64, critical: 76,  rain: 610, extraction: 41, lon: 77.48, lat: 10.01, soilType: "Clayey" },
  { id: "virudhunagar", name: "Virudhunagar",      district: "Virudhunagar",      depth: 87, critical: 94,  rain: 300, extraction: 52, lon: 77.95, lat: 9.58,  soilType: "Black Cotton" },
  { id: "thanjavur",    name: "Thanjavur",         district: "Thanjavur",         depth: 56, critical: 68,  rain: 520, extraction: 35, lon: 79.14, lat: 10.79, soilType: "Alluvial" },
  { id: "ramanathapuram", name: "Ramanathapuram",  district: "Ramanathapuram",   depth: 75, critical: 86,  rain: 400, extraction: 40, lon: 78.84, lat: 9.36,  soilType: "Red Sandy" },
];

// ── Historical trend generation ───────────────────────────────────────────────

const MONTH_LABELS = [
  "Sep 2025", "Oct 2025", "Nov 2025", "Dec 2025", "Jan 2026", "Feb 2026",
  "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026",
];

/** Seasonal depth offset in ft: depth rises in the dry pre-monsoon months
 *  (Mar–May) and recovers after the NE monsoon (Oct–Dec). */
const MONTH_OFFSET = [-4, -5, -3, -2, -1, 2, 3, 4, 3, 1, -1, -2];

function historicalTrend(seed: TalukSeed, rng: () => number): Taluk["historicalDepthTrend"] {
  const monthlyTrend = seed.extraction / 130; // ft/month depletion, 12-month view
  const out = [];
  for (let i = 0; i < 11; i++) {
    const monthsAgo = 11 - i;
    const depth =
      seed.depth -
      monthsAgo * monthlyTrend +
      MONTH_OFFSET[i] +
      (rng() - 0.5) * 1.6;
    out.push({ label: MONTH_LABELS[i], depth: round1(Math.max(10, depth)) });
  }
  out.push({ label: MONTH_LABELS[11], depth: seed.depth }); // last = current
  return out;
}

// ── Farmers / wells ───────────────────────────────────────────────────────────

interface FarmerSeed {
  id: string;
  name: string;
  phone: string;
  talukId: string;
  acres: number;
  crop: string;
  bank: boolean;
}

export const FARMER_SEEDS: FarmerSeed[] = [
  { id: "f1",  name: "K. Murugan",      phone: "+91 98420 11431", talukId: "dharmapuri",    acres: 4.5, crop: "Finger millet",      bank: true },
  { id: "f2",  name: "P. Selvam",       phone: "+91 98421 55672", talukId: "dharmapuri",    acres: 6.0, crop: "Groundnut",          bank: true },
  { id: "f3",  name: "J. Pandian",      phone: "+91 97896 22014", talukId: "dharmapuri",    acres: 3.2, crop: "Paddy",              bank: false },
  { id: "f4",  name: "M. Kalaiyarasi",  phone: "+91 90433 81025", talukId: "salem",         acres: 5.0, crop: "Sorghum",            bank: true },
  { id: "f5",  name: "R. Ganesan",      phone: "+91 98947 33168", talukId: "salem",         acres: 7.5, crop: "Sugarcane",          bank: true },
  { id: "f6",  name: "S. Prakash",      phone: "+91 96551 90473", talukId: "coimbatore",    acres: 8.0, crop: "Cotton (flood)",     bank: true },
  { id: "f7",  name: "D. Karthika",     phone: "+91 94433 22819", talukId: "coimbatore",    acres: 4.0, crop: "Maize",              bank: false },
  { id: "f8",  name: "V. Ramasamy",     phone: "+91 98430 55246", talukId: "erode",         acres: 6.5, crop: "Turmeric",           bank: true },
  { id: "f9",  name: "A. Meenakshi",    phone: "+91 90950 14372", talukId: "madurai",       acres: 3.8, crop: "Pulses",             bank: true },
  { id: "f10", name: "N. Balaji",       phone: "+91 99650 87713", talukId: "madurai",       acres: 9.0, crop: "Sugarcane",          bank: true },
  { id: "f11", name: "S. Lakshmi",      phone: "+91 97902 66481", talukId: "madurai",       acres: 2.5, crop: "Vegetables",         bank: false },
  { id: "f12", name: "K. Rajendran",    phone: "+91 94875 33092", talukId: "trichy",        acres: 5.5, crop: "Paddy",              bank: true },
  { id: "f13", name: "L. Vignesh",      phone: "+91 96554 70981", talukId: "theni",         acres: 4.2, crop: "Banana",             bank: true },
  { id: "f14", name: "T. Saravanan",    phone: "+91 94431 65520", talukId: "virudhunagar",  acres: 6.0, crop: "Cotton (flood)",     bank: true },
  { id: "f15", name: "R. Karthik",      phone: "+91 98944 22137", talukId: "thanjavur",     acres: 10.0, crop: "Paddy",             bank: true },
  { id: "f16", name: "M. Ansari",       phone: "+91 98402 77843", talukId: "ramanathapuram", acres: 7.0, crop: "Groundnut",         bank: false },
];

/** Approximate per-acre-per-season water use (litres) for common TN crops —
 *  used to compute savings vs a farmer's current crop. Approximate figures. */
export const CROP_WATER_USE: Record<string, number> = {
  "Paddy": 12_500_000,
  "Sugarcane": 15_000_000,
  "Cotton (flood)": 11_000_000,
  "Banana": 9_000_000,
  "Turmeric": 7_500_000,
  "Vegetables": 6_500_000,
  "Maize": 6_000_000,
  "Finger millet": 4_200_000,
  "Sorghum": 4_600_000,
  "Pulses": 3_600_000,
  "Groundnut": 5_200_000,
};

// ── Crop recommendations (baseline = paddy) ───────────────────────────────────

interface CropBase {
  cropName: string;
  water: number;
  season: string;
  subsidy: boolean;
  subsidyDetails: string;
}

const CROP_BASES: CropBase[] = [
  {
    cropName: "Finger millet (ragi)",
    water: 4_200_000,
    season: "Kharif (Jun–Sep) / Rabi (Oct–Jan)",
    subsidy: true,
    subsidyDetails:
      "₹12,000/acre incentive under the Tamil Nadu State Millet Mission (2025–26) + free ragi seed kits through the block agriculture office.",
  },
  {
    cropName: "Sorghum (jowar)",
    water: 4_600_000,
    season: "Rabi (Oct–Jan)",
    subsidy: true,
    subsidyDetails:
      "₹10,000/acre support + 50% seed subsidy under the Dept. of Agriculture drought-proofing package.",
  },
  {
    cropName: "Green gram / pulses",
    water: 3_600_000,
    season: "Summer (Feb–Apr) / Rabi",
    subsidy: true,
    subsidyDetails:
      "₹8,000/acre under the National Food Security Mission–Pulses, incl. bio-fertilizer kits.",
  },
  {
    cropName: "Drip-irrigated cotton",
    water: 6_800_000,
    season: "Kharif (Jun–Sep)",
    subsidy: true,
    subsidyDetails:
      "60% subsidy on drip irrigation kits (up to ₹55,000/ha) under PMKSY–Per Drop More Crop.",
  },
  {
    cropName: "Groundnut",
    water: 5_200_000,
    season: "Kharif (Jun–Sep)",
    subsidy: true,
    subsidyDetails:
      "₹7,500/acre input subsidy + 50% gypsum subsidy under the Oilseeds Development Programme.",
  },
  {
    cropName: "Sesame (ellu)",
    water: 3_100_000,
    season: "Summer (Feb–Apr)",
    subsidy: false,
    subsidyDetails:
      "No direct subsidy in 2026; state procurement at MSP via TNCSC gives a stable market.",
  },
];

const PADDY_WATER = 12_500_000;

function buildCropRecommendations(
  taluks: Taluk[],
  rng: () => number
): CropRecommendation[] {
  const out: CropRecommendation[] = [];
  for (const t of taluks) {
    for (const base of CROP_BASES) {
      // Small per-taluk variation so figures feel locally calibrated.
      const water = Math.round(base.water * (0.92 + rng() * 0.16));
      const savings = Math.round(((PADDY_WATER - water) / PADDY_WATER) * 100);

      let soilSuitability: "Optimal" | "Moderate" | "Poor" = "Moderate";
      let soilReasoning = "Acceptable yield for this soil type.";
      let extraSubsidyAvailable = false;
      let marketTrend = "+5% stable demand";
      let contractAvailable = false;
      let contractDetails = "";
      
      const st = t.soilProfile.type;
      if (base.cropName.includes("Finger millet") || base.cropName.includes("Sorghum")) {
        marketTrend = "Market price up 15% this month";
        contractAvailable = true;
        contractDetails = "Sign buy-guarantee with ITC Health Foods";
        if (st === "Red Sandy" || st === "Laterite") {
          soilSuitability = "Optimal";
          soilReasoning = `Highly suitable for ${st} soil with low water retention.`;
          extraSubsidyAvailable = true;
        }
      } else if (base.cropName.includes("cotton")) {
        marketTrend = "Global export demand surging (+12%)";
        contractAvailable = true;
        contractDetails = "Click here to sign a buy-guarantee with local Textile Mills";
        if (st === "Black Cotton") {
          soilSuitability = "Optimal";
          soilReasoning = "Black Cotton soil provides ideal conditions for deep root penetration.";
          extraSubsidyAvailable = true;
        } else if (st === "Red Sandy") {
          soilSuitability = "Poor";
          soilReasoning = "Poor moisture retention limits yield in Red Sandy soils.";
        }
      } else if (base.cropName.includes("Groundnut") || base.cropName.includes("Sesame")) {
        marketTrend = "High demand for edible oils (+8%)";
        contractAvailable = true;
        contractDetails = "Contract farming available with Adani Wilmar";
        if (st === "Red Sandy" || st === "Alluvial") {
          soilSuitability = "Optimal";
          soilReasoning = `Ideal loose structure of ${st} soil supports pod development.`;
          extraSubsidyAvailable = true;
        } else if (st === "Clayey") {
          soilSuitability = "Poor";
          soilReasoning = "Heavy clay restricts root and pod expansion.";
        }
      }

      out.push({
        id: `crop-${t.id}-${base.cropName.toLowerCase().replace(/[^a-z]/g, "-")}`,
        talukId: t.id,
        cropName: base.cropName,
        waterRequirementLiters: water,
        baselineCrop: "Paddy",
        baselineWaterRequirementLiters: PADDY_WATER,
        waterSavingsPercent: savings,
        suitableSeason: base.season,
        subsidyAvailable: base.subsidy,
        subsidyDetails: base.subsidyDetails,
        extraSubsidyAvailable,
        soilSuitability,
        soilReasoning,
        marketTrend,
        contractAvailable,
        contractDetails,
      });
    }
  }
  return out;
}

// ── Loan risk flags ───────────────────────────────────────────────────────────

export function flagForTaluk(t: Taluk, generatedAt: string): LoanRiskFlag {
  const crisis = t.predictedCrisisInDays;
  if (t.status === "red") {
    return {
      id: `flag-${t.id}-${generatedAt}`,
      talukId: t.id,
      riskLevel: "high",
      recommendedAction: "restrict",
      reasoning: `Projected to cross critical depth (~${t.criticalDepthFt} ft) in ~${crisis} days. Extraction index ${t.extractionRateIndex}/100 with only ${t.rainfallMmLast90Days} mm rain in 90 days. Restrict new crop loans; require drip-irrigation compliance and a recharge plan for any renewal.`,
      generatedAt,
    };
  }
  if (t.status === "yellow") {
    return {
      id: `flag-${t.id}-${generatedAt}`,
      talukId: t.id,
      riskLevel: "moderate",
      recommendedAction: "monitor",
      reasoning: `Projected crisis in ~${crisis} days. Monitor disbursals, cap new high-water-crop loans, and verify monsoon recharge before the next cycle.`,
      generatedAt,
    };
  }
  return {
    id: `flag-${t.id}-${generatedAt}`,
    talukId: t.id,
    riskLevel: "low",
    recommendedAction: "approve",
    reasoning: `Recharge outlook healthy (${t.rainfallMmLast90Days} mm / 90 days) and extraction (${t.extractionRateIndex}/100) is within sustainable range. Standard lending criteria apply.`,
    generatedAt,
  };
}

// ── Build the initial state ───────────────────────────────────────────────────

export function buildInitialState(): AppState {
  const rng = mulberry32(20260813);

  const taluks: Taluk[] = TALUK_SEEDS.map((s) => ({
    id: s.id,
    name: s.name,
    district: s.district,
    currentGroundwaterDepthFt: s.depth,
    criticalDepthFt: s.critical,
    historicalDepthTrend: historicalTrend(s, rng),
    rainfallMmLast90Days: s.rain,
    extractionRateIndex: s.extraction,
    status: "green",
    predictedCrisisInDays: null,
    projection90Day: [],
    lastUpdated: SEED_TIMESTAMP,
    mapPos: { lon: s.lon, lat: s.lat },
    soilProfile: {
      type: s.soilType,
      nitrogen: s.soilType === "Alluvial" ? "High" : "Low",
      phosphorus: s.soilType === "Black Cotton" ? "Medium" : "Low",
      potassium: s.soilType === "Red Sandy" ? "Medium" : "High",
      ph: s.soilType === "Laterite" ? 5.5 : 7.2,
    },
  }));

  // Initial statuses/predictions come from the engine (run at seed time).
  for (const t of taluks) {
    const p = predictGroundwaterTrend(t);
    t.status = p.status;
    t.predictedCrisisInDays = p.daysToCrisis;
    t.projection90Day = p.projection;
  }

  const farmers: Farmer[] = FARMER_SEEDS.map((f) => ({
    id: f.id,
    name: f.name,
    phone: f.phone,
    talukId: f.talukId,
    wellId: `w-${f.id}`,
    landSizeAcres: f.acres,
    currentCrop: f.crop,
    linkedBankAccount: f.bank,
  }));

  const talukById = new Map(taluks.map((t) => [t.id, t]));

  const wells: Well[] = farmers.map((f) => {
    const t = talukById.get(f.talukId)!;
    const stress = rng(); // 0..1
    const current =
      t.currentGroundwaterDepthFt + (stress - 0.25) * 8;
    const monthlyTrend = t.extractionRateIndex / 130;
    const history: Well["depthHistory"] = [];
    for (let i = 0; i < 11; i++) {
      const monthsAgo = 10 - i;
      history.push({
        label: MONTH_LABELS[i + 1],
        depth: round1(
          Math.max(8, current - monthsAgo * monthlyTrend + (rng() - 0.5) * 2)
        ),
      });
    }
    history.push({ label: MONTH_LABELS[11], depth: round1(current) });
    const wellStatus =
      current >= t.criticalDepthFt
        ? "critical"
        : current >= t.criticalDepthFt - 6
          ? "stressed"
          : "healthy";
    return {
      id: `w-${f.id}`,
      farmerId: f.id,
      talukId: f.talukId,
      currentDepthFt: round1(current),
      depthHistory: history,
      wellStatus,
    };
  });

  const cropRecommendations = buildCropRecommendations(taluks, rng);

  const flags = taluks.map((t) => flagForTaluk(t, SEED_TIMESTAMP));

  const autoRestriction: Record<string, boolean> = {};
  for (const t of taluks) autoRestriction[t.id] = t.status === "red";

  return {
    taluks,
    farmers,
    wells,
    cropRecommendations,
    loanRiskFlags: flags,
    alerts: buildSeedAlerts(taluks),
    predictionRuns: [],
    autoRestriction,
    session: null,
    hydrated: false,
  };
}

function buildSeedAlerts(taluks: Taluk[]) {
  const alerts: import("../types").Alert[] = [];
  const now = SEED_TIMESTAMP;
  let n = 0;
  const push = (talukId: string, severity: "critical" | "warning" | "info", message: string, targetRole: "farmer" | "bank" | "government" | "all") =>
    alerts.push({ id: `alert-seed-${n++}`, talukId, severity, message, createdAt: now, targetRole });

  for (const t of taluks) {
    const days = t.predictedCrisisInDays;
    if (t.status === "red") {
      push(t.id, "critical", `${t.name} taluk: predicted to cross critical depth (~${t.criticalDepthFt} ft) in ~${days} days. Wells in dry blocks at highest risk — do not delay.`, "all");
      push(t.id, "critical", `${t.name} taluk: restrict new crop loans. Projected crisis in ~${days} days with extraction at ${t.extractionRateIndex}/100.`, "bank");
      push(t.id, "warning", `${t.name} taluk: prioritise tanker allocation and a borewell audit before the crisis window closes.`, "government");
    } else if (t.status === "yellow") {
      push(t.id, "warning", `${t.name} taluk: crisis possible in ~${days} days. Switch high-water crops and start recharge work now.`, "farmer");
      push(t.id, "warning", `${t.name} taluk: monitor disbursals — projected crisis in ~${days} days.`, "bank");
    } else {
      push(t.id, "info", `${t.name} taluk: recharge outlook healthy after recent rainfall (${t.rainfallMmLast90Days} mm / 90 days).`, "all");
    }
  }
  return alerts;
}
