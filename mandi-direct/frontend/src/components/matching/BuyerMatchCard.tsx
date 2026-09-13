import React from "react";
import { UserCheck, MapPin, Package, ShoppingBag, ShieldCheck } from "lucide-react";
import { BuyerMatchItem } from "@/types/matching";
import { MatchExplanation } from "./MatchExplanation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BuyerMatchCardProps {
  item: BuyerMatchItem;
}

export const BuyerMatchCard: React.FC<BuyerMatchCardProps> = ({ item }) => {
  const { buyer, produce, match } = item;

  return (
    <Card className="overflow-hidden border-border/70 hover:border-emerald-500/50 transition-all shadow-md bg-card/80 backdrop-blur-sm">
      <CardContent className="p-5 space-y-4">
        {/* Top Bar: Buyer Safe Identity & Target Listing */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-border/50 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UserCheck className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-base text-white tracking-tight">
                {buyer.display_name}
              </h3>
              <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
                {buyer.buyer_type}
              </Badge>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-0.5">
              {(buyer.district || buyer.state) && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    {[buyer.district, buyer.state].filter(Boolean).join(", ")}
                  </span>
                </span>
              )}

              {buyer.verified_purchases_count > 0 && (
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{buyer.verified_purchases_count} Verified Purchases</span>
                </span>
              )}
            </div>
          </div>

          {/* Target Matched Produce Lot */}
          <div className="text-right sm:text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Matching Lot</span>
            <span className="font-semibold text-sm text-emerald-300 flex items-center gap-1 justify-end">
              <Package className="w-3.5 h-3.5 text-emerald-400" />
              {produce.product_name}
              {produce.variety ? ` (${produce.variety})` : ""}
            </span>
            <span className="text-[11px] text-slate-400">
              {produce.available_quantity} {produce.quantity_unit} · ₹{produce.expected_price}/{produce.price_unit.replace("PER_", "").toLowerCase()}
            </span>
          </div>
        </div>

        {/* Procurement Interests Tags */}
        {(buyer.interested_products.length > 0 || buyer.preferred_categories.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1 flex items-center gap-1">
              <ShoppingBag className="w-3 h-3 text-slate-500" />
              Interested in:
            </span>
            {buyer.interested_products.map((p, i) => (
              <Badge key={i} variant="secondary" className="text-[11px] bg-secondary/60 text-slate-200">
                {p}
              </Badge>
            ))}
            {buyer.preferred_categories.map((c, i) => (
              <Badge key={i} variant="outline" className="text-[10px] text-slate-400 border-border/70">
                {c}
              </Badge>
            ))}
          </div>
        )}

        {/* Explainable Match Scoring Card */}
        <MatchExplanation match={match} compact={true} />
      </CardContent>
    </Card>
  );
};
