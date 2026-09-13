import React from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Droplets,
  Layers,
  Sprout,
  Edit2,
  Trash2,
  Compass,
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Farm } from "@/types/farmer";

interface FarmCardProps {
  farm: Farm;
  onDelete: (farm: Farm) => void;
}

export const FarmCard: React.FC<FarmCardProps> = ({ farm, onDelete }) => {
  return (
    <Card className="glass-card hover:border-emerald-500/40 transition-all duration-200 flex flex-col justify-between group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-semibold">
                {farm.ownership_type}
              </Badge>
              <Badge variant="secondary" className="text-xs font-mono font-bold bg-secondary/80 text-white">
                {farm.total_area} {farm.area_unit}
              </Badge>
            </div>
            <CardTitle className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
              {farm.farm_name}
            </CardTitle>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
          <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
          <span>
            {farm.village}, {farm.mandal}, {farm.district}, {farm.state} - {farm.pincode}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-3.5 text-xs text-slate-300 flex-1">
        {/* Agricultural Attributes */}
        <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-lg bg-secondary/30 border border-border/40">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-amber-400/80 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Soil Type</p>
              <p className="font-medium text-slate-200">{farm.soil_type || "Not Specified"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-cyan-400/80 shrink-0" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Irrigation</p>
              <p className="font-medium text-slate-200">{farm.irrigation_type || "Not Specified"}</p>
            </div>
          </div>
        </div>

        {/* Primary Crops */}
        {farm.primary_crops && farm.primary_crops.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase mb-1.5 flex items-center gap-1">
              <Sprout className="h-3 w-3 text-emerald-400" />
              <span>Primary Crops</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {farm.primary_crops.map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* GPS Coordinates if available */}
        {farm.latitude && farm.longitude && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Compass className="h-3.5 w-3.5 text-teal-400" />
            <span className="font-mono">
              {farm.latitude.toFixed(4)}° N, {farm.longitude.toFixed(4)}° E
            </span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400">
          Added {new Date(farm.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-2">
          <Link to={`/farmer/farms/${farm.id}/edit`}>
            <Button variant="ghost" size="sm" className="h-8 px-2.5 text-slate-300 hover:text-white hover:bg-secondary/60">
              <Edit2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
              <span>Edit</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(farm)}
            className="h-8 px-2.5 text-slate-300 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 text-rose-400" />
            <span>Delete</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
