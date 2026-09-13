import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { PriceObservation, PriceObservationCreateInput } from "@/types/priceIntelligence";
import { X, Save, Plus } from "lucide-react";

interface PriceObservationFormProps {
  initialData?: PriceObservation | null;
  onSubmit: (data: PriceObservationCreateInput) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const PriceObservationForm: React.FC<PriceObservationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PriceObservationCreateInput>({
    defaultValues: {
      product_name: "",
      category: "VEGETABLE",
      variety: "",
      quality_grade: "GRADE_A",
      price: 30,
      currency: "INR",
      price_unit: "PER_KG",
      market_name: "",
      district: "",
      state: "",
      source_type: "ADMIN_IMPORT",
      source_name: "Admin Entry",
      source_reference: "",
      observation_date: new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        product_name: initialData.product_name,
        category: initialData.category || "VEGETABLE",
        variety: initialData.variety || "",
        quality_grade: initialData.quality_grade || "GRADE_A",
        price: initialData.price,
        currency: initialData.currency || "INR",
        price_unit: initialData.price_unit || "PER_KG",
        market_name: initialData.market_name || "",
        district: initialData.district || "",
        state: initialData.state || "",
        source_type: initialData.source_type,
        source_name: initialData.source_name,
        source_reference: initialData.source_reference || "",
        observation_date: initialData.observation_date,
      });
    }
  }, [initialData, reset]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl p-6 overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
          <h3 className="font-bold text-lg text-foreground">
            {initialData ? "Edit Price Observation" : "Add Market Price Observation"}
          </h3>
          <button
            type="button"
            onClick={onCancel}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-foreground block mb-1">Product Name *</label>
              <input
                {...register("product_name", { required: "Product name is required" })}
                type="text"
                placeholder="e.g. Tomato"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              {errors.product_name && (
                <span className="text-rose-500 text-[11px]">{errors.product_name.message}</span>
              )}
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Category *</label>
              <select
                {...register("category")}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              >
                <option value="VEGETABLE">Vegetables</option>
                <option value="FRUIT">Fruits</option>
                <option value="GRAIN">Grains</option>
                <option value="PULSE">Pulses</option>
                <option value="SPICE">Spices</option>
                <option value="OILSEED">Oilseeds</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Variety</label>
              <input
                {...register("variety")}
                type="text"
                placeholder="e.g. Hybrid / Desi"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Quality Grade</label>
              <select
                {...register("quality_grade")}
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
              <label className="font-medium text-foreground block mb-1">Observed Price *</label>
              <input
                {...register("price", { required: "Price is required", valueAsNumber: true, min: 0.01 })}
                type="number"
                step="0.01"
                placeholder="e.g. 30.00"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm font-semibold"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Price Unit *</label>
              <select
                {...register("price_unit")}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              >
                <option value="PER_KG">PER_KG (INR/KG)</option>
                <option value="PER_QUINTAL">PER_QUINTAL (100 KG)</option>
                <option value="PER_TON">PER_TON (1000 KG)</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Market / Mandi Name</label>
              <input
                {...register("market_name")}
                type="text"
                placeholder="e.g. Azadpur Mandi"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">District</label>
              <input
                {...register("district")}
                type="text"
                placeholder="e.g. Kolar"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">State</label>
              <input
                {...register("state")}
                type="text"
                placeholder="e.g. Karnataka"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Observation Date *</label>
              <input
                {...register("observation_date", { required: "Date is required" })}
                type="date"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Source Type *</label>
              <select
                {...register("source_type")}
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              >
                <option value="ADMIN_IMPORT">ADMIN_IMPORT</option>
                <option value="GOVERNMENT_DATA">GOVERNMENT_DATA</option>
                <option value="EXTERNAL_API">EXTERNAL_API</option>
                <option value="MANDI_DIRECT_TRANSACTION">MANDI_DIRECT_TRANSACTION</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>

            <div>
              <label className="font-medium text-foreground block mb-1">Source Name *</label>
              <input
                {...register("source_name", { required: "Source name is required" })}
                type="text"
                placeholder="e.g. Agmarknet Portal"
                className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-border text-foreground hover:bg-muted font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm transition-colors"
            >
              {initialData ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {initialData ? "Save Changes" : "Create Observation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
