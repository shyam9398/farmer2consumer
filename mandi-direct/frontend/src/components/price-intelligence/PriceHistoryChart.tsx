import React from "react";
import { PriceHistoryResponse } from "@/types/priceIntelligence";
import { TrendingUp, HelpCircle } from "lucide-react";

interface PriceHistoryChartProps {
  historyData: PriceHistoryResponse;
  height?: number;
  className?: string;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  historyData,
  height = 220,
  className = "",
}) => {
  const points = historyData.history || [];

  if (points.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex flex-col items-center justify-center p-6 text-center border border-dashed rounded-xl border-border bg-muted/20 ${className}`}
      >
        <HelpCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="font-semibold text-sm text-foreground">No Historical Price Chart Data</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Not enough market price observations have been recorded for {historyData.product_name} in the selected time window.
        </p>
      </div>
    );
  }

  // Calculate SVG bounds & scaling
  const padding = 35;
  const width = 600;
  const svgHeight = height;

  const prices = points.map((p) => p.avg_price_per_kg);
  const minP = Math.max(0, Math.min(...prices) * 0.9);
  const maxP = Math.max(...prices) * 1.1 || 10;

  const getX = (idx: number) => {
    if (points.length === 1) return width / 2;
    return padding + (idx / (points.length - 1)) * (width - 2 * padding);
  };

  const getY = (val: number) => {
    return svgHeight - padding - ((val - minP) / (maxP - minP)) * (svgHeight - 2 * padding);
  };

  const polylinePoints = points.map((p, idx) => `${getX(idx)},${getY(p.avg_price_per_kg)}`).join(" ");

  return (
    <div className={`p-4 rounded-2xl border border-border bg-background shadow-2xs ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-border">
        <div>
          <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            Historical Price Trend (INR / KG)
          </h4>
          <p className="text-xs text-muted-foreground">
            {historyData.start_date} to {historyData.end_date} • {historyData.total_observations} observations
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="text-muted-foreground">Min: <strong className="text-foreground">₹{historyData.overall_min_per_kg || 0}</strong></span>
          <span className="text-muted-foreground">Avg: <strong className="text-emerald-600 dark:text-emerald-400">₹{historyData.overall_avg_per_kg || 0}</strong></span>
          <span className="text-muted-foreground">Max: <strong className="text-foreground">₹{historyData.overall_max_per_kg || 0}</strong></span>
        </div>
      </div>

      {/* Responsive SVG Container */}
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${svgHeight}`} className="w-full h-auto min-w-[500px]">
          {/* Horizontal grid lines */}
          {[0, 0.33, 0.66, 1].map((ratio, i) => {
            const yVal = minP + ratio * (maxP - minP);
            const yPos = getY(yVal);
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={yPos}
                  x2={width - padding}
                  y2={yPos}
                  stroke="currentColor"
                  className="text-border/40"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding - 5}
                  y={yPos + 4}
                  textAnchor="end"
                  className="text-[10px] fill-muted-foreground"
                >
                  ₹{Math.round(yVal)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <polygon
            points={`${getX(0)},${svgHeight - padding} ${polylinePoints} ${getX(points.length - 1)},${svgHeight - padding}`}
            className="fill-emerald-500/10"
          />

          {/* Trend line */}
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            points={polylinePoints}
            className="text-emerald-500"
          />

          {/* Data Points */}
          {points.map((p, idx) => {
            const cx = getX(idx);
            const cy = getY(p.avg_price_per_kg);
            return (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={cx}
                  cy={cy}
                  r="4"
                  className="fill-emerald-500 stroke-background stroke-2 group-hover:r-6 transition-all"
                />
                <title>
                  {`${p.observation_date}: ₹${p.avg_price_per_kg}/kg (${p.observation_count} obs)`}
                </title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
