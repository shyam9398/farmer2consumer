import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  PackageCheck,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RefreshCw,
  Image as ImageIcon,
} from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Button } from "@/components/ui/button";
import { useProduceVerificationList } from "@/hooks/useAdmin";

export const ProduceVerificationListPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentStatus = searchParams.get("status") || "ALL";
  const currentCategory = searchParams.get("category") || "ALL";
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, refetch, isFetching } = useProduceVerificationList({
    status: currentStatus === "ALL" ? undefined : currentStatus,
    category: currentCategory === "ALL" ? undefined : currentCategory,
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

  const handleCategoryChange = (cat: string) => {
    setCurrentPage(1);
    if (cat === "ALL") {
      searchParams.delete("category");
    } else {
      searchParams.set("category", cat);
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
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </span>
        );
      case "PENDING_VERIFICATION":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300">
            <Clock className="w-3 h-3 mr-1" /> Pending Inspection
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
              Produce Inspection Queue
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Review photos, pricing benchmarks, and quality grades for direct farmer listings.
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
            {/* Status Filter Tabs */}
            <div className="flex space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {[
                { id: "ALL", label: "All Lots" },
                { id: "PENDING_VERIFICATION", label: "Pending Inspection" },
                { id: "APPROVED", label: "Approved" },
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

            {/* Category Dropdown & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <select
                value={currentCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="VEGETABLE">Vegetables</option>
                <option value="FRUIT">Fruits</option>
                <option value="GRAIN">Grains & Cereals</option>
                <option value="PULSE">Pulses & Legumes</option>
                <option value="SPICE">Spices</option>
                <option value="OILSEED">Oilseeds</option>
                <option value="OTHER">Other Crops</option>
              </select>

              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search lot, variety, farmer..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </form>
            </div>
          </div>
        </div>

        {/* Table of Produce Lots */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="text-center py-16">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading produce inspection queue...</p>
            </div>
          ) : !data?.items || data.items.length === 0 ? (
            <div className="text-center py-16 space-y-2">
              <PackageCheck className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                No produce listings found
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No produce lots match your selected status filter, category, or search term.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3.5">Produce Lot</th>
                    <th className="px-5 py-3.5">Category & Grade</th>
                    <th className="px-5 py-3.5">Quantity & Price</th>
                    <th className="px-5 py-3.5">Farmer & Origin</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-normal">
                  {data.items.map((prod) => (
                    <tr
                      key={prod.produce_id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="relative shrink-0">
                            {prod.primary_image_url ? (
                              <img
                                src={prod.primary_image_url}
                                alt={prod.product_name}
                                className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-sm"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-200 dark:border-slate-700">
                                <ImageIcon className="w-5 h-5 opacity-60" />
                              </div>
                            )}
                            <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-slate-900/80 text-white shadow-sm">
                              {prod.image_count}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {prod.product_name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {prod.variety ? `Variety: ${prod.variety}` : "Standard variety"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {prod.category}
                          </span>
                          <p className="text-[11px] text-slate-500 font-medium">
                            Grade: {prod.quality_grade.replace("_", " ")}
                          </p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs">
                        <p className="font-bold text-slate-900 dark:text-slate-100">
                          {prod.total_quantity} {prod.quantity_unit}
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          ₹{prod.expected_price} / {prod.price_unit.replace("PER_", "")}
                        </p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {prod.farmer_name}
                            </span>
                            {prod.farmer_status === "VERIFIED" ? (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                Verified
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                Pending
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500">{prod.location}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderStatusBadge(prod.status)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-right">
                        <Link to={`/admin/produce/${prod.produce_id}`}>
                          <Button
                            size="sm"
                            className="bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-xs rounded-xl shadow-sm"
                          >
                            Inspect Lot <ArrowRight className="w-3.5 h-3.5 ml-1" />
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
                {Math.min(currentPage * data.page_size, data.total)} of {data.total} listings
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
