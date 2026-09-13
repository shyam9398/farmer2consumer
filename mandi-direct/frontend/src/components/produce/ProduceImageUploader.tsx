import React, { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Expand,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Star,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  useDeleteProduceImage,
  useReorderProduceImages,
  useSetPrimaryProduceImage,
  useUploadProduceImage,
} from "@/hooks/useProduce";
import { PendingUploadImage, ProduceImage } from "@/types/produce";

interface ProduceImageUploaderProps {
  produceId?: string;
  images?: ProduceImage[];
  readOnly?: boolean;
  stagedFiles?: PendingUploadImage[];
  onStagedFilesChange?: (files: PendingUploadImage[]) => void;
  maxFiles?: number;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB (Phase 5 requirement)
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const ProduceImageUploader: React.FC<ProduceImageUploaderProps> = ({
  produceId,
  images = [],
  readOnly = false,
  stagedFiles = [],
  onStagedFilesChange,
  maxFiles = 5,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewModalUrl, setPreviewModalUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<PendingUploadImage[]>([]);

  // Mutations
  const uploadMutation = useUploadProduceImage(produceId || "");
  const deleteMutation = useDeleteProduceImage(produceId || "");
  const setPrimaryMutation = useSetPrimaryProduceImage(produceId || "");
  const reorderMutation = useReorderProduceImages(produceId || "");

  // Sort server images by display_order ASC
  const sortedImages = [...images].sort((a, b) => {
    const orderA = a.display_order ?? a.sort_order ?? 0;
    const orderB = b.display_order ?? b.sort_order ?? 0;
    return orderA - orderB;
  });

  const totalImageCount = sortedImages.length + stagedFiles.length + uploadQueue.length;
  const maxReached = totalImageCount >= maxFiles;

  const formatBytes = (bytes?: number | null): string => {
    if (!bytes || bytes <= 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return `"${file.name}" has unsupported format. Only JPEG, PNG, or WebP allowed.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `"${file.name}" is ${formatBytes(file.size)}, exceeding the 10MB limit.`;
    }
    return null;
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0 || readOnly) return;
    setErrorMsg(null);

    const remainingSlots = maxFiles - (sortedImages.length + stagedFiles.length + uploadQueue.length);
    if (remainingSlots <= 0) {
      setErrorMsg(`Maximum of ${maxFiles} photos allowed per produce listing.`);
      return;
    }

    const incoming = Array.from(files).slice(0, remainingSlots);

    // Staging mode (e.g. AddProducePage before produceId exists)
    if (!produceId && onStagedFilesChange) {
      const newStaged: PendingUploadImage[] = [];
      for (const file of incoming) {
        const validationError = validateFile(file);
        if (validationError) {
          setErrorMsg(validationError);
          continue;
        }
        newStaged.push({
          id: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 100,
          status: "SELECTED",
        });
      }
      onStagedFilesChange([...stagedFiles, ...newStaged]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Direct Upload mode (produceId exists)
    for (const file of incoming) {
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMsg(validationError);
        continue;
      }

      const tempId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const previewUrl = URL.createObjectURL(file);

      const pendingItem: PendingUploadImage = {
        id: tempId,
        file,
        previewUrl,
        progress: 10,
        status: "UPLOADING",
      };

      setUploadQueue((prev) => [...prev, pendingItem]);

      try {
        await uploadMutation.mutateAsync({
          file,
          onProgress: (percent) => {
            setUploadQueue((prev) =>
              prev.map((item) =>
                item.id === tempId ? { ...item, progress: Math.max(10, percent) } : item
              )
            );
          },
        });

        // Remove from upload queue upon successful mutation
        setUploadQueue((prev) => prev.filter((item) => item.id !== tempId));
        URL.revokeObjectURL(previewUrl);
      } catch (err: any) {
        const errorDetail =
          err?.response?.data?.detail || "Upload failed. Please check network or file format.";
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? { ...item, status: "FAILED", errorMessage: errorDetail, progress: 0 }
              : item
          )
        );
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRetryUpload = async (failedItem: PendingUploadImage) => {
    if (!produceId) return;
    setErrorMsg(null);

    setUploadQueue((prev) =>
      prev.map((item) =>
        item.id === failedItem.id
          ? { ...item, status: "UPLOADING", progress: 15, errorMessage: undefined }
          : item
      )
    );

    try {
      await uploadMutation.mutateAsync({
        file: failedItem.file,
        onProgress: (percent) => {
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === failedItem.id ? { ...item, progress: Math.max(15, percent) } : item
            )
          );
        },
      });

      setUploadQueue((prev) => prev.filter((item) => item.id !== failedItem.id));
      URL.revokeObjectURL(failedItem.previewUrl);
    } catch (err: any) {
      const errorDetail = err?.response?.data?.detail || "Retry upload failed.";
      setUploadQueue((prev) =>
        prev.map((item) =>
          item.id === failedItem.id
            ? { ...item, status: "FAILED", errorMessage: errorDetail }
            : item
        )
      );
    }
  };

  const handleDismissUploadQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const found = prev.find((item) => item.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleRemoveStaged = (id: string) => {
    if (!onStagedFilesChange) return;
    const item = stagedFiles.find((s) => s.id === id);
    if (item) URL.revokeObjectURL(item.previewUrl);
    onStagedFilesChange(stagedFiles.filter((s) => s.id !== id));
  };

  const handleDeleteServerImage = async (imageId: string) => {
    if (!produceId || readOnly) return;
    setErrorMsg(null);
    setDeletingId(imageId);
    try {
      await deleteMutation.mutateAsync(imageId);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to delete image.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!produceId || readOnly) return;
    setErrorMsg(null);
    try {
      await setPrimaryMutation.mutateAsync(imageId);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to set primary cover photo.");
    }
  };

  const handleMoveOrder = async (index: number, direction: "left" | "right") => {
    if (!produceId || readOnly || sortedImages.length <= 1) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sortedImages.length) return;

    const newImages = [...sortedImages];
    const [moved] = newImages.splice(index, 1);
    newImages.splice(targetIndex, 0, moved);

    const reorderedIds = newImages.map((img) => img.id);

    try {
      await reorderMutation.mutateAsync(reorderedIds);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to save photo reorder.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!readOnly && !maxReached) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!readOnly && !maxReached) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/40">
        <div>
          <h4 className="text-sm font-semibold text-white flex items-center gap-2">
            <Camera className="h-4 w-4 text-emerald-400" />
            Produce Lot Photos
            <Badge
              variant="outline"
              className={`text-[11px] px-2 py-0 font-mono font-medium ${
                totalImageCount >= 1
                  ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                  : "border-amber-500/40 text-amber-300 bg-amber-500/10"
              }`}
            >
              {totalImageCount} / {maxFiles}
            </Badge>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Upload 1 to 5 clear photos showing crop quality, harvest maturity, and packaging. (Max 10MB, JPEG/PNG/WebP).
          </p>
        </div>

        {!readOnly && !maxReached && (
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadMutation.isPending || reorderMutation.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs shadow-sm self-start sm:self-auto"
          >
            <UploadCloud className="h-3.5 w-3.5 mr-1.5" />
            Add Photos
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFilesSelected(e.target.files)}
        disabled={readOnly || maxReached}
      />

      {/* Error alert */}
      {errorMsg && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="flex-1">{errorMsg}</span>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Main Grid: Server Images + Upload Queue + Staged Files */}
      {totalImageCount > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {/* 1. Server-persisted images */}
          {sortedImages.map((img, idx) => {
            const isCover = img.is_primary;
            const isDeleting = deletingId === img.id;
            const displayUrl = img.public_url || img.image_url;

            return (
              <div
                key={img.id}
                className={`relative group rounded-xl overflow-hidden border bg-slate-900/80 aspect-square flex flex-col justify-between transition-all duration-200 shadow-md ${
                  isCover
                    ? "border-emerald-500 ring-2 ring-emerald-500/30 shadow-emerald-950/40"
                    : "border-border/70 hover:border-slate-600"
                }`}
              >
                {/* Photo Image with smooth scale on hover */}
                <img
                  src={displayUrl}
                  alt={img.file_name || `Produce photo ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
                  onClick={() => setPreviewModalUrl(displayUrl)}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />

                {/* Primary Cover Badge */}
                {isCover && (
                  <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-emerald-600/95 text-white text-[10px] px-2 py-0.5 font-bold shadow-md backdrop-blur border border-emerald-400/40 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                      Primary Cover
                    </Badge>
                  </div>
                )}

                {/* Metadata Pill (dimensions & size) on hover */}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 pt-4 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center justify-between text-[10px] text-slate-300">
                  <span className="truncate max-w-[90px] font-mono">
                    {img.file_name || `photo_${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
                    {img.width && img.height && (
                      <span>{img.width}×{img.height}</span>
                    )}
                    {img.file_size && <span>• {formatBytes(img.file_size)}</span>}
                  </div>
                </div>

                {/* Action Overlay */}
                {!readOnly && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                    {/* Top row: Reorder arrows */}
                    <div className="flex items-center justify-between">
                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 rounded-full bg-slate-800/90 text-white hover:bg-slate-700 disabled:opacity-30 shadow"
                        disabled={idx === 0 || reorderMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveOrder(idx, "left");
                        }}
                        title="Move left"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </Button>

                      <Button
                        type="button"
                        size="icon"
                        variant="secondary"
                        className="h-7 w-7 rounded-full bg-slate-800/90 text-white hover:bg-slate-700 disabled:opacity-30 shadow"
                        disabled={idx === sortedImages.length - 1 || reorderMutation.isPending}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveOrder(idx, "right");
                        }}
                        title="Move right"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    {/* Center row: View fullscreen */}
                    <div className="flex justify-center">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-black/40 text-slate-200 hover:text-white hover:bg-black/70"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewModalUrl(displayUrl);
                        }}
                        title="View Fullsize"
                      >
                        <Expand className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Bottom row: Set Primary & Delete */}
                    <div className="flex items-center justify-between gap-1">
                      {!isCover ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 text-[11px] px-2 rounded-md bg-emerald-950/90 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-500/40"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetPrimary(img.id);
                          }}
                          disabled={setPrimaryMutation.isPending}
                        >
                          <Star className="h-3 w-3 mr-1" /> Set Cover
                        </Button>
                      ) : (
                        <div />
                      )}

                      <Button
                        type="button"
                        size="icon"
                        variant="destructive"
                        className="h-7 w-7 rounded-md bg-rose-950/90 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40"
                        title="Delete photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteServerImage(img.id);
                        }}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* 2. Uploading Queue Items */}
          {uploadQueue.map((item) => (
            <div
              key={item.id}
              className={`relative rounded-xl overflow-hidden border aspect-square flex flex-col justify-between p-3 bg-slate-900/90 ${
                item.status === "FAILED"
                  ? "border-rose-500/60 bg-rose-950/20"
                  : "border-emerald-500/50"
              }`}
            >
              <img
                src={item.previewUrl}
                alt="Upload preview"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
              />

              <div className="relative z-10 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-[10px] px-1.5 py-0 font-medium ${
                    item.status === "FAILED"
                      ? "border-rose-500 text-rose-300 bg-rose-500/20"
                      : "border-emerald-500 text-emerald-300 bg-emerald-500/20"
                  }`}
                >
                  {item.status === "FAILED" ? "Failed" : "Uploading"}
                </Badge>

                <button
                  type="button"
                  onClick={() => handleDismissUploadQueueItem(item.id)}
                  className="text-slate-400 hover:text-white p-0.5 rounded"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative z-10 space-y-1.5 text-center">
                {item.status === "FAILED" ? (
                  <div className="space-y-2">
                    <p className="text-[11px] text-rose-300 line-clamp-2">
                      {item.errorMessage || "Upload failed"}
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleRetryUpload(item)}
                      className="h-6 text-[10px] px-2 bg-rose-600 hover:bg-rose-500 text-white font-medium"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Retry
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300">
                      <span>{item.progress}%</span>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    </div>
                    <Progress value={item.progress} className="h-1.5 bg-slate-800" />
                    <p className="text-[10px] text-slate-300 truncate max-w-full">
                      {item.file.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 3. Staged Pre-submission Files (AddProducePage) */}
          {stagedFiles.map((staged, sIdx) => (
            <div
              key={staged.id}
              className="relative group rounded-xl overflow-hidden border border-emerald-500/60 bg-slate-900/80 aspect-square flex flex-col justify-between"
            >
              <img
                src={staged.previewUrl}
                alt={staged.file.name}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-2 left-2">
                <Badge className="bg-emerald-600 text-white text-[10px] px-1.5 py-0 font-semibold shadow">
                  {sIdx === 0 ? "Cover (Preview)" : `Photo ${sIdx + 1}`}
                </Badge>
              </div>

              <div className="absolute bottom-0 inset-x-0 p-2 bg-black/70 flex items-center justify-between text-[10px] text-slate-200">
                <span className="truncate max-w-[80px] font-mono">{staged.file.name}</span>
                <span className="text-slate-400 font-mono">{formatBytes(staged.file.size)}</span>
              </div>

              {!readOnly && (
                <button
                  type="button"
                  onClick={() => handleRemoveStaged(staged.id)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-rose-900/80 text-white hover:bg-rose-600 shadow"
                  title="Remove staged photo"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          {/* 4. Add more slot button if slots remain */}
          {!readOnly && !maxReached && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`rounded-xl border-2 border-dashed aspect-square flex flex-col items-center justify-center p-3 cursor-pointer transition-all duration-200 ${
                isDragging
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 scale-[0.98]"
                  : "border-border/60 hover:border-emerald-500/50 hover:bg-slate-800/40 text-slate-400 hover:text-emerald-400"
              }`}
            >
              <div className="p-2.5 rounded-full bg-slate-800/80 border border-border/50 mb-1.5">
                <UploadCloud className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xs font-semibold">Add Photo</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Up to 10MB</span>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onClick={() => (!readOnly ? fileInputRef.current?.click() : null)}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
            readOnly
              ? "border-border/40 text-slate-500"
              : isDragging
              ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 scale-[0.99] cursor-pointer"
              : "border-border/70 hover:border-emerald-500/60 hover:bg-slate-800/30 cursor-pointer text-slate-400"
          }`}
        >
          <div className="flex justify-center mb-3">
            <div className="p-3.5 rounded-full bg-slate-800/80 border border-border shadow-inner">
              <ImageIcon className="h-8 w-8 text-emerald-400" />
            </div>
          </div>
          <h4 className="text-sm font-semibold text-slate-100">
            {readOnly ? "No photos uploaded for this lot" : "Click to select or drag and drop photos here"}
          </h4>
          {!readOnly && (
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Supports JPEG, PNG, and WebP (up to 10MB per photo). At least 1 photo is required to submit for verification.
            </p>
          )}
        </div>
      )}

      {/* Lightbox / Fullscreen Modal */}
      {previewModalUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewModalUrl(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewModalUrl(null)}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-black/60 hover:bg-black text-white"
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={previewModalUrl}
              alt="Full produce preview"
              className="max-h-[85vh] w-auto object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
