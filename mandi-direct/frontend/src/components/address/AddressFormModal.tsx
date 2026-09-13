import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, MapPin, Save, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BuyerAddress } from "@/types/order";
import { buyerAddressSchema, BuyerAddressFormValues } from "@/schemas/address";
import { useCreateAddress, useUpdateAddress } from "@/hooks/useAddresses";

interface AddressFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  addressToEdit?: BuyerAddress | null;
  onSuccess?: (address: BuyerAddress) => void;
}

export const AddressFormModal: React.FC<AddressFormModalProps> = ({
  isOpen,
  onClose,
  addressToEdit,
  onSuccess,
}) => {
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BuyerAddressFormValues>({
    resolver: zodResolver(buyerAddressSchema),
    defaultValues: {
      full_name: "",
      phone: "",
      address_line1: "",
      address_line2: "",
      village: "",
      mandal: "",
      district: "",
      state: "",
      pincode: "",
      landmark: "",
      is_default: false,
    },
  });

  useEffect(() => {
    if (addressToEdit) {
      reset({
        full_name: addressToEdit.full_name,
        phone: addressToEdit.phone,
        address_line1: addressToEdit.address_line1,
        address_line2: addressToEdit.address_line2 || "",
        village: addressToEdit.village || "",
        mandal: addressToEdit.mandal || "",
        district: addressToEdit.district,
        state: addressToEdit.state,
        pincode: addressToEdit.pincode,
        landmark: addressToEdit.landmark || "",
        is_default: addressToEdit.is_default,
      });
    } else {
      reset({
        full_name: "",
        phone: "",
        address_line1: "",
        address_line2: "",
        village: "",
        mandal: "",
        district: "",
        state: "",
        pincode: "",
        landmark: "",
        is_default: false,
      });
    }
  }, [addressToEdit, reset]);

  if (!isOpen) return null;

  const onSubmit = async (values: BuyerAddressFormValues) => {
    try {
      if (addressToEdit) {
        const updated = await updateMutation.mutateAsync({
          id: addressToEdit.id,
          payload: values,
        });
        if (onSuccess) onSuccess(updated);
      } else {
        const created = await createMutation.mutateAsync(values);
        if (onSuccess) onSuccess(created);
      }
      onClose();
    } catch (err) {
      console.error("Failed to save address:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {addressToEdit ? "Edit Delivery Address" : "Add New Delivery Address"}
              </h3>
              <p className="text-xs text-slate-400">
                Where should the farmer dispatch your wholesale produce?
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Recipient Full Name *</Label>
              <Input
                placeholder="e.g. Ramesh Reddy"
                {...register("full_name")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9"
              />
              {errors.full_name && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.full_name.message}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Mobile Phone *</Label>
              <Input
                placeholder="10-digit phone (e.g. 9876543210)"
                {...register("phone")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9"
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Address Line 1 (Street / Warehouse / Door) *</Label>
            <Input
              placeholder="e.g. Warehouse 4B, Wholesale Mandi Yard, Autonagar"
              {...register("address_line1")}
              className="bg-slate-950/60 border-slate-800 text-xs h-9"
            />
            {errors.address_line1 && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {errors.address_line1.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Address Line 2 (Optional)</Label>
            <Input
              placeholder="e.g. Near Industrial Estate Gate"
              {...register("address_line2")}
              className="bg-slate-950/60 border-slate-800 text-xs h-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Village / Town</Label>
              <Input
                placeholder="e.g. Kothur"
                {...register("village")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Mandal / Taluk</Label>
              <Input
                placeholder="e.g. Shadnagar"
                {...register("mandal")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">District *</Label>
              <Input
                placeholder="e.g. Ranga Reddy"
                {...register("district")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9"
              />
              {errors.district && (
                <p className="text-[11px] text-rose-400">{errors.district.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">State *</Label>
              <Input
                placeholder="e.g. Telangana"
                {...register("state")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9"
              />
              {errors.state && (
                <p className="text-[11px] text-rose-400">{errors.state.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">6-Digit PIN *</Label>
              <Input
                placeholder="e.g. 500034"
                maxLength={6}
                {...register("pincode")}
                className="bg-slate-950/60 border-slate-800 text-xs h-9 font-mono"
              />
              {errors.pincode && (
                <p className="text-[11px] text-rose-400">{errors.pincode.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Prominent Landmark (Optional)</Label>
            <Input
              placeholder="e.g. Opposite Cold Storage Facility #3"
              {...register("landmark")}
              className="bg-slate-950/60 border-slate-800 text-xs h-9"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="is_default"
              {...register("is_default")}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500"
            />
            <Label htmlFor="is_default" className="text-xs text-slate-300 cursor-pointer">
              Set as my default shipping address
            </Label>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 font-semibold"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? "Saving..." : "Save Address"}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
