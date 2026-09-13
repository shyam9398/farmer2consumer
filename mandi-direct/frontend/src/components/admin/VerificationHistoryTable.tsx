import React from "react";
import { CheckCircle2, XCircle, RotateCcw, Clock, UserCheck } from "lucide-react";
import { VerificationRecord } from "@/types/admin";

interface VerificationHistoryTableProps {
  records: VerificationRecord[];
  showEntityColumns?: boolean;
}

export const VerificationHistoryTable: React.FC<VerificationHistoryTableProps> = ({
  records,
  showEntityColumns = false,
}) => {
  if (!records || records.length === 0) {
    return (
      <div className="text-center py-8 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
        <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-60" />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          No verification events recorded yet.
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Actions taken by administrators will appear here in chronological order.
        </p>
      </div>
    );
  }

  const renderActionBadge = (action: string) => {
    switch (action.toUpperCase()) {
      case "APPROVE":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Approved
          </span>
        );
      case "REJECT":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Rejected
          </span>
        );
      case "RESUBMIT":
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Resubmitted
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 text-left text-sm">
        <thead className="bg-slate-50 dark:bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <tr>
            <th className="px-4 py-3">Action</th>
            {showEntityColumns && <th className="px-4 py-3">Entity</th>}
            <th className="px-4 py-3">Transition</th>
            <th className="px-4 py-3">Reviewer</th>
            <th className="px-4 py-3">Reason / Notes</th>
            <th className="px-4 py-3 text-right">Timestamp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
          {records.map((rec) => {
            const dateStr = rec.created_at
              ? new Date(rec.created_at).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—";

            return (
              <tr key={rec.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">
                  {renderActionBadge(rec.action)}
                </td>
                {showEntityColumns && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase">
                        {rec.entity_type}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-[120px]">
                        {rec.entity_id}
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 whitespace-nowrap text-xs">
                  <div className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {rec.previous_status || "INITIAL"}
                    </span>
                    <span>→</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {rec.new_status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {rec.admin_name || "System"}
                      </p>
                      {rec.admin_email && (
                        <p className="text-[11px] text-slate-400">{rec.admin_email}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs max-w-sm">
                  {rec.reason ? (
                    <span className="text-slate-700 dark:text-slate-300 line-clamp-2">
                      {rec.reason}
                    </span>
                  ) : (
                    <span className="text-slate-400 italic">No notes recorded</span>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-right text-slate-500 dark:text-slate-400 font-mono">
                  {dateStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
