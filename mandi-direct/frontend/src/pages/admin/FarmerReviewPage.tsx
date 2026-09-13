import React, { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  Mail,
  Layers,
  History,
  AlertTriangle,
} from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { VerificationRejectDialog } from "@/components/admin/VerificationRejectDialog";
import { VerificationHistoryTable } from "@/components/admin/VerificationHistoryTable";
import { Button } from "@/components/ui/button";
import {
  useFarmerVerificationDetail,
  useApproveFarmer,
  useRejectFarmer,
} from "@/hooks/useAdmin";

export const FarmerReviewPage: React.FC = () => {
  const { farmerId } = useParams<{ farmerId: string }>();

  const { data, isLoading, error } = useFarmerVerificationDetail(farmerId);
  const approveMutation = useApproveFarmer();
  const rejectMutation = useRejectFarmer();

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
          <p className="text-sm text-slate-500">Loading farmer verification dossier...</p>
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
            Farmer Profile Not Found
          </h2>
          <p className="text-xs text-slate-500">
            The requested farmer ID does not exist or has been removed from the platform.
          </p>
          <Link to="/admin/farmers">
            <Button variant="outline" className="rounded-xl mt-2">
              Back to Verification Queue
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const { farmer, farms, history } = data;

  const handleApprove = async () => {
    if (!farmerId) return;
    setActionError(null);
    try {
      await approveMutation.mutateAsync({
        farmerId,
        payload: { notes: approvalNote.trim() || undefined },
      });
      setShowApprovalModal(false);
      setApprovalNote("");
    } catch (err: any) {
      setActionError(err?.response?.data?.detail || "Approval failed.");
    }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!farmerId) return;
    await rejectMutation.mutateAsync({
      farmerId,
      payload: { reason },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <AdminNav />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Back navigation & Quick Actions bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/admin/farmers"
            className="inline-flex items-center text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Farmer Queue
          </Link>

          <div className="flex items-center space-x-3">
            {farmer.verification_status !== "VERIFIED" && (
              <Button
                onClick={() => setShowApprovalModal(true)}
                disabled={approveMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm text-xs px-4"
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Approve Farmer
              </Button>
            )}

            {farmer.verification_status !== "REJECTED" && (
              <Button
                onClick={() => setIsRejectOpen(true)}
                disabled={rejectMutation.isPending}
                variant="outline"
                className="border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl text-xs px-4"
              >
                <XCircle className="w-4 h-4 mr-1.5" /> Reject Application
              </Button>
            )}
          </div>
        </div>

        {actionError && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-medium flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Farmer Profile Dossier Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center space-x-4">
              {farmer.profile_photo_url ? (
                <img
                  src={farmer.profile_photo_url}
                  alt={farmer.full_name}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-200 dark:border-slate-700 shadow-sm"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-extrabold flex items-center justify-center text-2xl border-2 border-emerald-200 dark:border-emerald-800">
                  {farmer.full_name.charAt(0)}
                </div>
              )}
              <div className="space-y-1">
                <div className="flex items-center space-x-2.5">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {farmer.full_name}
                  </h1>
                  {farmer.verification_status === "VERIFIED" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Farmer
                    </span>
                  )}
                  {farmer.verification_status === "REJECTED" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Rejected
                    </span>
                  )}
                  {farmer.verification_status === "PENDING" && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                      <Clock className="w-3.5 h-3.5 mr-1" /> Pending Verification
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                  {farmer.phone && (
                    <span className="flex items-center">
                      <Phone className="w-3.5 h-3.5 mr-1 text-slate-400" /> {farmer.phone}
                    </span>
                  )}
                  <span className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-slate-400" /> {farmer.email}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    ID: {farmer.farmer_id}
                  </span>
                </div>
              </div>
            </div>

            {/* Profile completion badge */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0 text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                Profile Readiness
              </span>
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {farmer.profile_completion_percentage}%
              </span>
            </div>
          </div>

          {/* Demographic and Address Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Demographic & Location Record
              </h3>
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Door / Street Address</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {farmer.village ? `${farmer.village} Area` : "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Village / Town</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {farmer.village}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Mandal / Tehsil</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {farmer.mandal}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">District & State</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {farmer.district}, {farmer.state}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Postal PIN Code</span>
                  <span className="font-medium font-mono text-slate-800 dark:text-slate-200">
                    {farmer.pincode}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Verification Metadata
              </h3>
              <div className="bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Registration Date</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {new Date(farmer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Last Decision Timestamp</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {farmer.verified_at
                      ? new Date(farmer.verified_at).toLocaleString()
                      : "Pending initial review"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500">Verified By Officer</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {farmer.verified_by_name || "—"}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Total Registered Parcels</span>
                  <span className="font-medium font-semibold text-emerald-600">
                    {farms.length} parcel(s)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Farm Parcels */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <Layers className="w-5 h-5 mr-2 text-emerald-600" />
              Registered Farm Parcels ({farms.length})
            </h2>
            <span className="text-xs text-slate-400">
              Verified against state cadastre & village revenue registries
            </span>
          </div>

          {farms.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              No farm parcels registered for this account.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {farms.map((farm) => (
                <div
                  key={farm.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {farm.farm_name}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      {farm.ownership_type}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Total Area
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {farm.total_area} {farm.area_unit}
                      </span>
                    </div>
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Soil & Water
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {farm.soil_type || "Standard"} • {farm.irrigation_type || "Borewell"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    <p>
                      <span className="text-slate-400">Location:</span> {farm.village},{" "}
                      {farm.district}, {farm.state} ({farm.pincode})
                    </p>
                    {farm.primary_crops && farm.primary_crops.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {farm.primary_crops.map((crop, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded"
                          >
                            {crop}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Trail Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center">
              <History className="w-5 h-5 mr-2 text-slate-600" />
              Verification Audit Trail
            </h2>
            <span className="text-xs text-slate-400">
              Immutable record of all review decisions
            </span>
          </div>

          <VerificationHistoryTable records={history} />
        </div>
      </main>

      {/* Approve Modal with Optional Note */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Approve Farmer Profile
                </h3>
                <p className="text-xs text-slate-500">
                  Grant verified farmer privileges for {farmer.full_name}.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Optional Inspection Note / Verification Reference
              </label>
              <textarea
                rows={3}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="e.g. Land documents verified against state revenue portal."
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
                {approveMutation.isPending ? "Approving..." : "Confirm Approval"}
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
        title="Reject Farmer Profile"
        entityName={farmer.full_name}
        isLoading={rejectMutation.isPending}
      />
    </div>
  );
};
