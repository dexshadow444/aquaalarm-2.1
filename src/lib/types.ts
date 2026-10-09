// ─────────────────────────────────────────────────────────────────────────────
// AquaAlarm core domain types.
// These mirror the Convex tables described in the spec, but live in a
// client-side simulated store so the demo runs anywhere (including Vercel)
// with zero external services.
// ─────────────────────────────────────────────────────────────────────────────

export type Role = "farmer" | "bank" | "government";

export type TalukStatus = "green" | "yellow" | "red";

export type RiskLevel = "low" | "moderate" | "high";

export type RiskAction = "approve" | "monitor" | "restrict";

export type AlertSeverity = "critical" | "warning" | "info";

export type AlertTargetRole = Role | "all";

export type WellStatus = "healthy" | "stressed" | "critical";

export interface DepthPoint {
  label: string; // month label or day
  depth: number; // ft below surface
}

export type SoilType = "Red Sandy" | "Black Cotton" | "Alluvial" | "Laterite" | "Clayey";

export interface SoilProfile {
  type: SoilType;
  nitrogen: "Low" | "Medium" | "High";
  phosphorus: "Low" | "Medium" | "High";
  potassium: "Low" | "Medium" | "High";
  ph: number;
}

/** A taluk — the core unit of prediction. */
export interface Taluk {
  id: string;
  name: string;
  district: string;
  /** Current depth to groundwater, ft below surface. */
  currentGroundwaterDepthFt: number;
  /** Depth at which the taluk is considered in crisis (wells start failing). */
  criticalDepthFt: number;
  /** Last 12 months of (simulated) observed depth. */
  historicalDepthTrend: DepthPoint[];
  rainfallMmLast90Days: number;
  /** 0–100 intensity of groundwater extraction. */
  extractionRateIndex: number;
  status: TalukStatus;
  predictedCrisisInDays: number | null;
  /** 90-day forward projection (weekly points). */
  projection90Day: DepthPoint[];
  lastUpdated: string;
  /** Approximate map position (lon, lat) for the illustrative map. */
  mapPos: { lon: number; lat: number };
  /** Simulated Government Agriculture Department Soil Data */
  soilProfile: SoilProfile;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  talukId: string;
  wellId: string;
  landSizeAcres: number;
  currentCrop: string;
  linkedBankAccount: boolean;
  voiceAlertsEnabled?: boolean;
  alertLanguage?: string;
}

export interface Well {
  id: string;
  farmerId: string;
  talukId: string;
  currentDepthFt: number;
  depthHistory: DepthPoint[];
  wellStatus: WellStatus;
}

export interface CropRecommendation {
  id: string;
  talukId: string;
  cropName: string;
  /** Litres of water per acre per season. */
  waterRequirementLiters: number;
  /** The high-water crop this is compared against (e.g. paddy). */
  baselineCrop: string;
  baselineWaterRequirementLiters: number;
  waterSavingsPercent: number;
  suitableSeason: string;
  subsidyAvailable: boolean;
  subsidyDetails: string;
  /** Extra subsidy for adopting soil-appropriate and water-saving crop */
  extraSubsidyAvailable: boolean;
  soilSuitability: "Optimal" | "Moderate" | "Poor";
  soilReasoning: string;
  /** Market Price & Contract Farming */
  marketTrend?: string;
  contractAvailable?: boolean;
  contractDetails?: string;
}

export interface LoanRiskFlag {
  id: string;
  talukId: string;
  riskLevel: RiskLevel;
  recommendedAction: RiskAction;
  reasoning: string;
  generatedAt: string;
}

export interface Alert {
  id: string;
  talukId: string;
  severity: AlertSeverity;
  message: string;
  createdAt: string;
  targetRole: AlertTargetRole;
}

export interface User {
  id: string;
  name: string;
  role: Role;
  /** Optional — farmer's taluk, or a bank/government officer's home region. */
  talukId?: string;
  /** Label shown in the nav (e.g. "Demo · Farmer"). */
  subtitle?: string;
}

export interface PredictionRun {
  id: string;
  ranAt: string;
  taluksRecalculated: number;
  redTaluks: number;
  alertsGenerated: number;
}

/** The full "database" held by the simulated store. */
export interface AppState {
  taluks: Taluk[];
  farmers: Farmer[];
  wells: Well[];
  cropRecommendations: CropRecommendation[];
  loanRiskFlags: LoanRiskFlag[];
  alerts: Alert[];
  predictionRuns: PredictionRun[];
  /** Per-taluk auto-restriction toggle (bank dashboard). */
  autoRestriction: Record<string, boolean>;
  session: User | null;
  /** True once a persisted state has been rehydrated from localStorage. */
  hydrated: boolean;
}
