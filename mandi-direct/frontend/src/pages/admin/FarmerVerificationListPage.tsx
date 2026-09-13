import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { useFarmerVerificationList } from "@/hooks/useAdmin";

export const FarmerVerificationListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useFarmerVerificationList({
    status: currentStatus === "ALL" ? undefined : currentStatus,
    search: searchTerm.trim() || undefined,
    page: currentPage,
    page_size: 15,
  });

  const handleStatusTab = (status: string) => {
    setCurrentPage(1);
    if (status === "ALL") {
      searchParams.delete("status");
    } else {
      searchParams.set("status", status);
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

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Farmer Verification Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Inspect farmer profiles, demographic details, and registered land parcels.
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

        {/* Filters & Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Status Filter Tabs */}
            <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {[
                { id: "ALL", label: "All Farmers" },
                { id: "PENDING", label: "Pending Review" },
                { id: "VERIFIED", label: "Verified" },
                { id: "REJECTED", label: "Rejected" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleStatusTab(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                    currentStatus === tab.id
                      ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, phone, district..."
                className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </form>
          </div>
        </div>

        {/* Table of Farmers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading farmer verification queue...</p>
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <Users className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No farmers found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No farmer profiles match your selected status filter or search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Farmer Details</th>
                    <th className="px-5 py-3.5">Location</th>
                    <th className="px-5 py-3.5">Profile Completion</th>
                    <th className="px-5 py-3.5">Farms</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                  {data.items.map((farmer) => (
                    <tr
                      key={farmer.farmer_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {farmer.profile_photo_url ? (
                            <img
                              src={farmer.profile_photo_url}
                              alt={farmer.full_name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center text-sm border border-emerald-200/60 dark:border-emerald-800/60">
                              {farmer.full_name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {farmer.full_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {farmer.phone || farmer.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        <p className="font-medium text-slate-800 dark:text-slate-200">
                          {farmer.village}, {farmer.mandal}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {farmer.district}, {farmer.state} ({farmer.pincode})
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="w-32">
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-slate-700 dark:text-slate-300">
                              {farmer.profile_completion_percentage}%
                            </span>
                            <span
                              className={
                                farmer.profile_completion_percentage === 100
                                  ? "text-emerald-600"
                                  : "text-amber-600"
                              }
                            >
                              {farmer.profile_completion_percentage === 100 ? "Complete" : "Incomplete"}
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                farmer.profile_completion_percentage === 100
                                  ? "bg-emerald-500"
                                  : "bg-amber-500"
                              }`}
                              style={{ width: `${farmer.profile_completion_percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-700 dark:text-slate-300 font-semibold">
                        {farmer.farm_count} registered
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderStatusBadge(farmer.verification_status)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link to={`/admin/farmers/${farmer.farmer_id}`}>
                          <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs rounded-xl shadow-sm"
                          >
                            Review & Verify <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.total_pages > 1 && (
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Showing {((currentPage - 1) * data.page_size) + 1} to{" "}
                {Math.min(currentPage * data.page_size, data.total)} of {data.total} farmers
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
        </div>
      </main>
    </div>
  );
};
