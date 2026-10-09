"use client";

// Stylized, illustrative SVG map of Tamil Nadu. Taluk positions are
// approximate (lon/lat projected linearly into the viewBox) — explicitly
// labelled as illustrative per the spec, since a real GIS map is out of scope.

import type { Taluk } from "@/lib/types";
import { STATUS_META } from "@/lib/utils";

const X0 = 20, X1 = 540;          // lon 76.0 → 80.6
const Y0 = 620, Y1 = 20;          // lat 8.0  → 13.6

function px(lon: number) {
  return X0 + ((lon - 76.0) / 4.6) * (X1 - X0);
}
function py(lat: number) {
  return Y0 - ((lat - 8.0) / 5.6) * (Y0 - Y1);
}

// Rough Tamil Nadu silhouette (lon,lat), east coast down, west coast up.
const OUTLINE: [number, number][] = [
  [80.3, 13.6], [79.9, 13.62], [79.2, 13.58], [78.6, 13.55], [78.0, 13.48],
  [77.5, 13.35], [77.1, 13.15], [76.85, 12.85], [76.7, 12.45], [76.75, 12.0],
  [76.95, 11.6], [77.35, 11.2], [77.5, 10.9], [77.3, 10.55], [76.9, 10.15],
  [76.6, 9.75], [76.4, 9.3], [76.55, 8.85], [76.9, 8.4], [77.4, 8.15],
  [78.0, 8.08], [78.6, 8.1], [79.1, 8.3], [79.6, 8.55], [80.0, 8.9],
  [79.8, 9.3], [79.4, 9.7], [79.05, 10.05], [78.85, 10.45], [79.05, 10.9],
  [79.25, 11.35], [79.4, 11.85], [79.55, 12.35], [79.75, 12.85], [80.0, 13.25],
];

export function TaluqMap({
  taluks,
  selectedId,
  onSelect,
  showLabels = false,
}: {
  taluks: Taluk[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  showLabels?: boolean;
}) {
  const outlinePts = OUTLINE.map(([lon, lat]) => `${px(lon).toFixed(1)},${py(lat).toFixed(1)}`).join(" ");

  return (
    <div className="relative">
      <svg viewBox="0 0 560 650" className="w-full" role="img" aria-label="Illustrative map of Tamil Nadu taluk statuses">
        <polygon
          points={outlinePts}
          fill="#eaf3f6"
          stroke="#b9d3db"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        <text x={X0 + 8} y={Y1 + 22} fontSize={9} fill="#7a97a3" fontStyle="italic">
          ILLUSTRATIVE MAP — positions approximate, not to scale
        </text>

        {taluks.map((t) => {
          const meta = STATUS_META[t.status];
          const cx = px(t.mapPos.lon);
          const cy = py(t.mapPos.lat);
          const r = 4.5 + t.extractionRateIndex / 26;
          const isSel = selectedId === t.id;
          return (
            <g
              key={t.id}
              className={onSelect ? "cursor-pointer" : ""}
              onClick={onSelect ? () => onSelect(t.id) : undefined}
            >
              <title>{`${t.name} (${t.district}) — ${meta.label} · crisis in ${t.predictedCrisisInDays ?? "—"} days · extraction ${t.extractionRateIndex}/100`}</title>
              {isSel && (
                <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="#0d2f40" strokeWidth={1.5} strokeDasharray="3 3" />
              )}
              <circle cx={cx} cy={cy} r={r} fill={meta.dot === "bg-green" ? "#1a7f4b" : meta.dot === "bg-amber" ? "#b45309" : "#c0392b"} stroke="#ffffff" strokeWidth={1.5} />
              {(showLabels || isSel) && (
                <text x={cx} y={cy - r - 6} textAnchor="middle" fontSize={10} fontWeight={600} fill="#0d2f40">
                  {t.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1a7f4b]" /> Safe (&gt;90 days)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#b45309]" /> Watch (45–90 days)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#c0392b]" /> Crisis (&lt;45 days)
        </span>
        <span className="ml-auto">Dot size = extraction intensity</span>
      </div>
    </div>
  );
}
