import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, ShieldCheck, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/axios";

interface ReviewItem {
  id: string;
  order_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  buyer_masked_name: string;
}

interface RatingSummaryResponse {
  farmer_profile_id: string;
  average_rating: number;
  total_reviews: number;
  rating_distribution: Record<string, number>;
  reviews: ReviewItem[];
}

interface FarmerReviewsCardProps {
  farmerProfileId: string;
  farmerName?: string;
}

export const FarmerReviewsCard: React.FC<FarmerReviewsCardProps> = ({
  farmerProfileId,
  farmerName,
}) => {
  const { data, isLoading, error } = useQuery<RatingSummaryResponse>({
    queryKey: ["farmer-reviews", farmerProfileId],
    queryFn: async () => {
      const res = await apiClient.get<RatingSummaryResponse>(
        `/farmers/${farmerProfileId}/reviews`
      );
      return res.data;
    },
    enabled: Boolean(farmerProfileId),
  });

  if (isLoading) {
    return (
      <Card className="glass-card border-slate-800 p-6">
        <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-xs">
          <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
          <span>Loading verified buyer reviews...</span>
        </div>
      </Card>
    );
  }

  if (error || !data) {
    return null;
  }

  const { average_rating, total_reviews, rating_distribution, reviews } = data;

  return (
    <Card className="glass-card border-slate-800 shadow-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/40">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold text-white flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
            <span>Buyer Feedback & Ratings {farmerName ? `for ${farmerName}` : ""}</span>
          </CardTitle>
          <Badge variant="outline" className="text-[10px] text-emerald-400 border-emerald-500/30">
            VERIFIED PURCHASE REVIEWS
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-5 space-y-6">
        {/* Rating Score Overview */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="text-center shrink-0 space-y-1 sm:border-r sm:border-slate-800 sm:pr-6">
            <div className="text-3xl sm:text-4xl font-black text-white font-mono flex items-center justify-center gap-1">
              <span>{average_rating.toFixed(1)}</span>
              <span className="text-lg text-slate-500 font-normal">/ 5.0</span>
            </div>
            <div className="flex items-center justify-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(average_rating)
                      ? "text-amber-400 fill-amber-400"
                      : "text-slate-600"
                  }`}
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400">{total_reviews} verified reviews</p>
          </div>

          {/* Star Distribution Progress Bars */}
          <div className="flex-1 w-full space-y-1.5 text-xs">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = rating_distribution[String(stars)] || 0;
              const percent = total_reviews > 0 ? (count / total_reviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-2">
                  <span className="w-12 text-[11px] text-slate-400 text-right">{stars} ★</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-[10px] text-slate-500 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
            Recent Feedback from Delivered Orders
          </h4>

          {reviews.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 rounded-xl bg-slate-950/40 border border-slate-800/60">
              No reviews yet. Reviews are collected from verified buyers upon successful order delivery.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {reviews.map((rev) => (
                <div key={rev.id} className="py-3.5 space-y-1.5 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">
                        {rev.buyer_masked_name}
                      </span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                        <ShieldCheck className="h-2.5 w-2.5" />
                        Verified Purchase
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= rev.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] text-slate-500 ml-1">
                        {new Date(rev.created_at).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-300 leading-relaxed pl-1 italic">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
