import React from "react";
import { Phone, Trash2, Edit2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BuyerAddress } from "@/types/order";

interface AddressCardProps {
  address: BuyerAddress;
  isSelected?: boolean;
  onSelect?: (address: BuyerAddress) => void;
  onEdit?: (address: BuyerAddress) => void;
  onDelete?: (addressId: string) => void;
  onSetDefault?: (addressId: string) => void;
  isSelectable?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
  isSelectable = false,
}) => {
  return (
    <div
      onClick={() => isSelectable && onSelect && onSelect(address)}
      className={`rounded-xl border p-4 sm:p-5 transition-all relative ${
        isSelectable ? "cursor-pointer" : ""
      } ${
        isSelected
          ? "border-emerald-500 bg-emerald-950/20 ring-1 ring-emerald-500 shadow-md shadow-emerald-950/20"
          : "border-border/60 bg-slate-900/60 hover:border-slate-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-white text-sm sm:text-base">
              {address.full_name}
            </h4>
            {address.is_default && (
              <Badge
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 bg-emerald-500/10 text-[10px] font-semibold"
              >
                Default Address
              </Badge>
            )}
            {isSelected && (
              <Badge className="bg-emerald-600 text-white text-[10px] font-semibold">
                Selected
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{address.phone}</span>
          </div>
        </div>

        {/* Action icons */}
        <div
          className="flex items-center gap-1 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {!address.is_default && onSetDefault && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onSetDefault(address.id)}
              className="text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 h-8 w-8 p-0"
              title="Set as Default"
            >
              <Star className="w-3.5 h-3.5" />
            </Button>
          )}

          {onEdit && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(address)}
              className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 w-8 p-0"
              title="Edit Address"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
          )}

          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onDelete(address.id)}
              className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 p-0"
              title="Delete Address"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 text-xs text-slate-300 leading-relaxed space-y-0.5 border-t border-slate-800/80 pt-2.5">
        <p className="font-medium text-slate-200">{address.address_line1}</p>
        {address.address_line2 && <p className="text-slate-400">{address.address_line2}</p>}
        <p className="text-slate-400">
          {[address.village, address.mandal].filter(Boolean).join(", ")}
        </p>
        <p className="font-semibold text-white">
          {address.district}, {address.state} — {address.pincode}
        </p>
        {address.landmark && (
          <p className="text-[11px] text-slate-400 italic">
            Landmark: {address.landmark}
          </p>
        )}
      </div>
    </div>
  );
};
