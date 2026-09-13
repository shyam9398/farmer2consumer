import React, { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { MatchResult } from "@/types/matching";
import { MatchScoreBadge } from "./MatchScoreBadge";
import { MatchLevelBadge } from "./MatchLevelBadge";
import { MatchedSignals } from "./MatchedSignals";
import { UnmatchedSignals } from "./UnmatchedSignals";
import { Button } from "@/components/ui/button";

interface MatchExplanationProps {
  match: MatchResult;
  compact?: boolean;
}

export const MatchExplanation: React.FC<MatchExplanationProps> = ({
  match,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(!compact);

  return (
    <div className="rounded-lg border border-border/70 bg-card/60 p-4 space-y-3">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <MatchScoreBadge score={match.match_score} size="md" />
          <MatchLevelBadge level={match.match_level} />
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 bg-secondary/50 px-2 py-0.5 rounded border border-border/50">
            Confidence: {match.confidence}
          </span>
        </div>

        {compact && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 text-slate-400 hover:text-white"
            onClick={() => setExpanded(!expanded)}
          >
            <span>{expanded ? "Hide Details" : "Why Matched?"}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {/* Narrative Explanation */}
      <div className="flex items-start gap-2 text-xs text-slate-300 bg-secondary/30 p-2.5 rounded-md border border-border/40">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">{match.explanation}</p>
      </div>

      {/* Expanded Signal Breakdown */}
      {expanded && (
        <div className="pt-2 border-t border-border/50 space-y-3">
          <MatchedSignals signals={match.matched_signals} />
          <UnmatchedSignals signals={match.unmatched_signals} />
        </div>
      )}
    </div>
  );
};
