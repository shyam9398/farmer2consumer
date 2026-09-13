import React, { useState } from "react";
import { usePriceRecommendation } from "@/hooks/usePriceIntelligence";
import { PriceRecommendationRequest, PriceRecommendationResponse } from "@/types/priceIntelligence";
import { PriceRecommendationCard } from "@/components/price-intelligence/PriceRecommendationCard";
import { RegionalPriceComparison } from "@/components/price-intelligence/RegionalPriceComparison";
import { PriceHistoryChart } from "@/components/price-intelligence/PriceHistoryChart";
import { usePriceHistory, useRegionalPrices } from "@/hooks/usePriceIntelligence";
import { Sparkles, Calculator, History, Search } from "lucide-react";
import { Link } from "react-router-dom";

export const FarmerPriceIntelligencePage: React.FC = () => {
  const [productName, setProductName] = useState("Tomato");
  const [variety, setVariety] = useState("Hybrid");
  const [qualityGrade, setQualityGrade] = useState("GRADE_A");
  const [district, setDistrict] = useState("Kolar");
  const [state, _setState] = useState("Karnataka");
  const [expectedPrice, setExpectedPrice] = useState<number | undefined>(32);
  const [priceUnit, setPriceUnit] = useState("PER_KG");

  const [recommendation, setRecommendation] = useState<PriceRecommendationResponse | null>(null);

  const recommendationMutation = usePriceRecommendation();

  // Queries for history and regional breakdown
  const historyQuery = usePriceHistory(productName, variety, qualityGrade, 30);
  const regionalQuery = useRegionalPrices(productName, variety, qualityGrade, district, state);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: PriceRecommendationRequest = {
      product_name: productName,
      variety: variety || undefined,
      quality_grade: qualityGrade || undefined,
      district: district || undefined,
      state: state || undefined,
      expected_price: expectedPrice,
      price_unit: priceUnit,
    };

    recommendationMutation.mutate(payload, {
      onSuccess: (data) => {
        setRecommendation(data);
      },
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-lg">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-xs mb-2">
            <Sparkles className="h-3.5 w-3.5" />
            Market Intelligence Engine
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Farmer Price Intelligence</h1>
          <p className="text-xs md:text-sm text-emerald-100 mt-1 max-w-xl">
            Evaluate fair wholesale market prices, regional benchmarks, and demand trends based on verified transaction data.
          </p>
        </div>
        <Link
          to="/farmer/price-intelligence/history"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-bold text-xs shadow-md hover:bg-emerald-50 transition-colors shrink-0"
        >
          <History className="h-4 w-4" />
          View Detailed Price History
        </Link>
      </div>

      {/* Interactive Inputs Form */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-2xs">
        <h2 className="font-extrabold text-lg text-foreground flex items-center gap-2 mb-4">
          <Calculator className="h-5 w-5 text-emerald-500" />
          Select Produce Parameters
        </h2>

        <form onSubmit={handleCalculate} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-xs">
          <div>
            <label className="font-semibold text-foreground block mb-1">Produce *</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Tomato"
              required
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-medium"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Variety</label>
            <input
              type="text"
              value={variety}
              onChange={(e) => setVariety(e.target.value)}
              placeholder="e.g. Hybrid"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Quality Grade</label>
            <select
              value={qualityGrade}
              onChange={(e) => setQualityGrade(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
            >
              <option value="PREMIUM">PREMIUM</option>
              <option value="GRADE_A">GRADE_A</option>
              <option value="GRADE_B">GRADE_B</option>
              <option value="GRADE_C">GRADE_C</option>
              <option value="UNGRADED">UNGRADED</option>
            </select>
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">District</label>
            <input
              type="text"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="e.g. Kolar"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Expected Price</label>
            <input
              type="number"
              step="0.1"
              value={expectedPrice || ""}
              onChange={(e) => setExpectedPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g. 32"
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-semibold"
            />
          </div>

          <div>
            <label className="font-semibold text-foreground block mb-1">Price Unit</label>
            <select
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
            >
              <option value="PER_KG">PER_KG</option>
              <option value="PER_QUINTAL">PER_QUINTAL</option>
              <option value="PER_TON">PER_TON</option>
            </select>
          </div>

          <div className="sm:col-span-2 md:col-span-3 lg:col-span-6 flex justify-end mt-2">
            <button
              type="submit"
              disabled={recommendationMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <Search className="h-4 w-4" />
              {recommendationMutation.isPending ? "Calculating..." : "Get Price Intelligence"}
            </button>
          </div>
        </form>
      </div>

      {/* Recommendation Results */}
      {recommendation && (
        <PriceRecommendationCard
          recommendation={recommendation}
          onUseSuggestedPrice={(targetPrice) => setExpectedPrice(targetPrice)}
        />
      )}

      {/* Regional Comparison */}
      {regionalQuery.data && (
        <RegionalPriceComparison regionalData={regionalQuery.data} />
      )}

      {/* History Chart */}
      {historyQuery.data && (
        <PriceHistoryChart historyData={historyQuery.data} />
      )}
    </div>
  );
};
