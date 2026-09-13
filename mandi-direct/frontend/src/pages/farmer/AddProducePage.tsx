import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  DollarSign,
  Loader2,
  Save,
  Sprout,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNavigationMapper } from "@/context/NavigationMapperContext";
import { useFarms, useFarmerProfile } from "@/hooks/useFarmer";
import { useCreateProduce, useCropCatalog } from "@/hooks/useProduce";
import { produceSchema, ProduceFormValues } from "@/schemas/produce";
import { CropReferenceItem } from "@/types/produce";
import { apiClient } from "@/lib/axios";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { VoiceInputButton } from "@/components/common/VoiceInputButton";

export const AddProducePage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { profile: userProfile } = useAuth();
  const { data: farmerProfile } = useFarmerProfile();
  const { data: farms = [], isLoading: isFarmsLoading, refetch: refetchFarms } = useFarms();
  const { data: cropCatalog = [] } = useCropCatalog();

  const createMutation = useCreateProduce();

  const [formError, setFormError] = useState<string | null>(null);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [isAutoCreatingFarm, setIsAutoCreatingFarm] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProduceFormValues>({
    resolver: zodResolver(produceSchema),
    defaultValues: {
      farm_id: "",
      product_name: "",
      category: "VEGETABLE",
      variety: "",
      description: "",
      total_quantity: 100,
      quantity_unit: "KG",
      quality_grade: "GRADE_A",
      harvest_date: todayStr,
      available_from: todayStr,
      available_until: "",
      expected_price: 30,
      price_unit: "PER_KG",
      minimum_order_quantity: 10,
    },
  });

  const { isActive: isNavMapperActive, actionId: navActionId, resumeAtFirstIncompleteStep } = useNavigationMapper();

  // Auto-resume at first incomplete step if upload crop guide is active
  useEffect(() => {
    if (isNavMapperActive && navActionId === 'upload_crop') {
      const timer = setTimeout(() => {
        resumeAtFirstIncompleteStep();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isNavMapperActive, navActionId, resumeAtFirstIncompleteStep]);

  // Auto-associate the first farm if available
  useEffect(() => {
    if (farms.length > 0) {
      setValue("farm_id", farms[0].id, { shouldValidate: true });
    }
  }, [farms, setValue]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setPhotoFiles((prev) => [...prev, ...newFiles]);

    const newPreviews = newFiles.map((file) => URL.createObjectURL(file));
    setPhotoPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removePhoto = (index: number) => {
    setPhotoFiles((prev) => prev.filter((_, i) => i !== index));
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectCatalogCrop = (crop: CropReferenceItem) => {
    setValue("product_name", crop.name, { shouldValidate: true });
    setValue("category", crop.category as any, { shouldValidate: true });
    setValue("quantity_unit", crop.standard_unit as any, { shouldValidate: true });

    if (crop.standard_unit === "KG") {
      setValue("price_unit", "PER_KG");
    } else if (crop.standard_unit === "QUINTAL") {
      setValue("price_unit", "PER_QUINTAL");
    } else if (crop.standard_unit === "TON") {
      setValue("price_unit", "PER_TON");
    }
  };

  const ensureFarmExists = async (): Promise<string> => {
    if (farms.length > 0) {
      return farms[0].id;
    }

    // Auto-create minimal internal farm record
    setIsAutoCreatingFarm(true);
    const farmName = `${farmerProfile?.full_name || userProfile?.full_name || 'Farmer'} Parcel`;
    const res = await apiClient.post("/farmers/farms", {
      farm_name: farmName,
      total_area: 2.0,
      area_unit: "ACRE",
      ownership_type: "OWNED",
      primary_crops: ["General Harvest"],
      village: farmerProfile?.village || "Local Village",
      mandal: farmerProfile?.mandal || farmerProfile?.village || "Local Mandal",
      district: farmerProfile?.district || "Local District",
      state: farmerProfile?.state || "State",
      pincode: farmerProfile?.pincode || "500001",
    });

    await refetchFarms();
    setIsAutoCreatingFarm(false);
    return res.data.id;
  };

  const onSubmit = async (values: ProduceFormValues) => {
    setFormError(null);
    try {
      let targetFarmId = values.farm_id;
      if (!targetFarmId) {
        targetFarmId = await ensureFarmExists();
      }

      const created = await createMutation.mutateAsync({
        ...values,
        farm_id: targetFarmId,
        variety: values.variety || undefined,
        description: values.description || undefined,
        available_until: values.available_until || undefined,
      });

      // Upload photos and store in Supabase Storage
      let primaryImageUrl = "";
      if (photoFiles.length > 0) {
        for (let i = 0; i < photoFiles.length; i++) {
          const file = photoFiles[i];
          const formData = new FormData();
          formData.append("file", file);
          try {
            const imgRes = await apiClient.post(`/farmers/produce/${created.id}/images`, formData, {
              headers: { "Content-Type": "multipart/form-data" },
            });
            if (i === 0 && imgRes.data?.public_url) {
              primaryImageUrl = imgRes.data.public_url;
            }
          } catch (imgErr) {
            console.warn("Backend photo upload attempt:", imgErr);
          }

          // Direct Supabase Storage upload to 'produce-images' bucket
          if (isSupabaseConfigured) {
            try {
              const fileExt = file.name.split(".").pop() || "jpg";
              const storagePath = `${userProfile?.id || "farmer"}/${created.id}/${Date.now()}-${i}.${fileExt}`;
              const { data: supaStorageData, error: supaStorageErr } = await supabase.storage
                .from("produce-images")
                .upload(storagePath, file, { contentType: file.type, upsert: true });

              if (!supaStorageErr && supaStorageData) {
                const { data: publicUrlData } = supabase.storage.from("produce-images").getPublicUrl(storagePath);
                if (i === 0 && publicUrlData?.publicUrl) {
                  primaryImageUrl = publicUrlData.publicUrl;
                }
              }
            } catch (supaErr) {
              console.warn("Direct Supabase storage upload attempt:", supaErr);
            }
          }
        }
      }

      // Sync produce listing to Supabase table
      if (isSupabaseConfigured) {
        try {
          await supabase.from("produce_listings").upsert({
            id: created.id,
            farmer_profile_id: created.farmer_profile_id,
            farm_id: targetFarmId,
            product_name: values.product_name,
            category: values.category,
            variety: values.variety || null,
            description: values.description || null,
            total_quantity: Number(values.total_quantity),
            available_quantity: Number(values.total_quantity),
            quantity_unit: values.quantity_unit,
            quality_grade: values.quality_grade,
            expected_price: Number(values.expected_price),
            price_unit: values.price_unit,
            minimum_order_quantity: Number(values.minimum_order_quantity),
            status: "LISTED",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        } catch (supaTableErr) {
          console.warn("Supabase produce_listings sync attempt:", supaTableErr);
        }
      }

      // Guarantee immediate reflection to buyer in marketplace
      const localProduct = {
        id: created.id,
        product_name: values.product_name,
        category: values.category,
        variety: values.variety || "",
        description: values.description || "",
        total_quantity: Number(values.total_quantity),
        available_quantity: Number(values.total_quantity),
        quantity_unit: values.quantity_unit,
        quality_grade: values.quality_grade,
        price: Number(values.expected_price),
        expected_price: Number(values.expected_price),
        price_unit: values.price_unit,
        harvest_date: values.harvest_date,
        available_from: values.available_from,
        available_until: values.available_until || null,
        minimum_order_quantity: Number(values.minimum_order_quantity),
        status: "LISTED",
        primary_image_url: primaryImageUrl || (photoPreviews.length > 0 ? photoPreviews[0] : null),
        image_count: photoFiles.length,
        farmer: {
          id: created.farmer_profile_id || "farmer-1",
          name: farmerProfile?.full_name || userProfile?.full_name || "Verified Farmer",
          is_verified: true,
          verification_status: "VERIFIED",
        },
        location: {
          village: farmerProfile?.village || "Local Village",
          mandal: farmerProfile?.mandal || "Local Mandal",
          district: farmerProfile?.district || "Local District",
          state: farmerProfile?.state || "State",
        },
      };

      try {
        const raw = localStorage.getItem("mandi_custom_listings");
        const existingList = raw ? JSON.parse(raw) : [];
        const filtered = existingList.filter((item: any) => item.id !== created.id);
        filtered.unshift(localProduct);
        localStorage.setItem("mandi_custom_listings", JSON.stringify(filtered));
      } catch (e) {
        console.warn("Unable to cache custom listing locally:", e);
      }

      navigate(`/farmer/produce/${created.id}?created=true`);
    } catch (err: any) {
      const detail =
        err?.response?.data?.detail || err.message || "Failed to upload produce listing.";
      setFormError(detail);
    }
  };

  if (isFarmsLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-6 max-w-4xl">
      {/* Back link */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          to="/farmer/dashboard"
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>
      </div>

      <div className="border-b border-border/60 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2.5">
          <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
            <Sprout className="h-6 w-6" />
          </span>
          {t.addProduce.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {t.addProduce.subtitle}
        </p>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-200">Listing Upload Failed</h4>
            <p className="text-xs text-rose-300 mt-0.5">{formError}</p>
          </div>
        </div>
      )}

      {/* Auto-Farm Notification / Location */}
      <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-300" data-tour-id="upload-crop-location">
        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>{t.addProduce.autoFarmNotice}</span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Step 1: Photo Upload */}
        <Card className="glass-card" data-tour-id="upload-crop-photo">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              <span>1. {t.addProduce.photoUpload}</span>
            </CardTitle>
            <CardDescription className="text-xs text-slate-400">
              {t.addProduce.photoHelp}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border/80 rounded-2xl p-6 text-center hover:border-emerald-500/60 transition-colors bg-secondary/20">
              <input
                type="file"
                id="crop-photo-input"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoChange}
              />
              <label
                htmlFor="crop-photo-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-2"
              >
                <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-400">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  Tap to take photo or upload crop pictures
                </p>
                <p className="text-[11px] text-slate-400">PNG, JPG, WebP up to 5MB</p>
              </label>
            </div>

            {/* Photo Previews */}
            {photoPreviews.length > 0 && (
              <div className="flex items-center gap-3 overflow-x-auto pb-2">
                {photoPreviews.map((src, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-500/40 shrink-0">
                    <img src={src} alt="Crop preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 bg-black/70 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-rose-600"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 2: Category & Name */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-400" />
              <span>2. Crop Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Category Select */}
            <div className="space-y-1.5" data-tour-id="upload-crop-category">
              <Label className="text-xs text-slate-300 font-semibold">
                {t.addProduce.category} <span className="text-emerald-400">*</span>
              </Label>
              <select
                className="w-full h-11 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground focus:ring-2 focus:ring-emerald-500"
                {...register("category")}
              >
                <option value="VEGETABLE">Vegetables (सब्जियां / కూరగాయలు)</option>
                <option value="GRAIN">Grains & Cereals (अनाज / తృణధాన్యాలు)</option>
                <option value="FRUIT">Fruits (फल / పండ్లు)</option>
                <option value="PULSE">Pulses (दालें / పప్పుధాన్యాలు)</option>
                <option value="SPICE">Spices (मसाले / మసాలాలు)</option>
                <option value="OILSEED">Oilseeds (तिलहन / నూనెగింజలు)</option>
              </select>
            </div>

            {/* Quick Catalog Chips */}
            {cropCatalog.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] text-slate-400 font-medium">Quick suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {cropCatalog.slice(0, 8).map((crop) => (
                    <button
                      key={crop.name}
                      type="button"
                      onClick={() => handleSelectCatalogCrop(crop)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/80 border border-border text-slate-300 hover:border-emerald-500 hover:text-emerald-400 transition-colors"
                    >
                      {crop.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Crop Name */}
            <div className="space-y-1.5" data-tour-id="upload-crop-name">
              <div className="flex items-center justify-between">
                <Label htmlFor="product_name" className="text-xs text-slate-300 font-semibold">
                  {t.addProduce.cropName} <span className="text-emerald-400">*</span>
                </Label>
                <VoiceInputButton
                  onResult={(text) => setValue("product_name", text, { shouldValidate: true })}
                  promptLabel={t.addProduce.cropName}
                  size="sm"
                />
              </div>
              <Input
                id="product_name"
                placeholder={t.addProduce.cropNamePlaceholder}
                {...register("product_name")}
              />
              {errors.product_name && (
                <p className="text-xs text-rose-400">{errors.product_name.message}</p>
              )}
            </div>

            {/* Variety */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="variety" className="text-xs text-slate-300">
                  Variety / Hybrid (Optional)
                </Label>
                <VoiceInputButton
                  onResult={(text) => setValue("variety", text)}
                  promptLabel="Crop variety"
                  size="sm"
                />
              </div>
              <Input
                id="variety"
                placeholder="e.g. Sona Masoori, Hybrid-10, Sharbati"
                {...register("variety")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Price & Quantity */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              <span>3. Pricing & Quantity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Expected Price */}
              <div className="space-y-1.5" data-tour-id="upload-crop-price">
                <div className="flex items-center justify-between">
                  <Label htmlFor="expected_price" className="text-xs text-slate-300 font-semibold">
                    {t.addProduce.pricePerUnit} <span className="text-emerald-400">*</span>
                  </Label>
                  <VoiceInputButton
                    onResult={(text) => {
                      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                      if (!isNaN(num)) setValue("expected_price", num, { shouldValidate: true });
                    }}
                    promptLabel="Selling price in rupees"
                    size="sm"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm">₹</span>
                  <Input
                    id="expected_price"
                    type="number"
                    step="0.5"
                    className="pl-7"
                    {...register("expected_price", { valueAsNumber: true })}
                  />
                </div>
                {errors.expected_price && (
                  <p className="text-xs text-rose-400">{errors.expected_price.message}</p>
                )}
              </div>

              {/* Price Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold">
                  Price Unit
                </Label>
                <select
                  className="w-full h-10 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground focus:ring-2 focus:ring-emerald-500"
                  {...register("price_unit")}
                >
                  <option value="PER_KG">₹ per kg</option>
                  <option value="PER_QUINTAL">₹ per quintal (100 kg)</option>
                  <option value="PER_TON">₹ per ton</option>
                </select>
              </div>

              {/* Total Quantity */}
              <div className="space-y-1.5" data-tour-id="upload-crop-quantity">
                <div className="flex items-center justify-between">
                  <Label htmlFor="total_quantity" className="text-xs text-slate-300 font-semibold">
                    {t.addProduce.quantity} <span className="text-emerald-400">*</span>
                  </Label>
                  <VoiceInputButton
                    onResult={(text) => {
                      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
                      if (!isNaN(num)) setValue("total_quantity", num, { shouldValidate: true });
                    }}
                    promptLabel="Harvest quantity"
                    size="sm"
                  />
                </div>
                <Input
                  id="total_quantity"
                  type="number"
                  step="1"
                  {...register("total_quantity", { valueAsNumber: true })}
                />
                {errors.total_quantity && (
                  <p className="text-xs text-rose-400">{errors.total_quantity.message}</p>
                )}
              </div>

              {/* Quantity Unit */}
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300 font-semibold">
                  {t.addProduce.unit}
                </Label>
                <select
                  className="w-full h-10 rounded-xl border border-input bg-secondary/40 px-3 text-sm text-foreground focus:ring-2 focus:ring-emerald-500"
                  {...register("quantity_unit")}
                >
                  <option value="KG">Kilogram (kg)</option>
                  <option value="QUINTAL">Quintal (100 kg)</option>
                  <option value="TON">Metric Ton</option>
                </select>
              </div>
            </div>

            {/* Harvest Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5" data-tour-id="upload-crop-harvest-date">
                <Label htmlFor="harvest_date" className="text-xs text-slate-300 font-semibold">
                  {t.addProduce.harvestDate} <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="harvest_date"
                  type="date"
                  {...register("harvest_date")}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description" className="text-xs text-slate-300">
                    {t.addProduce.description}
                  </Label>
                  <VoiceInputButton
                    onResult={(text) => setValue("description", text)}
                    promptLabel="Quality description"
                    size="sm"
                  />
                </div>
                <Input
                  id="description"
                  placeholder={t.addProduce.descriptionPlaceholder}
                  {...register("description")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
          <Link to="/farmer/dashboard">
            <Button variant="outline" type="button">
              {t.common.cancel}
            </Button>
          </Link>
          <Button
            type="submit"
            variant="harvest"
            size="lg"
            data-tour-id="upload-crop-submit"
            disabled={isSubmitting || isAutoCreatingFarm || createMutation.isPending}
            className="shadow-lg shadow-emerald-700/20 px-8 font-bold"
          >
            {isSubmitting || isAutoCreatingFarm || createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t.addProduce.submitting}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t.addProduce.submitBtn}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddProducePage;
