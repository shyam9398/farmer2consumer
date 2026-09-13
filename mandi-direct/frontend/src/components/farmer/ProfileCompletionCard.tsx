import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ProfileCompletionCardProps {
  percentage: number;
  isComplete: boolean;
  missingFields?: string[];
  className?: string;
  hasProfile?: boolean;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  percentage,
  isComplete,
  missingFields = [],
  className,
  hasProfile = true,
}) => {
  return (
    <Card className={cn("glass-card border border-border/70 overflow-hidden relative", className)}>
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-1",
          isComplete
            ? "bg-gradient-to-r from-emerald-500 to-teal-400"
            : "bg-gradient-to-r from-amber-500 to-emerald-400"
        )}
      />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Trading Readiness
            </span>
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="h-2.5 w-2.5" /> Ready for Phase 4
              </span>
            )}
          </div>
          <span
            className={cn(
              "text-lg font-black font-mono",
              isComplete ? "text-emerald-400" : "text-amber-400"
            )}
          >
            {percentage}%
          </span>
        </div>
        <CardTitle className="text-xl font-bold text-white flex items-center justify-between">
          <span>Profile Completion</span>
        </CardTitle>
        <CardDescription className="text-xs text-slate-400">
          Required to directly list produce and receive bids without intermediaries.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <Progress
          value={percentage}
          indicatorClassName={
            isComplete
              ? "bg-gradient-to-r from-emerald-500 to-teal-400"
              : "bg-gradient-to-r from-amber-500 to-emerald-400"
          }
        />

        {/* Status Message */}
        {isComplete ? (
          <div className="flex items-center gap-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>✓ Profile ready for produce listing. You are eligible for direct buyer transactions.</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-200">
                  Complete your profile before adding produce.
                </p>
                {missingFields.length > 0 && (
                  <p className="text-slate-400 mt-1 text-[11px]">
                    Pending: {missingFields.join(", ")}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {!hasProfile ? (
                <Link to="/farmer/profile" className="w-full">
                  <Button variant="harvest" size="sm" className="w-full gap-1.5 text-xs">
                    <span>Complete Profile Setup</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <Link to="/farmer/farms/new" className="w-full">
                  <Button variant="harvest" size="sm" className="w-full gap-1.5 text-xs">
                    <span>+ Register Your Farm</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
