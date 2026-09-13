import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  MapPin,
  Scale,
  IndianRupee,
} from "lucide-react";
import { BuyerPreferences } from "@/types/matching";
import { Button } from "@/components/ui/button";

const CATEGORY_OPTIONS = [
  "VEGETABLE",
  "FRUIT",
  "GRAIN",
  "PULSE",
  "SPICE",
  "OILSEED",
  "OTHER",
];

const QUALITY_GRADE_OPTIONS = [
  "PREMIUM",
  "GRADE_A",
  "GRADE_B",
  "GRADE_C",
  "UNGRADED",
];

export const buyerPreferenceSchema = z
  .object({
    preferred_categories: z.array(z.string()).default([]),
    preferred_products_str: z.string().default(""),
    preferred_varieties_str: z.string().default(""),
    preferred_quality_grades: z.array(z.string()).default([]),
    preferred_districts_str: z.string().default(""),
    preferred_states_str: z.string().default(""),
    minimum_quantity: z.union([z.number().positive(), z.nan()]).optional().nullable(),
    maximum_quantity: z.union([z.number().positive(), z.nan()]).optional().nullable(),
    minimum_price: z.union([z.number().positive(), z.nan()]).optional().nullable(),
    maximum_price: z.union([z.number().positive(), z.nan()]).optional().nullable(),
  })
  .refine(
    (data) => {
      if (
        data.minimum_quantity &&
        data.maximum_quantity &&
        !isNaN(data.minimum_quantity) &&
        !isNaN(data.maximum_quantity)
      ) {
        return data.minimum_quantity <= data.maximum_quantity;
      }
      return true;
    },
    {
      message: "Minimum quantity cannot exceed maximum quantity",
      path: ["maximum_quantity"],
    }
  )
  .refine(
    (data) => {
      if (
        data.minimum_price &&
        data.maximum_price &&
        !isNaN(data.minimum_price) &&
        !isNaN(data.maximum_price)
      ) {
        return data.minimum_price <= data.maximum_price;
      }
      return true;
    },
    {
      message: "Minimum price cannot exceed maximum price",
      path: ["maximum_price"],
    }
  );

export type BuyerPreferenceFormData = z.infer<typeof buyerPreferenceSchema>;

interface BuyerPreferenceFormProps {
  initialData?: BuyerPreferences;
  onSubmit: (data: Partial<BuyerPreferences>) => Promise<void>;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
}

