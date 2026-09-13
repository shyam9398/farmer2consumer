import React, { useState } from "react";
import { Star, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/axios";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderItemId: string;
  produceName: string;
  farmerName: string;
  onReviewSubmitted?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderItemId,
  produceName,
  farmerName,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.post(`/orders/${orderId}/items/${orderItemId}/review`, {
        rating,
        comment: comment.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        onReviewSubmitted?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail || "Failed to submit review. Note that only delivered items can be reviewed once."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const ratingDescriptions: Record<number, string> = {
    1: "Poor Quality / Severe Issues",
    2: "Below Average Quality",
    3: "Average / Acceptable Quality",
    4: "Good Quality & Freshness",
    5: "Excellent / Farm Fresh Quality",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <div>
            <h3 className="font-bold text-base text-white">Rate & Review Produce</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {produceName} from {farmerName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-2 text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 animate-bounce" />
            <h4 className="font-bold text-white text-base">Thank you for your feedback!</h4>
            <p className="text-xs text-slate-400">Your verified review has been published.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Star selector */}
            <div className="flex flex-col items-center justify-center space-y-1 py-2">
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        (hoverRating || rating) >= star
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs font-semibold text-emerald-400 mt-1">
                {ratingDescriptions[hoverRating || rating]}
              </p>
            </div>

            {/* Comment Area */}
            <div className="space-y-1.5">
              <label htmlFor="review-comment" className="text-xs font-medium text-slate-300">
                Comments / Feedback (Optional)
              </label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={1000}
                placeholder="Share your experience regarding the crop condition, packaging, freshness..."
                className="bg-slate-950 border-slate-700 text-xs text-white resize-none h-24"
              />
              <div className="text-right text-[10px] text-slate-500">
                {comment.length}/1000
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
              <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
