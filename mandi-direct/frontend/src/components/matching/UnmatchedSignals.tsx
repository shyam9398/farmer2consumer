import React from "react";
import { AlertCircle } from "lucide-react";
import { MatchSignal } from "@/types/matching";
import { cn } from "@/lib/utils";

interface UnmatchedSignalsProps {
  signals: MatchSignal[];
  className?: string;
}

export const UnmatchedSignals: React.FC<UnmatchedSignalsProps> = ({ signals, className }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Gaps / Differences ({signals.length})</span>
      </p>
      <ul className="space-y-1 text-xs text-slate-400">
        {signals.map((sig, idx) => (
          <li key={idx} className="flex items-start gap-2 bg-slate-900/40 px-2.5 py-1.5 rounded border border-slate-800">
            <span className="text-slate-500 font-bold">•</span>
            <div className="flex-1">
              <span className="font-semibold text-slate-300">{sig.signal_name}: </span>
              <span>{sig.description}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
