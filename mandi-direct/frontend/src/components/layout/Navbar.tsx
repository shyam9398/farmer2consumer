import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Shield, LogOut, User, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { LanguageSelector } from "@/components/common/LanguageSelector";

export const Navbar: React.FC = () => {
  const { profile, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const cartCount = cart?.item_count || 0;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!profile) return "/";
    switch (profile.role) {
      case "FARMER":
        return "/farmer/dashboard";
      case "BUYER":
        return "/buyer/dashboard";
      case "ADMIN":
        return "/admin/dashboard";
      case "LOGISTICS":
        return "/logistics/portal";
      case "CONSUMER":
        return "/marketplace";
      default:
        return "/";
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
        {/* Logo and Branding */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading text-lg font-bold tracking-tight text-white">{t.nav.brand}</span>
              <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                F2C
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">{t.nav.tagline}</p>
          </div>
        </Link>

        {/* Center/Right Nav Links & Controls */}
        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <LanguageSelector className="mr-1" />

          {profile ? (
            <div className="flex items-center gap-2.5">
              {profile.role === "FARMER" ? (
                <div className="hidden md:flex items-center gap-1.5">
                  <Link to="/farmer/dashboard">
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      {t.nav.dashboard}
                    </Button>
                  </Link>
                  <Link to="/farmer/produce/new">
                    <Button
                      variant="harvest"
                      size="sm"
                      className="text-xs h-8 font-semibold shadow-sm"
                      data-tour-id="nav-upload-crop-link"
                    >
                      {t.nav.uploadCrop}
                    </Button>
                  </Link>
                  <Link to="/farmer/market-prices">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-emerald-400 hover:text-emerald-300">
                      {t.nav.marketPrices}
                    </Button>
                  </Link>
                  <Link to="/farmer/orders">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-amber-300 hover:text-amber-200">
                      {t.nav.orders}
                    </Button>
                  </Link>
                  <Link to="/farmer/earnings">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-teal-300 hover:text-teal-200">
                      {t.nav.earnings}
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-300 hover:text-slate-100">
                      {t.nav.marketplace}
                    </Button>
                  </Link>
                </div>
              ) : profile.role === "ADMIN" ? (
                <div className="hidden md:flex items-center gap-1.5">
                  <Link to="/admin">
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      Console
                    </Button>
                  </Link>
                  <Link to="/admin/farmers">
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      Farmers
                    </Button>
                  </Link>
                  <Link to="/admin/produce">
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      Produce
                    </Button>
                  </Link>
                  <Link to="/admin/demand-intelligence">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-emerald-400 font-semibold">
                      Demand
                    </Button>
                  </Link>
                  <Link to="/admin/history">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-300">
                      Audit Trail
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-teal-300 hover:text-teal-200">
                      Marketplace
                    </Button>
                  </Link>
                </div>
              ) : profile.role === "BUYER" ? (
                <div className="hidden md:flex items-center gap-1.5">
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-emerald-400 hover:text-white">
                      Marketplace
                    </Button>
                  </Link>
                  <Link to="/buyer/dashboard">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-white hover:text-emerald-300">
                      Dashboard
                    </Button>
                  </Link>
                  <Link to="/buyer/orders">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-300 hover:text-white">
                      Orders
                    </Button>
                  </Link>
                  <Link to="/buyer/cart">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs h-8 gap-1.5 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-semibold"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Cart</span>
                      {cartCount > 0 && (
                        <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-500 text-slate-950 font-bold text-[10px]">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              ) : profile.role === "LOGISTICS" ? (
                <div className="hidden md:flex items-center gap-1.5">
                  <Link to="/logistics/portal">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-purple-300 hover:text-white">
                      Fleet Operations
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-slate-300 hover:text-white">
                      Marketplace
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-1.5">
                  <Link to="/marketplace">
                    <Button variant="ghost" size="sm" className="text-xs h-8 text-teal-300 hover:text-teal-200">
                      Marketplace
                    </Button>
                  </Link>
                  <Link to={getDashboardPath()}>
                    <Button variant="outline" size="sm" className="inline-flex items-center gap-1.5 text-xs h-8">
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Workspace</span>
                    </Button>
                  </Link>
                </div>
              )}

              {/* Notification Bell Center */}
              <NotificationBell />

              <div className="flex items-center gap-2">
                <Badge variant="success" className="font-mono text-xs uppercase">
                  {profile.role}
                </Badge>
                <span className="text-xs text-slate-300 font-medium hidden lg:inline-block">
                  {profile.full_name}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">{t.nav.logout}</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Link to="/marketplace">
                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300 font-semibold text-xs">
                  {t.nav.marketplace}
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t.nav.login}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="harvest" size="sm" className="gap-1.5">
                  <Shield className="h-4 w-4" />
                  <span>Join Exchange</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
