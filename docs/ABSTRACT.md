# AquaAlarm — Project Abstract

## Title
**AquaAlarm: An AI-Powered Groundwater Crisis Prediction and Early-Warning Platform for Tamil Nadu**

## Abstract

Tamil Nadu is one of India's most water-stressed states. Groundwater levels
are falling by roughly 3–4 feet per year, and estimates suggest that by 2050
as much as 80% of the state could face severe water stress. The challenge is
not only that aquifers are depleting, but that farmers, lenders, and
policymakers currently discover groundwater crises only *after* wells run dry
or crop loans default — when remediation is expensive and often too late.

**AquaAlarm** is a web-based early-warning platform that gives all three
stakeholders a single, shared, predictive view of groundwater health so that
action can be taken **30–90 days before** a crisis develops. The platform
simulates a daily prediction engine: for each of ten representative Tamil Nadu
taluks it projects groundwater depth over a 90-day horizon from an extraction
index and forecast rainfall, classifies each taluk into green / yellow / red
status, and automatically emits role-specific alerts and loan-risk flags when a
taluk crosses into crisis territory.

The platform presents the same underlying forecast through three tailored
role-based dashboards, each protected by a login gate that redirects
unauthenticated visitors to the sign-in page:

- **Farmer dashboard** — own-well depth and trend, days-until-local-crisis,
  low-water crop recommendations quantified against the farmer's current crop,
  and the government subsidies they qualify for.
- **Bank dashboard** — a per-taluk credit-risk table (approve / monitor /
  restrict) with reasoning, automatic restriction of new crop loans in red
  taluks, and redirection of credit toward water-smart farming loans.
- **Government dashboard** — a state risk map, ranked high-risk taluks,
  12-month depth histories with 90-day projections, and a tanker / borewell /
  subsidy resource-allocation panel.

The application is built as a fully client-side React/Next.js application with
a simulated data store that mirrors a real database/query API surface, so it
runs anywhere — including static hosting on Vercel — with zero external
services. All groundwater, rainfall, and prediction data are simulated and
calibrated to be credible for Tamil Nadu's hydrogeology; the system is a
concept demonstration of the product and interface, not official CGWB/IMD
information, and no real financial transactions or SMS alerts occur.

**Keywords:** groundwater, early warning, AI prediction, Tamil Nadu, drought
resilience, farmer advisory, credit risk, water governance
