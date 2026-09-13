import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  User,
  MapPin,
  Camera,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  Navigation,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  useFarmerProfile,
  useCreateFarmerProfile,
  useUpdateFarmerProfile,
  useUploadFarmerPhoto,
} from "@/hooks/useFarmer";
import {
  farmerProfileSchema,
  FarmerProfileFormValues,
} from "@/schemas/farmer";
import { VerificationBadge } from "@/components/farmer/VerificationBadge";
import { ProfileCompletionCard } from "@/components/farmer/ProfileCompletionCard";
import { FarmerReviewsCard } from "@/components/farmer/FarmerReviewsCard";
import { VoiceInputButton } from "@/components/common/VoiceInputButton";
import { useFarmerLocation } from "@/hooks/useFarmerLocation";

export const FarmerProfilePage: React.FC = () => {
  const { profile: userProfile } = useAuth();
  const { t } = useLanguage();
  const { data: farmerProfile, isLoading } = useFarmerProfile();
  const createProfile = useCreateFarmerProfile();
  const updateProfile = useUpdateFarmerProfile();
  const uploadPhoto = useUploadFarmerPhoto();
  const { coordinates, isDetecting, detectLocation, error: locationError } = useFarmerLocation();

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FarmerProfileFormValues>({
    resolver: zodResolver(farmerProfileSchema),
    defaultValues: {
      full_name: userProfile?.full_name || "",
      phone: userProfile?.phone || "",
      date_of_birth: "",
      gender: undefined,
      address_line: "",
      village: "",
      mandal: "",
      district: "",
      state: "",
      pincode: "",
    },
  });

  // Pre-fill form when profile loads
  useEffect(() => {
    if (farmerProfile) {
      reset({
        full_name: farmerProfile.full_name || userProfile?.full_name || "",
        phone: farmerProfile.phone || userProfile?.phone || "",
        date_of_birth: farmerProfile.date_of_birth || "",
        gender: (farmerProfile.gender as any) || undefined,
        address_line: farmerProfile.address_line || "",
        village: farmerProfile.village || "",
        mandal: farmerProfile.mandal || "",
        district: farmerProfile.district || "",
        state: farmerProfile.state || "",
        pincode: farmerProfile.pincode || "",
      });
      if (farmerProfile.profile_photo_url) {
        setPhotoPreview(farmerProfile.profile_photo_url);
      }
    } else if (userProfile) {
      reset({
        full_name: userProfile.full_name || "",
        phone: userProfile.phone || "",
        date_of_birth: "",
        address_line: "",
        village: "",
        mandal: "",
        district: "",
        state: "",
        pincode: "",
      });
    }
  }, [farmerProfile, userProfile, reset]);

  const handleDetectGPS = async () => {
    const coords = await detectLocation();
    if (coords) {
      setFeedback({
        type: "success",
        message: `${t.farmerProfile.locationDetected}: (${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)})`,
      });
    }
  };

  const onSubmit = async (values: FarmerProfileFormValues) => {
    setFeedback(null);
    try {
      if (farmerProfile) {
        await updateProfile.mutateAsync({
          full_name: values.full_name,
          phone: values.phone || undefined,
          date_of_birth: values.date_of_birth || undefined,
          gender: values.gender || undefined,
          address_line: values.address_line,
          village: values.village,
          mandal: values.mandal,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        });
        setFeedback({ type: "success", message: t.farmerProfile.success });
      } else {
        await createProfile.mutateAsync({
          full_name: values.full_name,
          phone: values.phone || undefined,
          date_of_birth: values.date_of_birth || undefined,
          gender: values.gender || undefined,
          address_line: values.address_line,
          village: values.village,
          mandal: values.mandal,
          district: values.district,
          state: values.state,
          pincode: values.pincode,
        });
        setFeedback({ type: "success", message: t.farmerProfile.success });
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail || err.message || t.common.error;
      setFeedback({ type: "error", message: errorMsg });
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);

    if (!farmerProfile) {
      setFeedback({
        type: "error",
        message: "Please save your profile address details before uploading an avatar photo.",
      });
      return;
    }

    try {
      await uploadPhoto.mutateAsync(file);
      setFeedback({ type: "success", message: "Profile photo uploaded successfully!" });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err?.response?.data?.detail || "Failed to upload photo. Max 5MB allowed.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">{t.common.loading}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-5xl">
      {/* Header with Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <VerificationBadge
              status={farmerProfile?.verification_status || "PENDING"}
              notes={farmerProfile?.verification_notes}
              showNotesInline
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white">{t.farmerProfile.title}</h1>
          <p className="text-sm text-slate-300 mt-1">
            {t.farmerProfile.subtitle}
          </p>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium transition-all ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {locationError && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{locationError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Summary */}
        <div className="space-y-6">
          <Card className="glass-card text-center p-6 space-y-4">
            <div className="relative mx-auto w-28 h-28">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-emerald-500/40 bg-secondary/80 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Farmer Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-14 w-14 text-emerald-400/60" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-md transition-transform hover:scale-105"
                title="Upload photo"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoSelect}
                  disabled={uploadPhoto.isPending}
                />
              </label>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                {farmerProfile?.full_name || userProfile?.full_name || "Kisan"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{userProfile?.email}</p>
              <p className="text-xs text-emerald-400 font-medium mt-1">
                {farmerProfile?.phone || userProfile?.phone || "No phone registered"}
              </p>
            </div>

            {coordinates && (
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-left text-xs text-slate-300 space-y-1">
                <span className="font-semibold text-emerald-400 block">{t.farmerProfile.coordinates}:</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {coordinates.latitude.toFixed(5)}, {coordinates.longitude.toFixed(5)}
                </span>
              </div>
            )}

            <div className="pt-2 border-t border-border/40 text-left space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Account Status:</span>
                <span className="font-semibold text-emerald-400">{userProfile?.status || "ACTIVE"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Registered:</span>
                <span>
                  {userProfile?.created_at
                    ? new Date(userProfile.created_at).toLocaleDateString()
                    : "Recently"}
                </span>
              </div>
            </div>
          </Card>

          <ProfileCompletionCard
            percentage={farmerProfile?.profile_completion_pct ?? 0}
            isComplete={farmerProfile?.is_profile_complete ?? false}
            hasProfile={Boolean(farmerProfile)}
          />
        </div>

        {/* Right Column: Profile Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit(onSubmit)}>
            <Card className="glass-card space-y-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-400" />
                  <span>{t.farmerProfile.personalDetails}</span>
                </CardTitle>
                <CardDescription className="text-xs text-slate-400">
                  {t.farmerProfile.subtitle}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Personal Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 border-b border-border/40 pb-1.5">
                    {t.farmerProfile.personalDetails}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="full_name" className="text-xs text-slate-300">
                          {t.farmerProfile.fullName} <span className="text-emerald-400">*</span>
                        </Label>
                        <VoiceInputButton
                          onResult={(text) => setValue("full_name", text)}
                          promptLabel={t.farmerProfile.fullName}
                          size="sm"
                        />
                      </div>
                      <Input
                        id="full_name"
                        placeholder="e.g. Ramesh Kumar"
                        {...register("full_name")}
                      />
                      {errors.full_name && (
                        <p className="text-xs text-rose-400">{errors.full_name.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone" className="text-xs text-slate-300">
                          {t.farmerProfile.phone} <span className="text-emerald-400">*</span>
                        </Label>
                        <VoiceInputButton
                          onResult={(text) => setValue("phone", text.replace(/\D/g, ''))}
                          promptLabel={t.farmerProfile.phone}
                          size="sm"
                        />
                      </div>
                      <Input
                        id="phone"
                        placeholder="e.g. +919876543210"
                        {...register("phone")}
                      />
                      {errors.phone && (
                        <p className="text-xs text-rose-400">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="date_of_birth" className="text-xs text-slate-300">
                        Date of Birth
                      </Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        {...register("date_of_birth")}
                      />
                      {errors.date_of_birth && (
                        <p className="text-xs text-rose-400">{errors.date_of_birth.message}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="gender" className="text-xs text-slate-300">
                        Gender
                      </Label>
                      <select
                        id="gender"
                        className="flex h-10 w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent"
                        {...register("gender")}
                      >
                        <option value="">Select Gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                      {errors.gender && (
                        <p className="text-xs text-rose-400">{errors.gender.message}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location Section */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-border/40 pb-1.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{t.farmerProfile.locationDetails}</span>
                    </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDetectGPS}
                      disabled={isDetecting}
                      className="text-xs h-7 gap-1 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                    >
                      <Navigation className={`h-3 w-3 ${isDetecting ? 'animate-spin' : ''}`} />
                      <span>{isDetecting ? t.common.loading : t.farmerProfile.detectLocation}</span>
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="address_line" className="text-xs text-slate-300">
                        Address / Street / Landmark <span className="text-emerald-400">*</span>
                      </Label>
                      <VoiceInputButton
                        onResult={(text) => setValue("address_line", text)}
                        promptLabel="Address details"
                        size="sm"
                      />
                    </div>
                    <Textarea
                      id="address_line"
                      rows={2}
                      placeholder="e.g. Door No. 3-45, Near Gram Panchayat Office"
                      {...register("address_line")}
                    />
                    {errors.address_line && (
                      <p className="text-xs text-rose-400">{errors.address_line.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="village" className="text-xs text-slate-300">
                          {t.farmerProfile.village} <span className="text-emerald-400">*</span>
                        </Label>
                        <VoiceInputButton
                          onResult={(text) => setValue("village", text)}
                          promptLabel={t.farmerProfile.village}
                          size="sm"
                        />
                      </div>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="mandal" className="text-xs text-slate-300">
                          Mandal / Taluka <span className="text-emerald-400">*</span>
                        </Label>
                        <VoiceInputButton
                          onResult={(text) => setValue("mandal", text)}
                          promptLabel="Mandal"
                          size="sm"
                        />
                      </div>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="district" className="text-xs text-slate-300">
                          {t.farmerProfile.district} <span className="text-emerald-400">*</span>
                        </Label>
                        <VoiceInputButton
                          onResult={(text) => setValue("district", text)}
                          promptLabel={t.farmerProfile.district}
                          size="sm"
                        />
                      </div>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="state" className="text-xs text-slate-300">
                          {t.farmerProfile.state} <span className="text-emerald-400">*</span>
                        </Label>
                        <VoiceInputButton
                          onResult={(text) => setValue("state", text)}
                          promptLabel={t.farmerProfile.state}
                          size="sm"
                        />
                      </div>
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
                        {t.farmerProfile.pincode} <span className="text-emerald-400">*</span>
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
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                  <Button
                    type="submit"
                    variant="harvest"
                    disabled={isSubmitting || createProfile.isPending || updateProfile.isPending}
                    className="gap-2 px-6 shadow-md"
                  >
                    <Save className="h-4 w-4" />
                    <span>
                      {isSubmitting || createProfile.isPending || updateProfile.isPending
                        ? t.farmerProfile.saving
                        : t.farmerProfile.saveProfile}
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Verified Buyer Reviews & Rating */}
          {farmerProfile && (
            <FarmerReviewsCard
              farmerProfileId={farmerProfile.id}
              farmerName={farmerProfile.full_name}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerProfilePage;