export const BuyerPreferenceForm: React.FC<BuyerPreferenceFormProps> = ({
  initialData,
  onSubmit,
  isSaving,
  saveSuccess,
  saveError,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BuyerPreferenceFormData>({
    resolver: zodResolver(buyerPreferenceSchema),
    defaultValues: {
      preferred_categories: [],
      preferred_products_str: "",
      preferred_varieties_str: "",
      preferred_quality_grades: [],
      preferred_districts_str: "",
      preferred_states_str: "",
      minimum_quantity: null,
      maximum_quantity: null,
      minimum_price: null,
      maximum_price: null,
    },
  });

  const selectedCategories = watch("preferred_categories") || [];
  const selectedGrades = watch("preferred_quality_grades") || [];

  useEffect(() => {
    if (initialData) {
      reset({
        preferred_categories: initialData.preferred_categories || [],
        preferred_products_str: (initialData.preferred_products || []).join(", "),
        preferred_varieties_str: (initialData.preferred_varieties || []).join(", "),
        preferred_quality_grades: initialData.preferred_quality_grades || [],
        preferred_districts_str: (initialData.preferred_districts || []).join(", "),
        preferred_states_str: (initialData.preferred_states || []).join(", "),
        minimum_quantity: initialData.minimum_quantity ?? null,
        maximum_quantity: initialData.maximum_quantity ?? null,
        minimum_price: initialData.minimum_price ?? null,
        maximum_price: initialData.maximum_price ?? null,
      });
    }
  }, [initialData, reset]);

  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setValue(
        "preferred_categories",
        selectedCategories.filter((c) => c !== cat)
      );
    } else {
      setValue("preferred_categories", [...selectedCategories, cat]);
    }
  };

  const toggleGrade = (grade: string) => {
    if (selectedGrades.includes(grade)) {
      setValue(
        "preferred_quality_grades",
        selectedGrades.filter((g) => g !== grade)
      );
    } else {
      setValue("preferred_quality_grades", [...selectedGrades, grade]);
    }
  };

  const onFormSubmit = async (data: BuyerPreferenceFormData) => {
    const parseList = (str: string) =>
      str
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

    const payload: Partial<BuyerPreferences> = {
      preferred_categories: data.preferred_categories,
      preferred_products: parseList(data.preferred_products_str),
      preferred_varieties: parseList(data.preferred_varieties_str),
      preferred_quality_grades: data.preferred_quality_grades,
      preferred_districts: parseList(data.preferred_districts_str),
      preferred_states: parseList(data.preferred_states_str),
      minimum_quantity: data.minimum_quantity && !isNaN(data.minimum_quantity) ? data.minimum_quantity : null,
      maximum_quantity: data.maximum_quantity && !isNaN(data.maximum_quantity) ? data.maximum_quantity : null,
      minimum_price: data.minimum_price && !isNaN(data.minimum_price) ? data.minimum_price : null,
      maximum_price: data.maximum_price && !isNaN(data.maximum_price) ? data.maximum_price : null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Feedback Banners */}
      {saveSuccess && (
        <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/50 p-3 rounded-lg text-emerald-300 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Your buyer procurement preferences have been saved successfully!</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 bg-destructive/20 border border-destructive/50 p-3 rounded-lg text-rose-300 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 1. Preferred Categories */}
      <div className="bg-card/70 border border-border/70 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span>Preferred Categories</span>
        </div>
        <p className="text-xs text-slate-400">
          Select all produce categories you frequently source for wholesale or retail.
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {CATEGORY_OPTIONS.map((cat) => {
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                type="button"
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                    : "bg-secondary/40 border-border/80 text-slate-300 hover:border-slate-500"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Specific Products & Varieties */}
      <div className="bg-card/70 border border-border/70 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>Specific Products & Varieties</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Preferred Product Names (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Tomato, Onion, Chilli, Potato"
              {...register("preferred_products_str")}
              className="w-full h-10 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Matches listing titles or crop names exactly.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Preferred Varieties (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Hybrid, Vaishnavi, Desi, Sona Masuri"
              {...register("preferred_varieties_str")}
              className="w-full h-10 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="text-[11px] text-slate-500">
              Leave blank if variety is not a strict requirement.
            </p>
          </div>
        </div>

        {/* Quality Grades */}
        <div className="space-y-2 pt-2 border-t border-border/40">
          <label className="text-xs font-semibold text-slate-300 block">
            Preferred Quality Grades
          </label>
          <div className="flex flex-wrap gap-2">
            {QUALITY_GRADE_OPTIONS.map((grade) => {
              const isSelected = selectedGrades.includes(grade);
              return (
                <button
                  type="button"
                  key={grade}
                  onClick={() => toggleGrade(grade)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    isSelected
                      ? "bg-teal-500/20 border-teal-500 text-teal-300"
                      : "bg-secondary/40 border-border/80 text-slate-300 hover:border-slate-500"
                  }`}
                >
                  {grade.replace("_", " ")}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Location Preferences */}
      <div className="bg-card/70 border border-border/70 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white font-semibold text-sm">
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Regional Sourcing Preferences</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Preferred Districts (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Krishna, Guntur, Kolar, Kurnool"
              {...register("preferred_districts_str")}
              className="w-full h-10 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Preferred States (comma-separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Andhra Pradesh, Karnataka, Telangana"
              {...register("preferred_states_str")}
              className="w-full h-10 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* 4. Lot Volume & Budget Ranges */}
      <div className="bg-card/70 border border-border/70 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quantity Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <Scale className="w-4 h-4 text-emerald-400" />
              <span>Lot Quantity Range (KG)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Min KG</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Min (e.g. 100)"
                  {...register("minimum_quantity", { valueAsNumber: true })}
                  className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Max KG</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Max (e.g. 1000)"
                  {...register("maximum_quantity", { valueAsNumber: true })}
                  className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            {errors.maximum_quantity && (
              <p className="text-xs text-rose-400">{errors.maximum_quantity.message}</p>
            )}
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-semibold text-sm">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>Target Price Range (₹/KG)</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Min Price (₹)</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Min ₹"
                  {...register("minimum_price", { valueAsNumber: true })}
                  className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-slate-400">Max Price (₹)</span>
                <input
                  type="number"
                  step="any"
                  placeholder="Max ₹"
                  {...register("maximum_price", { valueAsNumber: true })}
                  className="w-full h-9 rounded-md bg-secondary/40 border border-border/80 px-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
            {errors.maximum_price && (
              <p className="text-xs text-rose-400">{errors.maximum_price.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSaving}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-6 shadow-md shadow-emerald-900/20"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving Preferences..." : "Save Preferences"}</span>
        </Button>
      </div>
    </form>
  );
};
