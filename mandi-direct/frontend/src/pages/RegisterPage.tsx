import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, Lock, User, Phone, ShoppingCart, Truck, ShoppingBag, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { UserRole } from "@/types/auth";

export const RegisterPage: React.FC = () => {
  const { register, isLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("FARMER");
  const [error, setError] = useState<string | null>(null);

  // 4 Registrable roles: Farmer, Buyer, Logistic, Small Consumers (FPO removed as requested)
  const rolesConfig: { role: UserRole; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      role: "FARMER",
      title: t.auth.roleFarmer,
      desc: t.auth.roleFarmerDesc,
      icon: <Sprout className="h-5 w-5 text-emerald-400" />,
    },
    {
      role: "BUYER",
      title: t.auth.roleBuyer,
      desc: t.auth.roleBuyerDesc,
      icon: <ShoppingCart className="h-5 w-5 text-teal-400" />,
    },
    {
      role: "LOGISTICS",
      title: t.auth.roleLogistic,
      desc: t.auth.roleLogisticDesc,
      icon: <Truck className="h-5 w-5 text-purple-400" />,
    },
    {
      role: "CONSUMER",
      title: t.auth.roleConsumer,
      desc: t.auth.roleConsumerDesc,
      icon: <ShoppingBag className="h-5 w-5 text-amber-400" />,
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const profile = await register({
        fullName,
        phone,
        username,
        password,
        role,
      });

      if (profile) {
        if (profile.role === "FARMER") navigate("/farmer/dashboard");
        else if (profile.role === "BUYER") navigate("/buyer/marketplace");
        else if (profile.role === "LOGISTICS") navigate("/logistics/portal");
        else if (profile.role === "CONSUMER") navigate("/marketplace");
        else navigate("/");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to create account.");
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-lg shadow-emerald-500/20 mb-2">
            <Sprout className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">{t.auth.createAccount}</h1>
          <p className="text-sm text-slate-400">
            {t.auth.createAccountSubtitle}
          </p>
        </div>

        <Card className="glass-panel border-border/80">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg">{t.auth.registrationDetails}</CardTitle>
            <CardDescription>{t.auth.registrationSubtext}</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Selection Grid (4 Public Roles) */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-200">
                  {t.auth.selectYourRole}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {rolesConfig.map((item) => (
                    <div
                      key={item.role}
                      onClick={() => setRole(item.role)}
                      className={`cursor-pointer rounded-xl p-3.5 border transition-all ${
                        role === item.role
                          ? "border-emerald-500 bg-emerald-500/15 ring-1 ring-emerald-500 shadow-md shadow-emerald-950"
                          : "border-border/60 bg-secondary/30 hover:border-slate-600 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon}
                        <span className="text-sm font-semibold text-white">{item.title}</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-tight">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t.auth.fullNameLabel}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      placeholder={t.auth.fullNamePlaceholder}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t.auth.phoneLabel}</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder={t.auth.phonePlaceholder}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-9 text-xs sm:text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">{t.auth.usernameLabel}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder={t.auth.chooseUsername}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t.auth.passwordLabel}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder={t.auth.passwordMinLength}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 text-xs sm:text-sm"
                    minLength={6}
                    required
                  />
                </div>
              </div>

              <Button type="submit" variant="harvest" className="w-full text-xs sm:text-sm font-semibold" disabled={isLoading}>
                {isLoading ? t.auth.creatingAccount : `${t.auth.registerBtn} ${rolesConfig.find(r => r.role === role)?.title || role}`}
              </Button>
            </CardContent>
          </form>

          <CardFooter className="justify-center border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground">
              {t.auth.alreadyRegistered}{" "}
              <Link to="/login" className="text-primary hover:underline font-semibold">
                {t.auth.signInHere}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
