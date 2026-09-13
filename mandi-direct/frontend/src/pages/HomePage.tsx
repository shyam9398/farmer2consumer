import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, ShoppingCart, ShieldCheck, Truck, ShoppingBag, ArrowRight, TrendingUp, Shield, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { UserRole } from "@/types/auth";

export const HomePage: React.FC = () => {
  const { profile, loginDemoUser } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleRoleSelect = async (role: UserRole) => {
    if (!profile) {
      await loginDemoUser(role);
    }
    switch (role) {
      case "FARMER":
        navigate("/farmer/dashboard");
        break;
      case "BUYER":
        navigate("/marketplace");
        break;
      case "ADMIN":
        navigate("/admin/dashboard");
        break;
      case "LOGISTICS":
        navigate("/logistics/portal");
        break;
      case "CONSUMER":
        navigate("/marketplace");
        break;
      default:
        navigate("/");
    }
  };

  const roleConfigs = [
    {
      role: "FARMER" as UserRole,
      title: t.home.roles.farmer.title,
      desc: t.home.roles.farmer.desc,
      action: t.home.roles.farmer.action,
      icon: <Sprout className="h-6 w-6 text-emerald-400" />,
      bgGradient: "from-emerald-500/10 to-emerald-500/5",
      borderColor: "border-emerald-500/30 hover:border-emerald-400",
      badgeColor: "bg-emerald-500/20 text-emerald-300",
    },
    {
      role: "BUYER" as UserRole,
      title: t.home.roles.buyer.title,
      desc: t.home.roles.buyer.desc,
      action: t.home.roles.buyer.action,
      icon: <ShoppingCart className="h-6 w-6 text-teal-400" />,
      bgGradient: "from-teal-500/10 to-teal-500/5",
      borderColor: "border-teal-500/30 hover:border-teal-400",
      badgeColor: "bg-teal-500/20 text-teal-300",
    },
    {
      role: "LOGISTICS" as UserRole,
      title: t.home.roles.logistics.title,
      desc: t.home.roles.logistics.desc,
      action: t.home.roles.logistics.action,
      icon: <Truck className="h-6 w-6 text-purple-400" />,
      bgGradient: "from-purple-500/10 to-purple-500/5",
      borderColor: "border-purple-500/30 hover:border-purple-400",
      badgeColor: "bg-purple-500/20 text-purple-300",
    },
    {
      role: "CONSUMER" as UserRole,
      title: t.home.roles.consumer.title,
      desc: t.home.roles.consumer.desc,
      action: t.home.roles.consumer.action,
      icon: <ShoppingBag className="h-6 w-6 text-amber-400" />,
      bgGradient: "from-amber-500/10 to-amber-500/5",
      borderColor: "border-amber-500/30 hover:border-amber-400",
      badgeColor: "bg-amber-500/20 text-amber-300",
    },
    {
      role: "ADMIN" as UserRole,
      title: t.home.roles.admin.title,
      desc: t.home.roles.admin.desc,
      action: t.home.roles.admin.action,
      icon: <ShieldCheck className="h-6 w-6 text-blue-400" />,
      bgGradient: "from-blue-500/10 to-blue-500/5",
      borderColor: "border-blue-500/30 hover:border-blue-400",
      badgeColor: "bg-blue-500/20 text-blue-300",
    },
  ];

  return (
    <div className="flex flex-col gap-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-8 sm:pt-16 sm:pb-12 border-b border-border/40">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_35%_at_50%_20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="container mx-auto px-4 sm:px-8 text-center max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 mb-6">
            <Sprout className="h-3.5 w-3.5" />
            <span>SIH 2026</span>
            <span className="h-1 w-1 rounded-full bg-emerald-400"></span>
            <span>Mandi Direct Platform</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
            {t.home.heroTitle}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            {t.home.heroSubtitle}
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {profile ? (
              <Button
                variant="harvest"
                size="lg"
                onClick={() => handleRoleSelect(profile.role)}
                className="shadow-lg shadow-emerald-600/20 text-sm font-semibold"
              >
                Go to {profile.role} Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link to="/marketplace">
                  <Button variant="harvest" size="lg" className="shadow-lg shadow-emerald-600/20">
                    Explore Marketplace <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 5 Compact Responsive Role Cards */}
      <section className="container mx-auto px-4 sm:px-8 max-w-6xl">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {t.home.selectRole}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Access customized workflows designed specifically for each agricultural participant
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleConfigs.map((cfg) => (
            <Card
              key={cfg.role}
              className={`bg-gradient-to-b ${cfg.bgGradient} border ${cfg.borderColor} transition-all duration-200 hover:shadow-xl hover:-translate-y-1 flex flex-col justify-between`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-border/50">
                    {cfg.icon}
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.badgeColor}`}>
                    {cfg.role}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-white">
                  {cfg.title}
                </CardTitle>
                <CardDescription className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {cfg.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-between hover:bg-white/10 text-xs font-semibold"
                  onClick={() => handleRoleSelect(cfg.role)}
                >
                  <span>{cfg.action}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Platform Value Proposition Highlights */}
      <section className="container mx-auto px-4 sm:px-8 max-w-5xl">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-6 sm:p-8">
          <h3 className="text-xl font-bold text-white mb-6 text-center">
            {t.home.featuresTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-slate-300">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{t.home.features.fairPrice}</h4>
                <p className="text-xs text-slate-400 mt-1">{t.home.features.fairPriceDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 mt-0.5">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{t.home.features.zeroMiddlemen}</h4>
                <p className="text-xs text-slate-400 mt-1">{t.home.features.zeroMiddlemenDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 mt-0.5">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{t.home.features.logisticsSupport}</h4>
                <p className="text-xs text-slate-400 mt-1">{t.home.features.logisticsSupportDesc}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 mt-0.5">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">{t.home.features.instantPayouts}</h4>
                <p className="text-xs text-slate-400 mt-1">{t.home.features.instantPayoutsDesc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
