import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  PackageCheck,
  History,
  ShieldCheck,
  Truck,
  Building,
} from "lucide-react";
import { useAdminDashboardStats } from "@/hooks/useAdmin";

export const AdminNav: React.FC = () => {
  const location = useLocation();
  const { data: stats } = useAdminDashboardStats();

  const navItems = [
    {
      to: "/admin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: location.pathname === "/admin",
    },
    {
      to: "/admin/logistics",
      label: "Logistics Command",
      icon: Truck,
      active: location.pathname.startsWith("/admin/logistics"),
    },
    {
      to: "/admin/collection-points",
      label: "Collection Hubs",
      icon: Building,
      active: location.pathname.startsWith("/admin/collection-points"),
    },
    {
      to: "/admin/farmers",
      label: "Farmer Verifications",
      icon: Users,
      badge: stats?.pending_farmers,
      badgeColor: "bg-amber-500 text-white",
      active: location.pathname.startsWith("/admin/farmers"),
    },
    {
      to: "/admin/produce",
      label: "Produce Approvals",
      icon: PackageCheck,
      badge: stats?.pending_produce,
      badgeColor: "bg-amber-500 text-white",
      active: location.pathname.startsWith("/admin/produce"),
    },
    {
      to: "/admin/history",
      label: "Audit Trail",
      icon: History,
      active: location.pathname.startsWith("/admin/history"),
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-16 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3">
          <div className="flex items-center space-x-2 mb-3 sm:mb-0">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Admin Governance Console
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fulfillment Logistics & Quality Oversight
              </p>
            </div>
          </div>

          <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-1 sm:pb-0" aria-label="Admin Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    item.active
                      ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {typeof item.badge === "number" && item.badge > 0 && (
                    <span
                      className={`ml-1.5 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        item.active
                          ? "bg-white/20 text-white"
                          : item.badgeColor || "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
};
