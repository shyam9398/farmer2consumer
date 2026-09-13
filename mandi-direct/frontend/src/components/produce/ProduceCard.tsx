import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Camera,
  ChevronRight,
  Edit2,
  Globe,
  Image as ImageIcon,
  MapPin,
  Send,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ProduceStatusBadge } from "@/components/produce/ProduceStatusBadge";
import { ProduceListing } from "@/types/produce";

interface ProduceCardProps {
  produce: ProduceListing;
  onDelete?: (produce: ProduceListing) => void;
  onSubmit?: (produce: ProduceListing) => void;
  onPublish?: (produce: ProduceListing) => void;
}

export const ProduceCard: React.FC<ProduceCardProps> = ({
  produce,
  onDelete,
  onSubmit,
  onPublish,
}) => {
  const navigate = useNavigate();

  const isDraftOrRejected =
    produce.status === "DRAFT" || produce.status === "REJECTED";

  const totalQty = Number(produce.total_quantity) || 0;
  const availQty = Number(produce.available_quantity) || 0;
  const availPct = totalQty > 0 ? Math.round((availQty / totalQty) * 100) : 0;

  const primaryImg = produce.images?.find((img) => img.is_primary) || produce.images?.[0];
  const coverUrl = produce.primary_image_url || primaryImg?.public_url || primaryImg?.image_url || null;
  const photoCount = produce.images?.length || 0;

  return (
    <Card className="glass-card hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group overflow-hidden">
      {/* Media & Header */}
      <div className="relative aspect-[16/10] w-full bg-slate-900/80 overflow-hidden border-b border-border/50">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={produce.product_name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 p-4">
            <ImageIcon className="h-10 w-10 mb-1 text-slate-600" />
            <span className="text-xs">No photos uploaded</span>
          </div>
        )}

        {/* Top Badges Overlay */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-start justify-between gap-2">
          <ProduceStatusBadge status={produce.status} />
          <Badge
            variant="secondary"
            className="bg-slate-900/90 text-white backdrop-blur text-[11px] font-semibold border border-white/10"
          >
            {produce.quality_grade.replace("_", " ")}
          </Badge>
        </div>

        {/* Photo Count Pill */}
        {photoCount > 0 && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur border border-white/10 text-white px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-1 shadow">
            <Camera className="h-3 w-3 text-emerald-400" />
            {photoCount} {photoCount === 1 ? "photo" : "photos"}
          </div>
        )}

        {/* Price Tag Overlay */}
        <div className="absolute bottom-2.5 right-2.5 bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 backdrop-blur px-2.5 py-1 rounded-md text-xs font-bold shadow-lg">
          ₹{Number(produce.expected_price).toLocaleString("en-IN")}{" "}
          <span className="text-[10px] text-emerald-400 font-normal">
            /{produce.price_unit.replace("PER_", "").toLowerCase()}
          </span>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/5 font-semibold"
              >
                {produce.category}
              </Badge>
              {produce.farm_name && (
                <span className="flex items-center gap-1 text-slate-400 truncate max-w-[150px]">
                  <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                  {produce.farm_name}
                </span>
              )}
            </div>
            <Link
              to={`/farmer/produce/${produce.id}`}
              className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1"
            >
              {produce.product_name}
            </Link>
            {produce.variety && (
              <p className="text-xs text-slate-400 font-medium">
                Variety: <span className="text-slate-200">{produce.variety}</span>
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-1 space-y-3 flex-1 text-xs text-slate-300">
        {/* Inventory Progress */}
        <div className="space-y-1.5 bg-secondary/30 p-2.5 rounded-lg border border-border/40">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Inventory Status</span>
            <span className="font-bold text-slate-200 font-mono">
              {availQty.toLocaleString()} / {totalQty.toLocaleString()}{" "}
              {produce.quantity_unit}
            </span>
          </div>
          <Progress value={availPct} className="h-1.5 bg-slate-800" />
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>{availPct}% Available</span>
            <span>MOQ: {Number(produce.minimum_order_quantity)} {produce.quantity_unit}</span>
          </div>
        </div>

        {/* Harvest & Available Dates */}
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-slate-500" />
            Harvest: {produce.harvest_date}
          </span>
          <span>Ready: {produce.available_from}</span>
        </div>

        {/* Show rejection notes if rejected */}
        {produce.status === "REJECTED" && produce.verification_notes && (
          <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
            <strong className="text-rose-200">Rejection Reason:</strong>{" "}
            {produce.verification_notes}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-2 border-t border-border/40 flex items-center justify-between gap-2 bg-slate-950/20">
        <Button
          variant="outline"
          size="sm"
          className="text-xs border-slate-700 hover:bg-slate-800 text-slate-300"
          onClick={() => navigate(`/farmer/produce/${produce.id}`)}
        >
          Details
          <ChevronRight className="h-3.5 w-3.5 ml-1" />
        </Button>

        <div className="flex items-center gap-1.5">
          {isDraftOrRejected && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => navigate(`/farmer/produce/${produce.id}/edit`)}
              >
                <Edit2 className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Edit
              </Button>

              {onSubmit && (
                <Button
                  size="sm"
                  className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={() => onSubmit(produce)}
                  disabled={!produce.images || produce.images.length === 0}
                  title={
                    !produce.images || produce.images.length === 0
                      ? "Upload at least 1 photo before submitting"
                      : "Submit for Admin Verification"
                  }
                >
                  <Send className="h-3.5 w-3.5 mr-1" />
                  Submit
                </Button>
              )}

              {onDelete && produce.status === "DRAFT" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                  onClick={() => onDelete(produce)}
                  title="Delete Draft"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}

          {onPublish && produce.status === "APPROVED" && (
            <Button
              size="sm"
              className="h-8 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1"
              onClick={() => onPublish(produce)}
              title="Publish Approved Produce to Marketplace"
            >
              <Globe className="h-3.5 w-3.5" />
              Publish
            </Button>
          )}

          {produce.status === "LISTED" && (
            <Link to={`/marketplace/products/${produce.id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 gap-1"
                title="View in Marketplace"
              >
                <Globe className="h-3.5 w-3.5" />
                View in Market
              </Button>
            </Link>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
