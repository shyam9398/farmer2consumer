import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  Sprout,
  MapPin,
  Layers,
  Save,
  Plus,
  X,
  AlertCircle,
  Compass,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFarm, useUpdateFarm } from "@/hooks/useFarmer";
import { farmSchema, FarmFormValues } from "@/schemas/farmer";

const COMMON_CROPS = [
  "Tomato",
  "Basmati Rice",
  "Wheat",
  "Chilli",
  "Cotton",
  "Onion",
  "Maize",
  "Potato",
  "Turmeric",
  "Sugarcane",
  "Soybean",
  "Groundnut",
];

export const EditFarmPage: React.FC = () => {
  const { farmId } = useParams<{ farmId: string }>();
  const navigate = useNavigate();
  const { data: farm, isLoading, error: fetchError } = useFarm(farmId);
  const updateFarm = useUpdateFarm();

  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [customCropInput, setCustomCropInput] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema),
  });

  // Populate form with existing farm data
  useEffect(() => {
    if (farm) {
      reset({
        farm_name: farm.farm_name,
        total_area: farm.total_area,
        area_unit: farm.area_unit,
        ownership_type: farm.ownership_type,
        soil_type: farm.soil_type || "",
        irrigation_type: farm.irrigation_type || "",
        primary_crops: farm.primary_crops || [],
        latitude: farm.latitude ?? "",
        longitude: farm.longitude ?? "",
        address_line: farm.address_line || "",
        village: farm.village,
        mandal: farm.mandal,
        district: farm.district,
        state: farm.state,
        pincode: farm.pincode,
      });
      setSelectedCrops(farm.primary_crops || []);
    }
  }, [farm, reset]);

  const toggleCrop = (crop: string) => {
    let updated: string[];
    if (selectedCrops.includes(crop)) {
      updated = selectedCrops.filter((c) => c !== crop);
    } else {
      updated = [...selectedCrops, crop];
    }
    setSelectedCrops(updated);
    setValue("primary_crops", updated, { shouldValidate: true });
  };

  const addCustomCrop = () => {
    const trimmed = customCropInput.trim();
    if (trimmed && !selectedCrops.includes(trimmed)) {
      const updated = [...selectedCrops, trimmed];
      setSelectedCrops(updated);
      setValue("primary_crops", updated, { shouldValidate: true });
      setCustomCropInput("");
    }
  };

  const onSubmit = async (values: FarmFormValues) => {
    if (!farmId) return;
    setErrorMessage(null);
    try {
      await updateFarm.mutateAsync({
        farmId,
        data: {
          farm_name: values.farm_name,
          total_area: Number(values.total_area),
          area_unit: values.area_unit,
          ownership_type: values.ownership_type,
          soil_type: values.soil_type || undefined,
          irrigation_type: values.irrigation_type || undefined,
          primary_crops: selectedCrops,
          latitude: values.latitude ? Number(values.latitude) : undefined,
          longitude: values.longitude ? Number(values.longitude) : undefined,
          address_line: values.address_line || undefined,
          village: values.village,
          mandal: values.mandal,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        },
      });

      navigate("/farmer/farms");
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.detail || "Failed to update farm parcel. Please verify your inputs."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">Loading farm details...</p>
      </div>
    );
  }

  if (fetchError || !farm) {
    return (
      <div className="container mx-auto px-4 py-16 text-center space-y-4 max-w-md">
        <div className="h-12 w-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Farm Not Found</h2>
        <p className="text-xs text-slate-400">
          The requested farm parcel does not exist or you do not have permission to access it.
        </p>
        <Link to="/farmer/farms">
          <Button variant="outline" size="sm">
            Back to My Farms
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-6 max-w-4xl">
      {/* Back button & Title */}
      <div className="flex items-center gap-3">
        <Link to="/farmer/farms">
          <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-white">Edit Farm: {farm.farm_name}</h1>
          <p className="text-xs text-slate-400">
            Update parcel acreage, agricultural characteristics, and location data.
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Farm Basic Info */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="h-4 w-4 text-emerald-400" />
              <span>Farm Identity & Acreage</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="farm_name" className="text-xs text-slate-300">
                  Farm / Plot Name <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="farm_name"
                  placeholder="e.g. Green Valley North Plot"
                  {...register("farm_name")}
                />
                {errors.farm_name && (
                  <p className="text-xs text-rose-400">{errors.farm_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="total_area" className="text-xs text-slate-300">
                  Total Area <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="total_area"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 5.5"
                  {...register("total_area")}
                />
                {errors.total_area && (
                  <p className="text-xs text-rose-400">{errors.total_area.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="area_unit" className="text-xs text-slate-300">
                  Unit of Area <span className="text-emerald-400">*</span>
                </Label>
                <select
                  id="area_unit"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
                  {...register("area_unit")}
                >
                  <option value="ACRE">Acre (एकड़)</option>
                  <option value="HECTARE">Hectare (हेक्टेयर)</option>
                </select>
                {errors.area_unit && (
                  <p className="text-xs text-rose-400">{errors.area_unit.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="ownership_type" className="text-xs text-slate-300">
                  Tenure / Ownership Type <span className="text-emerald-400">*</span>
                </Label>
                <select
                  id="ownership_type"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
                  {...register("ownership_type")}
                >
                  <option value="OWNED">Owned (स्वयं का)</option>
                  <option value="LEASED">Leased (पट्टे पर)</option>
                  <option value="FAMILY">Family Owned (पारिवारिक)</option>
                  <option value="OTHER">Other / Cooperative</option>
                </select>
                {errors.ownership_type && (
                  <p className="text-xs text-rose-400">{errors.ownership_type.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agricultural Details */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Sprout className="h-4 w-4 text-emerald-400" />
              <span>Agricultural Characteristics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="soil_type" className="text-xs text-slate-300">
                  Soil Type
                </Label>
                <select
                  id="soil_type"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
                  {...register("soil_type")}
                >
                  <option value="">Select Soil Type (Optional)</option>
                  <option value="BLACK">Black Soil (काली मिट्टी)</option>
                  <option value="RED">Red Soil (लाल मिट्टी)</option>
                  <option value="ALLUVIAL">Alluvial Soil (जलोढ़ मिट्टी)</option>
                  <option value="LOAMY">Loamy Soil (दोमट मिट्टी)</option>
                  <option value="SANDY">Sandy Soil (रेतीली मिट्टी)</option>
                  <option value="CLAY">Clay Soil (चिकनी मिट्टी)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="irrigation_type" className="text-xs text-slate-300">
                  Irrigation System
                </Label>
                <select
                  id="irrigation_type"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
                  {...register("irrigation_type")}
                >
                  <option value="">Select Irrigation Source (Optional)</option>
                  <option value="BOREWELL">Borewell / Tube well</option>
                  <option value="CANAL">Canal System</option>
                  <option value="DRIP">Drip Irrigation</option>
                  <option value="SPRINKLER">Sprinkler System</option>
                  <option value="RAINFED">Rainfed (वर्षा आधारित)</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {/* Primary Crops */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">
                  Primary Crops Cultivated <span className="text-emerald-400">*</span>
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  {selectedCrops.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {COMMON_CROPS.map((crop) => {
                  const isSelected = selectedCrops.includes(crop);
                  return (
                    <button
                      type="button"
                      key={crop}
                      onClick={() => toggleCrop(crop)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                          : "bg-secondary/60 text-slate-300 hover:bg-secondary border border-border/40"
                      }`}
                    >
                      {isSelected ? `✓ ${crop}` : `+ ${crop}`}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Input
                  placeholder="Or enter custom crop name..."
                  value={customCropInput}
                  onChange={(e) => setCustomCropInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomCrop();
                    }
                  }}
                  className="h-9 text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomCrop}
                  className="h-9 px-3 text-xs gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </Button>
              </div>

              {selectedCrops.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedCrops.map((crop) => (
                    <span
                      key={crop}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                    >
                      <span>{crop}</span>
                      <X
                        className="h-3 w-3 cursor-pointer hover:text-white"
                        onClick={() => toggleCrop(crop)}
                      />
                    </span>
                  ))}
                </div>
              )}

              {errors.primary_crops && (
                <p className="text-xs text-rose-400">{errors.primary_crops.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <MapPin className="h-4 w-4 text-emerald-400" />
              <span>Location Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="address_line" className="text-xs text-slate-300">
                Plot Location / Survey Number / Road
              </Label>
              <Input
                id="address_line"
                placeholder="e.g. Survey No. 104/A, Canal Road"
                {...register("address_line")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="village" className="text-xs text-slate-300">
                  Village <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="village"
                  placeholder="e.g. Kothur"
                  {...register("village")}
                />
                {errors.village && (
                  <p className="text-xs text-rose-400">{errors.village.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="mandal" className="text-xs text-slate-300">
                  Mandal / Tehsil <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="mandal"
                  placeholder="e.g. Shadnagar"
                  {...register("mandal")}
                />
                {errors.mandal && (
                  <p className="text-xs text-rose-400">{errors.mandal.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="district" className="text-xs text-slate-300">
                  District <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="district"
                  placeholder="e.g. Ranga Reddy"
                  {...register("district")}
                />
                {errors.district && (
                  <p className="text-xs text-rose-400">{errors.district.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="state" className="text-xs text-slate-300">
                  State <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="state"
                  placeholder="e.g. Telangana"
                  {...register("state")}
                />
                {errors.state && (
                  <p className="text-xs text-rose-400">{errors.state.message}</p>
                )}
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="pincode" className="text-xs text-slate-300">
                  Postal Code (6 Digits) <span className="text-emerald-400">*</span>
                </Label>
                <Input
                  id="pincode"
                  placeholder="e.g. 509216"
                  maxLength={6}
                  {...register("pincode")}
                />
                {errors.pincode && (
                  <p className="text-xs text-rose-400">{errors.pincode.message}</p>
                )}
              </div>

              {/* Coordinates */}
              <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-border/40">
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-1">
                  <Compass className="h-3.5 w-3.5 text-teal-400" />
                  <span>Geographic Coordinates (Optional)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      placeholder="Latitude (e.g. 17.1524)"
                      type="number"
                      step="any"
                      {...register("latitude")}
                    />
                    {errors.latitude && (
                      <p className="text-xs text-rose-400">{errors.latitude.message}</p>
                    )}
                  </div>
                  <div>
                    <Input
                      placeholder="Longitude (e.g. 78.2911)"
                      type="number"
                      step="any"
                      {...register("longitude")}
                    />
                    {errors.longitude && (
                      <p className="text-xs text-rose-400">{errors.longitude.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link to="/farmer/farms">
            <Button variant="ghost" type="button" disabled={isSubmitting || updateFarm.isPending}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="harvest"
            disabled={isSubmitting || updateFarm.isPending}
            className="gap-2 px-6"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting || updateFarm.isPending ? "Updating..." : "Save Changes"}</span>
          </Button>
        </div>
      </form>
    </div>
  );
};
