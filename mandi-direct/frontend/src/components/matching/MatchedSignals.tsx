import React from "react";
import { CheckCircle2 } from "lucide-react";
import { MatchSignal } from "@/types/matching";
import { cn } from "@/lib/utils";

interface MatchedSignalsProps {
  signals: MatchSignal[];
  className?: string;
}

export const MatchedSignals: React.FC<MatchedSignalsProps> = ({ signals, className }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className={cn("space-y-1.5", className)}>
      <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Matching Signals ({signals.length})</span>
      </p>
      <ul className="space-y-1 text-xs text-slate-300">
        {signals.map((sig, idx) => (
          <li key={idx} className="flex items-start gap-2 bg-emerald-950/20 px-2.5 py-1.5 rounded border border-emerald-900/30">
            <span className="text-emerald-400 font-bold">•</span>
            <div className="flex-1">
              <span className="font-semibold text-emerald-200">{sig.signal_name}: </span>
              <span className="text-slate-300">{sig.description}</span>
              <span className="ml-2 text-[10px] font-mono text-emerald-400 font-bold">
                (+{sig.points_awarded} pts)
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
