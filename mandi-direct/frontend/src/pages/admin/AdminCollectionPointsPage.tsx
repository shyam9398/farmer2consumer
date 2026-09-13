import React, { useState } from "react";
import {
  Building,
  Plus,
  Search,
  MapPin,
  Phone,
  Edit2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  useCollectionPoints,
  useCreateCollectionPoint,
  useUpdateCollectionPoint,
  useDeleteCollectionPoint,
} from "@/hooks/useLogistics";
import { CollectionPoint, CollectionPointCreate } from "@/types/logistics";

export const AdminCollectionPointsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPoint, setEditingPoint] = useState<CollectionPoint | null>(null);

  const [formData, setFormData] = useState<CollectionPointCreate>({
    name: "",
    description: "",
    address: "",
    village: "",
    mandal: "",
    district: "",
    state: "Telangana",
    pincode: "",
    contact_name: "",
    contact_phone: "",
    is_active: true,
  });
  const [formError, setFormError] = useState("");

  const { data, isLoading } = useCollectionPoints({
    search: searchTerm || undefined,
    district: districtFilter || undefined,
  });

  const createMutation = useCreateCollectionPoint();
  const updateMutation = useUpdateCollectionPoint();
  const deleteMutation = useDeleteCollectionPoint();

  const handleOpenCreate = () => {
    setEditingPoint(null);
    setFormData({
      name: "",
      description: "",
      address: "",
      village: "",
      mandal: "",
      district: "",
      state: "Telangana",
      pincode: "",
      contact_name: "",
      contact_phone: "",
      is_active: true,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (point: CollectionPoint) => {
    setEditingPoint(point);
    setFormData({
      name: point.name,
      description: point.description || "",
      address: point.address,
      village: point.village || "",
      mandal: point.mandal || "",
      district: point.district,
      state: point.state,
      pincode: point.pincode,
      contact_name: point.contact_name,
      contact_phone: point.contact_phone,
      is_active: point.is_active,
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.address || !formData.district || !formData.pincode || !formData.contact_name || !formData.contact_phone) {
      setFormError("Please fill out all mandatory fields.");
      return;
    }

    if (!/^\d{6}$/.test(formData.pincode)) {
      setFormError("Pincode must be exactly 6 digits.");
      return;
    }

    try {
      setFormError("");
      if (editingPoint) {
        await updateMutation.mutateAsync({
          id: editingPoint.id,
          data: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.response?.data?.detail || "Failed to save collection point.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove collection point "${name}"?`)) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err) {
        console.error("Failed to delete collection point:", err);
      }
    }
  };

  const handleToggleActive = async (point: CollectionPoint) => {
    try {
      await updateMutation.mutateAsync({
        id: point.id,
        data: { is_active: !point.is_active },
      });
    } catch (err) {
      console.error("Failed to toggle status:", err);
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Building className="w-7 h-7 text-emerald-400" />
            <span>Produce Aggregation Centers</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage physical collection points & FPO aggregation hubs for batch logistics dispatch.
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 self-start sm:self-auto font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>Add Collection Point</span>
        </Button>
      </div>

      <AdminNav />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by hub name, village, or district..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <input
          type="text"
          placeholder="Filter by district (e.g. Medak)"
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="sm:w-60 px-3.5 py-2 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Collection Points Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <Building className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No Collection Points</h3>
            <p className="text-xs text-slate-400">
              Create physical aggregation hubs to allow multi-farmer batch pickup.
            </p>
          </div>
          <Button onClick={handleOpenCreate} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            + Create First Hub
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.items.map((point) => (
            <Card
              key={point.id}
              className="glass-card border-border/60 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-base">{point.name}</h3>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(point)}
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                          point.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-slate-800 text-slate-400 border-slate-700"
                        }`}
                      >
                        {point.is_active ? "Active" : "Inactive"}
                      </button>
                    </div>
                    {point.description && (
                      <p className="text-xs text-slate-400">{point.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(point)}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(point.id, point.name)}
                      className="h-8 w-8 p-0 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <p className="flex items-start gap-1.5 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      {point.address}, {point.village ? `${point.village}, ` : ""}{point.district}, {point.state} — {point.pincode}
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5 text-slate-300">
                    <Phone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>{point.contact_name} ({point.contact_phone})</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal Dialog for Create/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" />
                <span>{editingPoint ? "Edit Collection Point" : "Create Collection Point"}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Center Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Medak Central FPO Aggregation Hub"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. Cold storage aggregate hub with 50MT capacity"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Street Address *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Plot 5, Industrial Area, Near Highway"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Village / Town</label>
                  <input
                    type="text"
                    placeholder="Medak Town"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Mandal</label>
                  <input
                    type="text"
                    placeholder="Medak"
                    value={formData.mandal}
                    onChange={(e) => setFormData({ ...formData, mandal: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">District *</label>
                  <input
                    type="text"
                    required
                    placeholder="Medak"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="Telangana"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="502110"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contact Person *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ramesh Sharma"
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Contact Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+919440011223"
                    value={formData.contact_phone}
                    onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                    className="w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-slate-800 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="is_active" className="text-slate-300 font-semibold">Active for aggregation pickup scheduling</label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Hub"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminCollectionPointsPage;
