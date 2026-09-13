import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Lock, User, AlertCircle, ShoppingCart, Truck, ShieldCheck, ShoppingBag } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types/auth";

export const LoginPage: React.FC = () => {
  const { login, loginDemoUser, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const redirectByRole = (role: UserRole) => {
    switch (role) {
      case "FARMER":
        navigate("/farmer/dashboard");
        break;
      case "BUYER":
        navigate("/buyer/marketplace");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const profile = await login({ username, password });
      if (profile) {
        redirectByRole(profile.role);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err?.message || t.auth.invalidCredentials);
    }
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setError(null);
    try {
      const profile = await loginDemoUser(role);
      if (profile) {
        redirectByRole(profile.role);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to sign in with demo role.");
    }
  };

  const demoRoles: { role: UserRole; title: string; icon: React.ReactNode; color: string }[] = [
    {
      role: "FARMER",
      title: t.auth.roleFarmer,
      icon: <Sprout className="h-4 w-4 text-emerald-400" />,
      color: "border-emerald-500/40 hover:bg-emerald-500/15 text-emerald-300",
    },
    {
      role: "BUYER",
      title: t.auth.roleBuyer,
      icon: <ShoppingCart className="h-4 w-4 text-teal-400" />,
      color: "border-teal-500/40 hover:bg-teal-500/15 text-teal-300",
    },
    {
      role: "LOGISTICS",
      title: t.auth.roleLogistic,
      icon: <Truck className="h-4 w-4 text-purple-400" />,
      color: "border-purple-500/40 hover:bg-purple-500/15 text-purple-300",
    },
    {
      role: "CONSUMER",
      title: t.auth.roleConsumer,
      icon: <ShoppingBag className="h-4 w-4 text-amber-400" />,
      color: "border-amber-500/40 hover:bg-amber-500/15 text-amber-300",
    },
    {
      role: "ADMIN",
      title: t.auth.roleAdmin,
      icon: <ShieldCheck className="h-4 w-4 text-blue-400" />,
      color: "border-blue-500/40 hover:bg-blue-500/15 text-blue-300",
    },
  ];

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-2">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t.auth.welcomeBack}</h1>
          <p className="text-sm text-slate-400">
            {t.auth.signInSubtitle}
          </p>
        </div>

        <Card className="glass-panel border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t.auth.accountSignIn}</CardTitle>
            <CardDescription>{t.auth.enterCredentials}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2" data-tour-id="login-username">
                <Label htmlFor="username">{t.auth.usernameLabel}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder={t.auth.usernamePlaceholder}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2" data-tour-id="login-password">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">{t.auth.passwordLabel}</Label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    required
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="harvest"
                className="w-full text-xs sm:text-sm font-semibold"
                disabled={isLoading}
                data-tour-id="login-submit"
              >
                {isLoading ? t.auth.authenticating : t.auth.signInBtn}
              </Button>

              {/* One-Click Quick Demo Login Section (5 Specified Roles) */}
              <div className="pt-3 border-t border-border/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {t.auth.quickDemoLogins}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    5 Demo Roles
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t.auth.quickDemoHint}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {demoRoles.map((item) => (
                    <button
                      key={item.role}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleQuickDemoLogin(item.role)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all duration-150 ${item.color} ${
                        item.role === "CONSUMER" ? "col-span-2 sm:col-span-1" : ""
                      }`}
                    >
                      {item.icon}
                      <span className="truncate">{item.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </form>

          <CardFooter className="justify-center border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground">
              {t.auth.noAccount}{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                {t.auth.registerWithRole}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
