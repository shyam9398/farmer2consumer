import React, { useState } from "react";
import { ImageOff, Sparkles } from "lucide-react";
import { MarketplaceImage } from "@/types/marketplace";
import { Badge } from "@/components/ui/badge";

interface ProductGalleryProps {
  images: MarketplaceImage[];
  productName: string;
  qualityGrade?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  productName,
  qualityGrade,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hasError, setHasError] = useState<Record<number, boolean>>({});

  const validImages = images || [];
  const activeImage = validImages[selectedIndex];

  const handleImageError = (index: number) => {
    setHasError((prev) => ({ ...prev, [index]: true }));
  };

  const getImageUrl = (img?: MarketplaceImage) => {
    if (!img) return null;
    return img.public_url || img.image_url;
  };

  return (
    <div className="space-y-3">
      {/* Main Image Display */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/60 bg-slate-900 shadow-xl">
        {activeImage && !hasError[selectedIndex] ? (
          <img
            src={getImageUrl(activeImage) || ""}
            alt={`${productName} view ${selectedIndex + 1}`}
            onError={() => handleImageError(selectedIndex)}
            className="h-full w-full object-cover transition-all duration-300"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-slate-500 bg-gradient-to-br from-slate-900 to-slate-950">
            <ImageOff className="h-12 w-12 text-slate-600" />
            <span className="text-sm font-medium text-slate-400">Produce Photo Unavailable</span>
          </div>
        )}

        {/* Quality Grade Badge overlay */}
        {qualityGrade && (
          <div className="absolute top-3 left-3">
            <Badge
              variant="outline"
              className="text-xs font-semibold backdrop-blur-md px-2.5 py-1 border-emerald-500/40 text-emerald-300 bg-emerald-500/10 shadow-md"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              {qualityGrade}
            </Badge>
          </div>
        )}

        {/* Image count pill */}
        {validImages.length > 1 && (
          <div className="absolute bottom-3 right-3 text-xs font-mono px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md border border-border/40 text-slate-300">
            {selectedIndex + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* Thumbnails Row */}
      {validImages.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {validImages.map((img, idx) => {
            const isSelected = selectedIndex === idx;
            const url = getImageUrl(img);

            return (
              <button
                key={img.id || idx}
                onClick={() => setSelectedIndex(idx)}
                className={`relative aspect-square w-16 sm:w-20 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  isSelected
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 scale-95"
                    : "border-border/40 hover:border-slate-500 opacity-70 hover:opacity-100"
                }`}
              >
                {!hasError[idx] && url ? (
                  <img
                    src={url}
                    alt={`${productName} thumbnail ${idx + 1}`}
                    onError={() => handleImageError(idx)}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-slate-800 text-slate-500">
                    <ImageOff className="h-4 w-4" />
                  </div>
                )}
                {img.is_primary && (
                  <span className="absolute top-0.5 right-0.5 h-2 w-2 rounded-full bg-emerald-400" title="Primary Image" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
