import React, { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  DollarSign,
  Edit2,
  Globe,
  Loader2,
  MapPin,
  Send,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProduceStatusBadge } from "@/components/produce/ProduceStatusBadge";
import { ProduceImageUploader } from "@/components/produce/ProduceImageUploader";
import { DeleteProduceDialog } from "@/components/produce/DeleteProduceDialog";
import {
  useDeleteProduce,
  useProduceDetail,
  useSubmitProduce,
  usePublishProduce,
} from "@/hooks/useProduce";

export const ProduceDetailPage: React.FC = () => {
  const { produceId } = useParams<{ produceId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isJustCreated = searchParams.get("created") === "true";

  const { data: produce, isLoading, isError } = useProduceDetail(produceId);

  const deleteMutation = useDeleteProduce();
  const submitMutation = useSubmitProduce();
  const publishMutation = usePublishProduce();

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        <p className="text-sm text-slate-400">Loading produce lot details...</p>
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

  const isDraftOrRejected =
    produce.status === "DRAFT" || produce.status === "REJECTED";

  const totalQty = Number(produce.total_quantity) || 0;
  const availQty = Number(produce.available_quantity) || 0;
  const reservedQty = Number(produce.reserved_quantity) || 0;
  const soldQty = Number(produce.sold_quantity) || 0;
  const availPct = totalQty > 0 ? Math.round((availQty / totalQty) * 100) : 0;

  const handleSubmit = async () => {
    setActionError(null);
    setActionSuccess(null);

    if (!produce.images || produce.images.length === 0) {
      setActionError("Please upload at least 1 photo showing the produce lot before submitting.");
      return;
    }

    try {
      await submitMutation.mutateAsync(produce.id);
      setActionSuccess("Produce lot has been submitted for verification!");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to submit produce for verification.");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(produce.id);
      navigate("/farmer/produce");
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to delete produce lot.");
    }
  };

  const handlePublish = async () => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await publishMutation.mutateAsync(produce.id);
      setActionSuccess("Produce lot published successfully! It is now live on Mandi Direct Marketplace.");
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Failed to publish produce lot.");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-6 max-w-6xl">
      {/* Back link */}
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Link
          to="/farmer/produce"
          className="flex items-center gap-1 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to My Produce Lots
        </Link>
      </div>

      {/* Just created prompt */}
      {isJustCreated && produce.status === "DRAFT" && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-emerald-200">Produce Lot Saved as Draft!</h4>
            <p className="mt-0.5">
              Upload at least 1 photo below to show crop quality and packaging, then click{" "}
              <strong className="text-emerald-100">"Submit for Verification"</strong> to proceed.
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-in fade-in">
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold animate-in fade-in">
          {actionError}
        </div>
      )}

      {/* Header Banner */}
      <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-border/80">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ProduceStatusBadge status={produce.status} />
            <Badge
              variant="outline"
              className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-xs font-semibold"
            >
              {produce.category}
            </Badge>
            <Badge variant="secondary" className="text-xs font-medium">
              Grade: {produce.quality_grade.replace("_", " ")}
            </Badge>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {produce.product_name}
            {produce.variety && (
              <span className="text-slate-400 font-normal text-xl ml-2">
                ({produce.variety})
              </span>
            )}
          </h1>

          {produce.farm_name && (
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              <span>Grown at: <strong>{produce.farm_name}</strong></span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isDraftOrRejected && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/farmer/produce/${produce.id}/edit`)}
                className="border-slate-700 hover:bg-slate-800 text-xs"
              >
                <Edit2 className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                Edit Details
              </Button>

              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !produce.images || produce.images.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow"
                title={
                  !produce.images || produce.images.length === 0
                    ? "Upload at least 1 photo first"
                    : "Submit for Admin Verification"
                }
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    Submit for Verification
                  </>
                )}
              </Button>

              {produce.status === "DRAFT" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsDeleteOpen(true)}
                  className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-9 w-9"
                  title="Delete Draft"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </>
          )}

          {produce.status === "PENDING_VERIFICATION" && (
            <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <Clock className="h-4 w-4 text-amber-400 animate-pulse" />
              <span>Verification under review by Mandi Admin</span>
            </div>
          )}

          {produce.status === "APPROVED" && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 p-2 px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Verified by Admin</span>
              </div>
              <Button
                size="sm"
                onClick={handlePublish}
                disabled={publishMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1.5 shadow-md shadow-emerald-950/40"
              >
                {publishMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Globe className="h-3.5 w-3.5" />
                    Publish to Marketplace
                  </>
                )}
              </Button>
            </div>
          )}

          {produce.status === "LISTED" && (
            <Link to={`/marketplace/products/${produce.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/10 text-xs gap-1.5 font-semibold"
              >
                <Globe className="h-3.5 w-3.5 text-emerald-400" />
                <span>View in Marketplace</span>
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Review Notes Alert if Rejected */}
      {produce.status === "REJECTED" && produce.verification_notes && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-rose-200">Changes Requested by Verification Team</h4>
            <p className="text-slate-300">{produce.verification_notes}</p>
            <p className="text-slate-400 pt-1">
              Please update the requested details or photos, then click "Submit for Verification" again.
            </p>
          </div>
        </div>
      )}

      {/* Photos & Gallery Section */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Camera className="h-4 w-4 text-emerald-400" />
              Produce Photos & Verification Media
            </CardTitle>
            {produce.images && produce.images.length > 0 && (
              <Badge
                variant="outline"
                className="text-xs font-mono border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
              >
                {produce.images.length} Photos
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Hero Viewer if produce has images */}
          {produce.images && produce.images.length > 0 && (() => {
            const sorted = [...produce.images].sort((a, b) => {
              const oA = a.display_order ?? a.sort_order ?? 0;
              const oB = b.display_order ?? b.sort_order ?? 0;
              return oA - oB;
            });
            const safeIndex = Math.min(selectedImageIndex, sorted.length - 1);
            const activePhoto = sorted[safeIndex] || sorted[0];
            const activeUrl = activePhoto?.public_url || activePhoto?.image_url;

            return (
              <div className="space-y-3">
                {/* Hero Box */}
                <div className="relative aspect-[16/9] md:aspect-[21/9] w-full rounded-2xl overflow-hidden bg-slate-950 border border-border/80 shadow-2xl flex items-center justify-center group">
                  <img
                    src={activeUrl}
                    alt={activePhoto.file_name || "Produce lot hero"}
                    className="w-full h-full object-cover transition-all duration-300"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {activePhoto.is_primary && (
                      <Badge className="bg-emerald-600/90 backdrop-blur border border-emerald-400/30 text-white font-bold text-xs flex items-center gap-1 shadow-lg">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        Primary Cover Photo
                      </Badge>
                    )}
                    <Badge variant="secondary" className="bg-slate-900/80 backdrop-blur text-[11px] text-slate-300">
                      Photo {safeIndex + 1} of {sorted.length}
                    </Badge>
                  </div>

                  {/* Metadata bottom pill */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-black/60 backdrop-blur-md rounded-xl px-3 py-1.5 text-xs text-slate-200">
                    <span className="font-mono truncate max-w-[200px]">
                      {activePhoto.file_name || `photo_${safeIndex + 1}`}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-slate-300 font-mono">
                      {activePhoto.width && activePhoto.height && (
                        <span>{activePhoto.width} × {activePhoto.height} px</span>
                      )}
                      {activePhoto.file_size && (
                        <span>• {(activePhoto.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                      )}
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  {sorted.length > 1 && (
                    <>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : sorted.length - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-80 hover:opacity-100 transition-opacity"
                        title="Previous photo"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => setSelectedImageIndex((prev) => (prev < sorted.length - 1 ? prev + 1 : 0))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white opacity-80 hover:opacity-100 transition-opacity"
                        title="Next photo"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {sorted.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {sorted.map((item, idx) => {
                      const itemUrl = item.public_url || item.image_url;
                      const isSelected = idx === safeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative h-14 w-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                            isSelected
                              ? "border-emerald-400 ring-2 ring-emerald-500/40 scale-105"
                              : "border-border/60 opacity-60 hover:opacity-100 hover:border-slate-400"
                          }`}
                        >
                          <img
                            src={itemUrl}
                            alt={`Thumbnail ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {item.is_primary && (
                            <div className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-emerald-600 text-white">
                              <Star className="h-2 w-2 fill-amber-300 text-amber-300" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* Interactive Photo Management */}
          <div className="pt-2 border-t border-border/40">
            <ProduceImageUploader
              produceId={produce.id}
              images={produce.images || []}
              readOnly={!isDraftOrRejected}
            />
          </div>
        </CardContent>
      </Card>

      {/* Grid: Inventory & Pricing vs Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory & Pricing Terms */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-400" />
              Pricing & Inventory Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* Price Badge */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
              <div>
                <p className="text-[11px] text-emerald-400 uppercase font-semibold">
                  Expected Price
                </p>
                <h3 className="text-2xl font-bold text-emerald-300 font-mono">
                  ₹{Number(produce.expected_price).toLocaleString("en-IN")}{" "}
                  <span className="text-xs text-slate-300 font-normal">
                    /{produce.price_unit.replace("PER_", "").toLowerCase()}
                  </span>
                </h3>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-slate-400 uppercase font-semibold">Minimum Order</p>
                <p className="text-sm font-bold text-slate-200 font-mono">
                  {Number(produce.minimum_order_quantity)} {produce.quantity_unit}
                </p>
              </div>
            </div>

            {/* Inventory Bar */}
            <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Available Stock</span>
                <span className="font-bold text-white font-mono">
                  {availQty.toLocaleString()} / {totalQty.toLocaleString()}{" "}
                  {produce.quantity_unit}
                </span>
              </div>
              <Progress value={availPct} className="h-2 bg-slate-800" />
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/30 text-center text-[11px]">
                <div>
                  <p className="text-slate-400">Available</p>
                  <p className="font-bold text-emerald-400 font-mono">{availQty} {produce.quantity_unit}</p>
                </div>
                <div>
                  <p className="text-slate-400">Reserved</p>
                  <p className="font-bold text-amber-400 font-mono">{reservedQty} {produce.quantity_unit}</p>
                </div>
                <div>
                  <p className="text-slate-400">Sold</p>
                  <p className="font-bold text-purple-400 font-mono">{soldQty} {produce.quantity_unit}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Harvest Dates & Origin Details */}
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-400" />
              Harvest & Origin Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-secondary/30 border border-border/40">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Harvest Date
                </p>
                <p className="font-semibold text-slate-200 mt-0.5">{produce.harvest_date}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Available From
                </p>
                <p className="font-semibold text-slate-200 mt-0.5">{produce.available_from}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Available Until (Shelf Life)
                </p>
                <p className="font-semibold text-slate-200 mt-0.5">
                  {produce.available_until || "Open fulfillment"}
                </p>
              </div>
            </div>

            {produce.description && (
              <div className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1">
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Description & Quality Notes
                </p>
                <p className="text-slate-300 leading-relaxed">{produce.description}</p>
              </div>
            )}

            {/* Audit Dates */}
            <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
              <p>Lot Created: {new Date(produce.created_at).toLocaleDateString()}</p>
              {produce.submitted_at && (
                <p>Submitted: {new Date(produce.submitted_at).toLocaleString()}</p>
              )}
              {produce.approved_at && (
                <p>Approved: {new Date(produce.approved_at).toLocaleString()}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <DeleteProduceDialog
        isOpen={isDeleteOpen}
        produce={produce}
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
