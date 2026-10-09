"use client";

// Lightweight dependency-free SVG line chart (spec: "use a lightweight
// charting approach"). Renders depth-over-time with grid, axes, optional
// critical-depth threshold line and area fill.

import type { DepthPoint } from "@/lib/types";

const W = 560;
const H = 220;
const PAD_L = 46;
const PAD_R = 14;
const PAD_T = 18;
const PAD_B = 28;

export function TrendChart({
  data,
  threshold,
  thresholdLabel = "Critical depth",
  color = "#0e7c86",
  fill = true,
  yFormat = (v: number) => `${v} ft`,
  height = 220,
  xTicks = 3,
}: {
  data: DepthPoint[];
  threshold?: number;
  thresholdLabel?: string;
  color?: string;
  fill?: boolean;
  yFormat?: (v: number) => string;
  height?: number;
  xTicks?: number;
}) {
  if (!data || data.length < 2) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-400">
        No data
      </div>
    );
  }

  const values = data.map((d) => d.depth);
  let min = Math.min(...values);
  let max = Math.max(...values);
  if (threshold != null) {
    min = Math.min(min, threshold);
    max = Math.max(max, threshold);
  }
  const pad = Math.max(2, (max - min) * 0.12);
  min = Math.floor(min - pad);
  max = Math.ceil(max + pad);

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const x = (i: number) =>
    PAD_L + (i / (data.length - 1)) * plotW;
  const y = (v: number) =>
    PAD_T + ((max - v) / (max - min)) * plotH;

  const line = data.map((d, i) => `${x(i).toFixed(1)},${y(d.depth).toFixed(1)}`).join(" ");
  const area = `${PAD_L},${PAD_T + plotH} ${line} ${x(data.length - 1).toFixed(1)},${(PAD_T + plotH).toFixed(1)}`;

  const gridYs = Array.from({ length: 5 }, (_, i) => {
    const frac = i / 4;
    return min + frac * (max - min);
  });

  const xtickIdx: number[] = [];
  for (let i = 0; i < xTicks; i++) {
    xtickIdx.push(Math.round((i * (data.length - 1)) / (xTicks - 1)));
  }

  const last = data[data.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: "100%", height: "auto", maxHeight: height + 40 }}
      role="img"
      aria-label="Groundwater depth trend chart"
    >
      {/* grid + y labels */}
      {gridYs.map((gv, i) => (
        <g key={i}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(gv)}
            y2={y(gv)}
            stroke="#d9e6ea"
            strokeWidth={1}
            strokeDasharray={i === 0 || i === 4 ? "0" : "3 4"}
          />
          <text
            x={PAD_L - 6}
            y={y(gv) + 3.5}
            textAnchor="end"
            fontSize={10}
            fill="#7a97a3"
          >
            {yFormat(gv)}
          </text>
        </g>
      ))}

      {/* x labels */}
      {xtickIdx.map((idx) => (
        <text
          key={idx}
          x={x(idx)}
          y={H - 8}
          textAnchor={idx === 0 ? "start" : idx === data.length - 1 ? "end" : "middle"}
          fontSize={10}
          fill="#7a97a3"
        >
          {data[idx].label}
        </text>
      ))}

      {/* threshold line */}
      {threshold != null && (
        <g>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={y(threshold)}
            y2={y(threshold)}
            stroke="#c0392b"
            strokeWidth={1.5}
            strokeDasharray="6 4"
          />
          <text
            x={W - PAD_R}
            y={y(threshold) - 5}
            textAnchor="end"
            fontSize={10}
            fontWeight={600}
            fill="#c0392b"
          >
            {thresholdLabel} {yFormat(threshold)}
          </text>
        </g>
      )}

      {fill && (
        <polygon
          points={area}
          fill={color}
          opacity={0.12}
        />
      )}
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* end point */}
      <circle cx={x(data.length - 1)} cy={y(last.depth)} r={4} fill={color} stroke="#fff" strokeWidth={1.5} />
    </svg>
  );
}

export function Sparkline({
  data,
  color = "#0e7c86",
  height = 44,
}: {
  data: DepthPoint[];
  color?: string;
  height?: number;
}) {
  if (!data || data.length < 2) return null;
  const values = data.map((d) => d.depth);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const w = 200;
  const pts = data
    .map((d, i) => {
      const px = (i / (data.length - 1)) * w;
      const py = 4 + (1 - (d.depth - min) / span) * (height - 8);
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
