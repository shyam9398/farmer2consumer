import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";

export const FpoPortal: React.FC = () => {
  const { profile } = useAuth();
  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-5xl">
      <div className="border-b border-border/60 pb-6">
        <Badge variant="secondary" className="border-blue-500/30 text-blue-400 bg-blue-500/10 mb-2">
          FPO AGGREGATION PORTAL
        </Badge>
        <h1 className="text-3xl font-bold text-white">Farmer Producer Organization Console</h1>
        <p className="text-sm text-slate-400">Welcome, {profile?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Registered Farmer Members</CardTitle>
            <CardDescription>Smallholders pooled in cooperative</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">150 Farmers</div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg">Bulk Aggregated Harvest</CardTitle>
            <CardDescription>Ready for institutional contract dispatch</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">45.5 Metric Tons</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
