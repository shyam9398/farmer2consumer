import React from "react";
import { Link } from "react-router-dom";
import { ShieldX, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

export const UnauthorizedPage: React.FC = () => {
  const { profile } = useAuth();

  const getAuthorizedPath = () => {
    if (!profile) return "/login";
    switch (profile.role) {
      case "FARMER":
        return "/farmer/dashboard";
      case "BUYER":
        return "/buyer/marketplace";
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
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/15 text-destructive border border-destructive/30">
          <ShieldX className="h-10 w-10" />
        </div>

        <div className="space-y-2">
          <div className="inline-block">
            <Badge variant="destructive" className="font-mono text-xs">
              HTTP 403 — FORBIDDEN
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-white">Access Denied</h1>
          <p className="text-sm text-slate-400">
            Your authenticated account has the role{" "}
            <span className="font-semibold text-white uppercase">{profile?.role || "GUEST"}</span>.
            You do not have permission to view this restricted module.
          </p>
        </div>

        <div className="rounded-lg bg-secondary/30 p-4 border border-border/60 text-xs text-slate-400 text-left space-y-1">
          <p className="font-semibold text-slate-200">Role-Based Access Control Rule:</p>
          <p>
            Mandi Direct enforces backend database role verification. Client-side privileges cannot override server authorization policies.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to={getAuthorizedPath()}>
            <Button variant="harvest" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Return to My Authorized Space</span>
            </Button>
          </Link>
          <Link to="/">
            <Button variant="outline" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
