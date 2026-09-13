import React from "react";
import { Link } from "react-router-dom";
import {
  PackageCheck,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  useAdminDashboardStats,
  useFarmerVerificationList,
  useProduceVerificationList,
} from "@/hooks/useAdmin";

export const AdminDashboard: React.FC = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAdminDashboardStats();
  const { data: pendingFarmers } = useFarmerVerificationList({
    status: "PENDING",
    page_size: 5,
  });
  const { data: pendingProduce } = useProduceVerificationList({
    status: "PENDING_VERIFICATION",
    page_size: 5,
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 p-6 md:p-8 rounded-2xl text-white shadow-lg border border-emerald-800/40">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Government & Quality Oversight
              </span>
              <span className="text-xs text-slate-300">SIH 2026 Problem Statement 26033</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Mandi Direct Administration
            </h1>
            <p className="text-sm text-slate-300">
              Welcome back, <span className="font-semibold text-white">{profile?.full_name}</span>.
              Manage farmer onboarding, verify harvest lot authenticity, and maintain marketplace transparency.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link to="/admin/farmers?status=PENDING">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm flex items-center space-x-2">
                <span>Farmer Queue</span>
                <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {stats?.pending_farmers ?? 0}
                </span>
              </Button>
            </Link>
            <Link to="/admin/produce?status=PENDING_VERIFICATION">
              <Button className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm flex items-center space-x-2">
                <span>Produce Queue</span>
                <span className="px-1.5 py-0.5 text-xs bg-white/20 rounded-full">
                  {stats?.pending_produce ?? 0}
                </span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Aggregate KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Pending Farmers */}
          <Card className="rounded-2xl border-amber-200 dark:border-amber-900/50 shadow-sm bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-900 dark:to-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pending Farmers
              </CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400">
                <Clock className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {statsLoading ? "—" : stats?.pending_farmers ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Awaiting document review</span>
                <Link
                  to="/admin/farmers?status=PENDING"
                  className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
                >
                  Review <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Verified Farmers */}
          <Card className="rounded-2xl border-emerald-200 dark:border-emerald-900/50 shadow-sm bg-gradient-to-br from-emerald-50/60 to-white dark:from-slate-900 dark:to-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Verified Farmers
              </CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {statsLoading ? "—" : stats?.verified_farmers ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Out of <span className="font-semibold">{stats?.total_farmers ?? 0}</span> total onboarded
              </p>
            </CardContent>
          </Card>

          {/* Pending Produce Lots */}
          <Card className="rounded-2xl border-amber-200 dark:border-amber-900/50 shadow-sm bg-gradient-to-br from-amber-50/60 to-white dark:from-slate-900 dark:to-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Pending Lots
              </CardTitle>
              <div className="p-2 bg-amber-100 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400">
                <PackageCheck className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {statsLoading ? "—" : stats?.pending_produce ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                <span>Requires quality inspection</span>
                <Link
                  to="/admin/produce?status=PENDING_VERIFICATION"
                  className="text-amber-600 hover:text-amber-700 font-medium inline-flex items-center"
                >
                  Inspect <ArrowRight className="w-3 h-3 ml-0.5" />
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Approved Produce Lots */}
          <Card className="rounded-2xl border-emerald-200 dark:border-emerald-900/50 shadow-sm bg-gradient-to-br from-emerald-50/60 to-white dark:from-slate-900 dark:to-slate-900">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Market Approved Lots
              </CardTitle>
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {statsLoading ? "—" : stats?.approved_produce ?? 0}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Out of <span className="font-semibold">{stats?.total_produce ?? 0}</span> submitted listings
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Priority Action Queues */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Farmers Snippet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pending Farmer Profiles
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  New farmers registered with complete land parcel records
                </p>
              </div>
              <Link
                to="/admin/farmers?status=PENDING"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                View all ({stats?.pending_farmers ?? 0}) <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            {pendingFarmers?.items && pendingFarmers.items.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingFarmers.items.map((farmer) => (
                  <div
                    key={farmer.farmer_id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="space-y-0.5">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {farmer.full_name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {farmer.village}, {farmer.district}, {farmer.state} • {farmer.farm_count} farm(s)
                      </p>
                    </div>
                    <Link to={`/admin/farmers/${farmer.farmer_id}`}>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs">
                        Review Profile
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Farmer Queue Clean
                </p>
                <p className="text-[11px] text-slate-400">No farmers currently waiting for verification.</p>
              </div>
            )}
          </div>

          {/* Pending Produce Snippet */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Pending Produce Lots
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Submitted harvest lots ready for quality photo and price inspection
                </p>
              </div>
              <Link
                to="/admin/produce?status=PENDING_VERIFICATION"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center"
              >
                View all ({stats?.pending_produce ?? 0}) <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            </div>

            {pendingProduce?.items && pendingProduce.items.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingProduce.items.map((prod) => (
                  <div
                    key={prod.produce_id}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      {prod.primary_image_url ? (
                        <img
                          src={prod.primary_image_url}
                          alt={prod.product_name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                          <PackageCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {prod.product_name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Farmer: {prod.farmer_name} • {prod.total_quantity} {prod.quantity_unit}
                        </p>
                      </div>
                    </div>
                    <Link to={`/admin/produce/${prod.produce_id}`}>
                      <Button size="sm" variant="outline" className="rounded-xl text-xs">
                        Inspect Lot
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Produce Queue Clean
                </p>
                <p className="text-[11px] text-slate-400">No produce lots pending verification.</p>
              </div>
            )}
          </div>
        </div>

        {/* System Audit & Transparency Assurance Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950/80 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Full Immutable Audit Trail
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every approval, rejection, and farmer resubmission is tracked with administrator identity and reason codes.
              </p>
            </div>
          </div>
          <Link to="/admin/history">
            <Button variant="outline" className="rounded-xl shrink-0">
              View Audit Log
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};
