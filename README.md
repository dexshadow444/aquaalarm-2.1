# AquaAlarm

**An AI-powered groundwater crisis prediction and early-warning platform for
Tamil Nadu, India** — one shared forecast powering three role-based
dashboards: **Farmer**, **Bank**, and **Government**.

Tamil Nadu is losing 3–4 feet of groundwater per year; by 2050 an estimated
80% of the state will be water-stressed. AquaAlarm gives farmers, banks and
policymakers a shared, predictive view of groundwater health so they can act
**30–90 days before** a crisis instead of after a well runs dry.

## What's inside

- **Landing page** (`/`) — hero with a live taluk status board, one-click role
  entry, and the platform story.
- **Login** (`/login`) — mock role-based auth with demo profiles (no SMS/OTP).
- **Farmer dashboard** (`/farmer`) — your well's depth + trend, days-until-crisis,
  taluk status banner, low-water crop recommendations with real savings vs.
  your current crop, and qualifying government subsidies.
- **Bank dashboard** (`/bank`) — per-taluk risk table (approve / monitor /
  restrict) with reasoning, auto-restriction toggles for red taluks, and
  redirection of credit to water-smart farming loans.
- **Government dashboard** (`/government`) — illustrative Tamil Nadu risk map,
  headline rollups, ranked high-risk taluks, 12-month depth history + 90-day
  projection per taluk, and a resource-allocation panel.

## The prediction engine

A simulated model (no real ML training) projects each taluk's groundwater
depth forward over a 90-day horizon:

```
net_daily_drop = extractionRateIndex × 0.0033 − rainfallMm(90d) × 0.02 / 90
depth(t)       = currentDepth + net_daily_drop × t
days_to_crisis = (criticalDepth − currentDepth) / net_daily_drop
```

Status classification: **green** (no crisis in 90 days) → **yellow** (45–90
days) → **red** (<45 days). Red crossings auto-generate in-app alerts and bank
loan-risk flags (`restrict`). The **"Run prediction cycle"** button in the nav
is the manual trigger for the scheduled daily cycle — it recalculates all
taluks, emits new alerts, and shows a confirmation banner.

Engine constants live in `src/lib/engine.ts`; the sanity-check script is
`npx tsx scripts/check-engine.ts`.

## Research & data caveats

**All groundwater, rainfall and prediction data is simulated and
illustrative.** Taluk depth/rainfall/extraction numbers are calibrated to be
credible for Tamil Nadu (hard-rock western/northern taluks are deeper and more
stressed; delta taluks like Thanjavur are shallow) but they are **not real
CGWB/IMD readings**. Water-requirement figures per crop are approximations.
This is a concept demo — not official groundwater information, and the bank
view is decision-support only (no real disbursals, no real SMS alerts).

## Stack

React + Next.js (App Router), TypeScript, Tailwind CSS v4, with a
client-side simulated data store (`src/lib/store.tsx`) that mirrors the Convex
table/query API surface so the demo runs anywhere — including Vercel — with
zero external services. State persists to `localStorage`.

## Run it

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
npm run lint      # eslint
```
