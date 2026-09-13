import React, { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressCard } from "@/components/address/AddressCard";
import { AddressFormModal } from "@/components/address/AddressFormModal";
import {
  useBuyerAddresses,
  useDeleteAddress,
  useSetDefaultAddress,
} from "@/hooks/useAddresses";
import { BuyerAddress } from "@/types/order";

export const BuyerAddressesPage: React.FC = () => {
  const { data: addresses, isLoading, error } = useBuyerAddresses();
  const deleteMutation = useDeleteAddress();
  const setDefaultMutation = useSetDefaultAddress();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addressToEdit, setAddressToEdit] = useState<BuyerAddress | null>(null);

  const handleOpenAdd = () => {
    setAddressToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (addr: BuyerAddress) => {
    setAddressToEdit(addr);
    setIsModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12 max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <MapPin className="w-7 h-7 text-emerald-400" />
            <span>Delivery Addresses</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage your saved warehouse and wholesale retail dispatch addresses.
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenAdd}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Address</span>
        </Button>
      </div>

      {/* Addresses Grid / Empty state */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-slate-900/60 rounded-xl border border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center space-y-3">
          <p className="text-xs text-rose-400">Failed to load delivery addresses.</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="text-xs">
            Retry
          </Button>
        </div>
      ) : !addresses || addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-4 max-w-md mx-auto">
          <MapPin className="w-10 h-10 text-slate-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">No delivery addresses saved</h3>
            <p className="text-xs text-slate-400">
              Save your primary mandi yard, cold storage facility, or retail warehouse location to speed up wholesale checkout.
            </p>
          </div>
          <Button
            onClick={handleOpenAdd}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Delivery Address</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <AddressCard
              key={addr.id}
              address={addr}
              onEdit={handleOpenEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onSetDefault={(id) => setDefaultMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      <AddressFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        addressToEdit={addressToEdit}
      />
    </div>
  );
};
