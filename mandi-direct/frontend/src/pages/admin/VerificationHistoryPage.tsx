import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { History, Search, RefreshCw } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { VerificationHistoryTable } from "@/components/admin/VerificationHistoryTable";
import { Button } from "@/components/ui/button";
import { useVerificationHistory } from "@/hooks/useAdmin";

export const VerificationHistoryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentEntity = searchParams.get("entity_type") || "ALL";
  const currentAction = searchParams.get("action") || "ALL";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useVerificationHistory({
    entity_type: currentEntity === "ALL" ? undefined : currentEntity,
    action: currentAction === "ALL" ? undefined : currentAction,
    search: searchTerm.trim() || undefined,
    page: currentPage,
    page_size: 20,
  });

  const handleEntityTab = (entity: string) => {
    setCurrentPage(1);
    if (entity === "ALL") {
      searchParams.delete("entity_type");
    } else {
      searchParams.set("entity_type", entity);
    }
    setSearchParams(searchParams);
  };

  const handleActionChange = (act: string) => {
    setCurrentPage(1);
    if (act === "ALL") {
      searchParams.delete("action");
    } else {
      searchParams.set("action", act);
    }
    setSearchParams(searchParams);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    if (searchTerm.trim()) {
      searchParams.set("search", searchTerm.trim());
    } else {
      searchParams.delete("search");
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <History className="w-6 h-6 mr-2.5 text-slate-700 dark:text-slate-300" />
              Platform Verification Audit Log
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Immutable historical record of every approval, rejection, and resubmission action.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl self-start sm:self-auto flex items-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Entity Filter Tabs */}
            <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {[
                { id: "ALL", label: "All Entities" },
                { id: "FARMER", label: "Farmers Only" },
                { id: "PRODUCE", label: "Produce Lots Only" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleEntityTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    currentEntity === tab.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Dropdown & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={currentAction}
                onChange={(e) => handleActionChange(e.target.value)}
                className="w-full sm:w-40 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Actions</option>
                <option value="APPROVE">Approved</option>
                <option value="REJECT">Rejected</option>
                <option value="RESUBMIT">Resubmitted</option>
              </select>

              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search reason, entity ID..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Global Audit Records Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading audit history logs...</p>
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <History className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No audit events found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No verification decisions match your selected filters.
              </p>
            </div>
          ) : (
            <>
              <VerificationHistoryTable
                records={data.items}
                showEntityColumns={true}
              />

              {/* Pagination Controls */}
              {data.total_pages > 1 && (
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Showing {((currentPage - 1) * data.page_size) + 1} to{" "}
                    {Math.min(currentPage * data.page_size, data.total)} of {data.total} audit events
                  </span>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="rounded-lg text-xs"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPage >= data.total_pages}
                      onClick={() => setCurrentPage((p) => Math.min(data.total_pages, p + 1))}
                      className="rounded-lg text-xs"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
