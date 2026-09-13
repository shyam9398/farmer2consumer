import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  Layers,
  Image as ImageIcon,
  History,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { VerificationRejectDialog } from "@/components/admin/VerificationRejectDialog";
import { VerificationHistoryTable } from "@/components/admin/VerificationHistoryTable";
import { Button } from "@/components/ui/button";
import {
  useProduceVerificationDetail,
  useApproveProduce,
  useRejectProduce,
} from "@/hooks/useAdmin";

export const ProduceReviewPage: React.FC = () => {
  const { produceId } = useParams<{ produceId: string }>();

  const { data, isLoading, error } = useProduceVerificationDetail(produceId);
  const approveMutation = useApproveProduce();
  const rejectMutation = useRejectProduce();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [approvalNote, setApprovalNote] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminNav />
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading produce inspection dossier...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <AdminNav />
        <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="p-4 bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 rounded-2xl inline-block">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Produce Listing Not Found
          </h2>
          <p className="text-xs text-slate-500">
            The requested produce lot does not exist or has been deleted.
          </p>
          <Link to="/admin/produce">
            <Button variant="outline" className="rounded-xl mt-2">
              Back to Inspection Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const {
    produce,
    farmer_id,
    farmer_name,
    farmer_verification_status,
    farmer_location,
    farm,
    images,
    history,
  } = data;

  const isFarmerVerified = farmer_verification_status === "VERIFIED";
  const hasPhotos = images && images.length > 0;
  const canApprove =
    produce.status === "PENDING_VERIFICATION" && isFarmerVerified && hasPhotos;

  const handleApprove = async () => {
    if (!produceId) return;
    setActionError(null);
    try {
      await approveMutation.mutateAsync({
        produceId,
        payload: { notes: approvalNote.trim() || undefined },
      });
      setShowApprovalModal(false);
      setApprovalNote("");
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Approval failed.");
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!produceId) return;
    await rejectMutation.mutateAsync({
      produceId,
      payload: { reason },
    });
  };

  const activeImage = images && images.length > 0 ? images[selectedImageIndex] : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back navigation & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/admin/produce"
            className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Produce Queue
          </Link>

          <div className="flex items-center space-x-3">
            {produce.status !== "APPROVED" && (
              <Button
                onClick={() => setShowApprovalModal(true)}
                disabled={!canApprove || approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs px-4 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve for Listing
              </Button>
            )}

            {produce.status !== "REJECTED" && (
              <Button
                onClick={() => setIsRejectOpen(true)}
                disabled={rejectMutation.isPending}
                variant="outline"
                className="border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs px-4"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Reject Produce Lot
              </Button>
            )}
          </div>
        </div>

        {/* Warning Banners if Approval Pre-conditions are unmet */}
        {!isFarmerVerified && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Farmer Profile Verification Required
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  This produce lot cannot be approved for public trading because the originating
                  farmer ({farmer_name}) is currently in <span className="font-semibold uppercase">{farmer_verification_status}</span> status.
                  Inspect and verify the farmer first.
                </p>
              </div>
            </div>
            <Link to={`/admin/farmers/${farmer_id}`}>
              <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs shrink-0">
                Verify Farmer First
              </Button>
            </Link>
          </div>
        )}

        {!hasPhotos && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-center space-x-3 text-rose-800 dark:text-rose-200 text-xs font-medium">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>
              This listing has zero photos attached. A produce lot must have at least one clear photograph before it can be verified for marketplace trading.
            </span>
          </div>
        )}

        {actionError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Main Content Layout: Gallery + Specs (Left), Farmer & Farm Details (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Gallery & Lot Specifications */}
          <div className="lg:col-span-2 space-y-6">
            {/* High Resolution Gallery Viewer */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center">
                    <ImageIcon className="w-5 h-5 mr-2 text-emerald-600" />
                    Produce Media Gallery ({images?.length || 0} Photos)
                  </h3>
                  <p className="text-xs text-slate-500">
                    High-resolution photographs uploaded by farmer for visual quality appraisal
                  </p>
                </div>
                {activeImage?.is_primary && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Primary Listing Photo
                  </span>
                )}
              </div>

              {/* Main Photo View */}
              {activeImage ? (
                <div className="space-y-3">
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <img
                      src={activeImage.public_url || activeImage.image_url}
                      alt={activeImage.file_name || produce.product_name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Thumbnail Row */}
                  {images.length > 1 && (
                    <div className="flex space-x-3 overflow-x-auto pb-2">
                      {images.map((img, idx) => (
                        <button
                          key={img.id}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                            selectedImageIndex === idx
                              ? "border-emerald-600 ring-2 ring-emerald-500/30 scale-105"
                              : "border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={img.public_url || img.image_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Image Metadata Bar */}
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-1">
                    <span>File: {activeImage.file_name || "photo.jpg"}</span>
                    <span>
                      Type: {activeImage.mime_type || "image/jpeg"} • Size:{" "}
                      {activeImage.file_size
                        ? `${(activeImage.file_size / 1024).toFixed(1)} KB`
                        : "Standard"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    No images uploaded
                  </p>
                  <p className="text-[11px] text-slate-400">
                    The farmer has not yet uploaded photographs for this produce lot.
                  </p>
                </div>
              )}
            </div>

            {/* Lot Specifications & Commercial Terms */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 uppercase">
                      {produce.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      ID: {produce.id}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {produce.product_name}
                  </h1>
                  {produce.variety && (
                    <p className="text-xs text-slate-500">
                      Variety: <span className="font-semibold text-slate-700 dark:text-slate-300">{produce.variety}</span>
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                    Expected Price
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    ₹{produce.expected_price}
                    <span className="text-xs font-normal text-slate-500">
                      {" "}/ {produce.price_unit.replace("PER_", "")}
                    </span>
                  </p>
                </div>
              </div>

              {/* Grid of Key Attributes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Total Lot Quantity</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {produce.total_quantity} {produce.quantity_unit}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Min Order Qty (MOQ)</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {produce.minimum_order_quantity} {produce.quantity_unit}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Quality Grade</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {produce.quality_grade.replace("_", " ")}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-1">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Harvest Date</span>
                  <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    {produce.harvest_date ? new Date(produce.harvest_date).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>

              {/* Description */}
              {produce.description && (
                <div className="space-y-1.5 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Farmer Notes / Harvest Description:
                  </span>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-800/30 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {produce.description}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Farmer & Farm Origin Dossier */}
          <div className="space-y-6">
            {/* Origin Farmer Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <ShieldCheck className="w-4 h-4 mr-1.5 text-emerald-600" />
                Originating Farmer
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {farmer_name}
                  </span>
                  {farmer_verification_status === "VERIFIED" ? (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Verified
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      {farmer_verification_status}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-400" />
                  {farmer_location}
                </p>

                <Link to={`/admin/farmers/${farmer_id}`} className="block">
                  <Button variant="outline" size="sm" className="w-full rounded-xl text-xs mt-2">
                    Inspect Farmer Dossier
                  </Button>
                </Link>
              </div>
            </div>

            {/* Farm Parcel Card */}
            {farm && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Layers className="w-4 h-4 mr-1.5 text-emerald-600" />
                  Cultivation Parcel
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Farm Name</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {farm.farm_name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Total Area</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {farm.total_area} {farm.area_unit}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500">Soil Type</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {farm.soil_type || "Standard"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Irrigation</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {farm.irrigation_type || "Standard"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quality Checklist Card */}
            <div className="bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/40 p-5 space-y-2.5 text-xs text-emerald-900 dark:text-emerald-300">
              <h4 className="font-bold flex items-center text-xs">
                <Info className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                Inspector Guidelines
              </h4>
              <ul className="space-y-1.5 list-disc list-inside text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                <li>Verify photo clearly displays the produce lot and packaging.</li>
                <li>Check that expected price is aligned with current mandi MSP benchmarks.</li>
                <li>Ensure harvest date aligns with perishable shelf life.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Verification History Section */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <History className="w-5 h-5 mr-2 text-slate-600" />
              Produce Decision History
            </h2>
            <span className="text-xs text-slate-400">
              Log of all state transitions and administrator reviews
            </span>
          </div>

          <VerificationHistoryTable records={history} />
        </div>
      </main>

      {/* Approve Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Approve Produce Listing
                </h3>
                <p className="text-xs text-slate-500">
                  Publish {produce.product_name} to direct buyer marketplace.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Optional Inspection Note
              </label>
              <textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Quality photos verified against Grade A specifications."
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowApprovalModal(false)}
                disabled={approveMutation.isPending}
                className="rounded-xl text-xs"
              >
                Cancel
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs"
              >
                {approveMutation.isPending ? "Approving..." : "Confirm & Publish"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      <VerificationRejectDialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        onConfirm={handleRejectConfirm}
        title="Reject Produce Lot"
        entityName={produce.product_name}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
};
