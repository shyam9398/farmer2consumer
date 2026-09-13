import { usePriceDemandCombinedInsight } from "@/lib/demandApi";
import { PriceDemandCombinedCard } from "@/components/demand/PriceDemandCombinedCard";
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  DollarSign,
  Edit2,
  Layers,
  Loader2,
  Package,
  Save,
  Send,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFarms } from "@/hooks/useFarmer";
import {
  useProduceDetail,
  useSubmitProduce,
  useUpdateProduce,
} from "@/hooks/useProduce";
import { ProduceImageUploader } from "@/components/produce/ProduceImageUploader";
import { produceSchema, ProduceFormValues } from "@/schemas/produce";
import { QuantityUnit } from "@/types/produce";

export const EditProducePage: React.FC = () => {
  const { produceId } = useParams<{ produceId: string }>();
  const navigate = useNavigate();

  const { data: farms = [] } = useFarms();
  const { data: produce, isLoading: isProduceLoading, isError } = useProduceDetail(produceId);

  const updateMutation = useUpdateProduce(produceId || "");
  const submitMutation = useSubmitProduce();

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProduceFormValues>({
    resolver: zodResolver(produceSchema),
  });

  const selectedQuantityUnit = watch("quantity_unit");
  const selectedTotalQty = watch("total_quantity");
  const currentProductName = watch("product_name");

  const { data: combinedInsight } = usePriceDemandCombinedInsight(
    currentProductName,
    30,
    !!currentProductName && currentProductName.trim().length > 1
  );

  useEffect(() => {
    if (produce) {
      reset({
        farm_id: produce.farm_id,
        product_name: produce.product_name,
        category: produce.category,
        variety: produce.variety || "",
        description: produce.description || "",
        total_quantity: Number(produce.total_quantity),
        quantity_unit: produce.quantity_unit,
        quality_grade: produce.quality_grade,
        harvest_date: produce.harvest_date,
        available_from: produce.available_from,
        available_until: produce.available_until || "",
        expected_price: Number(produce.expected_price),
        price_unit: produce.price_unit,
        minimum_order_quantity: Number(produce.minimum_order_quantity),
      });
    }
  }, [produce, reset]);

  if (isProduceLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">Loading produce lot...</p>
      </div>
    );
  }

  if (isError || !produce) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-4">
        <AlertCircle className="h-10 w-10 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Produce Lot Not Found</h2>
        <p className="text-xs text-slate-400">
          This produce listing does not exist or does not belong to your account.
        </p>
        <Button variant="outline" size="sm" onClick={() => navigate("/farmer/produce")}>
          Back to My Produce
        </Button>
      </div>
    );
  }

  // Strict state machine guard: only DRAFT or REJECTED can be modified
  if (produce.status !== "DRAFT" && produce.status !== "REJECTED") {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center space-y-4">
        <Card className="glass-card border-amber-500/40 p-6 space-y-4">
          <ShieldAlert className="h-10 w-10 text-amber-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Cannot Modify Verified Lot</h2>
          <p className="text-xs text-slate-300">
            This produce listing is currently in <strong>"{produce.status}"</strong> status. Once a produce lot has been submitted, approved, or listed, details are locked to guarantee integrity for marketplace buyers.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate(`/farmer/produce/${produce.id}`)}>
              View Lot Details
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => navigate("/farmer/produce")}
            >
              Back to Produce List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const onSubmit = async (values: ProduceFormValues) => {
    setFormError(null);
    setFormSuccess(null);
    try {
      await updateMutation.mutateAsync({
        ...values,
        variety: values.variety || undefined,
        description: values.description || undefined,
        available_until: values.available_until || undefined,
      });
      setFormSuccess("Produce lot updated successfully.");
      setTimeout(() => setFormSuccess(null), 4000);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || "Failed to update produce lot.");
    }
  };

  const handleSaveAndSubmit = async () => {
    setFormError(null);
    if (!produce.images || produce.images.length === 0) {
      setFormError("Please upload at least 1 photo below before submitting for verification.");
      return;
    }

    try {
      await submitMutation.mutateAsync(produce.id);
      navigate(`/farmer/produce/${produce.id}`);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || "Failed to submit for verification.");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-6 max-w-4xl">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          to={`/farmer/produce/${produce.id}`}
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Produce Detail
        </Link>
      </div>

      <div className="flex items-start justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Edit2 className="h-6 w-6" />
            </span>
            Edit Produce Lot: {produce.product_name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Update harvest information, pricing terms, and lot photos.
          </p>
        </div>
      </div>

      {formSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
          {formSuccess}
        </div>
      )}
      {formError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
          {formError}
        </div>
      )}

      {/* Photo Management Section */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <ProduceImageUploader
            produceId={produce.id}
            images={produce.images || []}
            readOnly={false}
          />
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Farm Parcel & Crop Identification */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              1. Farm Parcel & Crop Identification
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-200">
                Origin Farm Parcel <span className="text-rose-400">*</span>
              </Label>
              <select
                {...register("farm_id")}
                className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>
                    {farm.farm_name} — {farm.village}, {farm.mandal} ({farm.total_area} {farm.area_unit})
                  </option>
                ))}
              </select>
              {errors.farm_id && (
                <p className="text-rose-400 text-[11px]">{errors.farm_id.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Crop / Commodity Name <span className="text-rose-400">*</span>
                </Label>
                <Input
                  {...register("product_name")}
                  className="bg-slate-900/70 border-slate-700 text-xs"
                />
                {errors.product_name && (
                  <p className="text-rose-400 text-[11px]">{errors.product_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Category <span className="text-rose-400">*</span>
                </Label>
                <select
                  {...register("category")}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="VEGETABLE">Vegetables</option>
                  <option value="FRUIT">Fruits</option>
                  <option value="GRAIN">Grains & Cereals</option>
                  <option value="PULSE">Pulses / Dal</option>
                  <option value="SPICE">Spices</option>
                  <option value="OILSEED">Oilseeds</option>
                  <option value="OTHER">Other Crops</option>
                </select>
                {errors.category && (
                  <p className="text-rose-400 text-[11px]">{errors.category.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-200">
                Variety / Cultivar
              </Label>
              <Input
                {...register("variety")}
                className="bg-slate-900/70 border-slate-700 text-xs"
              />
              {errors.variety && (
                <p className="text-rose-400 text-[11px]">{errors.variety.message}</p>
              )}
            </div>

            {/* Combined Price + Demand Intelligence Widget */}
            {combinedInsight && (
              <div className="pt-2">
                <PriceDemandCombinedCard insight={combinedInsight} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-200">
                Harvest Condition & Description
              </Label>
              <Textarea
                rows={2}
                {...register("description")}
                className="bg-slate-900/70 border-slate-700 text-xs resize-none"
              />
              {errors.description && (
                <p className="text-rose-400 text-[11px]">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Quantities, Grade & Dates */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Package className="h-4 w-4 text-emerald-400" />
              2. Quantities, Quality Grade & Dates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold text-slate-200">
                  Total Harvest Lot Quantity <span className="text-rose-400">*</span>
                </Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register("total_quantity")}
                  className="bg-slate-900/70 border-slate-700 text-xs font-mono"
                />
                {errors.total_quantity && (
                  <p className="text-rose-400 text-[11px]">{errors.total_quantity.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Quantity Unit <span className="text-rose-400">*</span>
                </Label>
                <select
                  {...register("quantity_unit")}
                  onChange={(e) => {
                    const unit = e.target.value as QuantityUnit;
                    setValue("quantity_unit", unit);
                    if (unit === "KG") setValue("price_unit", "PER_KG");
                    if (unit === "QUINTAL") setValue("price_unit", "PER_QUINTAL");
                    if (unit === "TON") setValue("price_unit", "PER_TON");
                  }}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="KG">Kilogram (kg)</option>
                  <option value="QUINTAL">Quintal (100 kg)</option>
                  <option value="TON">Metric Ton (1,000 kg)</option>
                </select>
                {errors.quantity_unit && (
                  <p className="text-rose-400 text-[11px]">{errors.quantity_unit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-200">
                Self-Declared Quality Grade <span className="text-rose-400">*</span>
              </Label>
              <select
                {...register("quality_grade")}
                className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="PREMIUM">Premium (Export Grade, Zero Defects)</option>
                <option value="GRADE_A">Grade A (High Commercial Quality, Uniform Size)</option>
                <option value="GRADE_B">Grade B (Standard Market Quality)</option>
                <option value="GRADE_C">Grade C (Processing / Feed Quality)</option>
                <option value="UNGRADED">Ungraded / Field Harvest As-Is</option>
              </select>
              {errors.quality_grade && (
                <p className="text-rose-400 text-[11px]">{errors.quality_grade.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Harvest Date <span className="text-rose-400">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("harvest_date")}
                  className="bg-slate-900/70 border-slate-700 text-xs"
                />
                {errors.harvest_date && (
                  <p className="text-rose-400 text-[11px]">{errors.harvest_date.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Available From <span className="text-rose-400">*</span>
                </Label>
                <Input
                  type="date"
                  {...register("available_from")}
                  className="bg-slate-900/70 border-slate-700 text-xs"
                />
                {errors.available_from && (
                  <p className="text-rose-400 text-[11px]">{errors.available_from.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Available Until
                </Label>
                <Input
                  type="date"
                  {...register("available_until")}
                  className="bg-slate-900/70 border-slate-700 text-xs"
                />
                {errors.available_until && (
                  <p className="text-rose-400 text-[11px]">{errors.available_until.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Pricing & MOQ */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              3. Pricing & Minimum Order Quantity (MOQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Expected Price (₹) <span className="text-rose-400">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    {...register("expected_price")}
                    className="pl-8 bg-slate-900/70 border-slate-700 text-xs font-mono font-bold text-emerald-300"
                  />
                </div>
                {errors.expected_price && (
                  <p className="text-rose-400 text-[11px]">{errors.expected_price.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-200">
                  Pricing Unit <span className="text-rose-400">*</span>
                </Label>
                <select
                  {...register("price_unit")}
                  className="w-full h-10 px-3 rounded-md bg-slate-900/80 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                >
                  <option value="PER_KG">Per Kilogram (₹/kg)</option>
                  <option value="PER_QUINTAL">Per Quintal (₹/quintal)</option>
                  <option value="PER_TON">Per Metric Ton (₹/ton)</option>
                </select>
                {errors.price_unit && (
                  <p className="text-rose-400 text-[11px]">{errors.price_unit.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-200">
                  Minimum Order Quantity (MOQ) <span className="text-rose-400">*</span>
                </Label>
                <span className="text-[11px] text-slate-400">
                  Max: {selectedTotalQty} {selectedQuantityUnit}
                </span>
              </div>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register("minimum_order_quantity")}
                className="bg-slate-900/70 border-slate-700 text-xs font-mono"
              />
              {errors.minimum_order_quantity && (
                <p className="text-rose-400 text-[11px]">
                  {errors.minimum_order_quantity.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-4 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/farmer/produce/${produce.id}`)}
            className="border-slate-700"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="submit"
              disabled={isSubmitting || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>

            <Button
              type="button"
              onClick={handleSaveAndSubmit}
              disabled={
                submitMutation.isPending ||
                !produce.images ||
                produce.images.length === 0
              }
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
              title={
                !produce.images || produce.images.length === 0
                  ? "Upload at least 1 photo first"
                  : "Submit for Admin Verification"
              }
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
