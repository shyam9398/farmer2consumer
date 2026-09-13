import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useDemandHistory } from "@/lib/demandApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar } from "lucide-react";

export const FarmerDemandHistoryPage: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [productName, setProductName] = useState<string>("Tomato");

  const { data: history, isLoading } = useDemandHistory(productName, periodDays);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <Link
              to="/farmer/demand-intelligence"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Demand Intelligence
            </Link>
            <h1 className="text-2xl font-extrabold text-slate-900">Historical Demand Analytics</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Track daily order trends, sales velocity, and unique buyer activity over time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800"
            >
              <option value="Tomato">Tomato</option>
              <option value="Onion">Onion</option>
              <option value="Chilli">Chilli</option>
              <option value="Potato">Potato</option>
              <option value="Rice">Rice</option>
            </select>

            <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs">
              {[7, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setPeriodDays(d)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                    periodDays === d ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {d} Days
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Demand History Points Table & Breakdown */}
        <Card className="border border-slate-200 bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Daily Demand Points — {productName} ({periodDays} Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400">Loading demand history...</div>
            ) : history && history.points.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4 text-right">Orders</th>
                      <th className="py-3 px-4 text-right">Qty Sold</th>
                      <th className="py-3 px-4 text-right">Unique Buyers</th>
                      <th className="py-3 px-4 text-right">Sales Velocity</th>
                      <th className="py-3 px-4 text-center">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.points.map((pt) => (
                      <tr key={pt.date} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{pt.date}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-slate-700">{pt.order_count}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{pt.quantity_sold} KG</td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{pt.unique_buyers}</td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{pt.sales_velocity} KG/day</td>
                        <td className="py-2.5 px-4 text-center font-bold text-slate-900">{pt.demand_score}/100</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                No historical order points available for {productName} in the last {periodDays} days.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
