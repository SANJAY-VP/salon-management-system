import { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import { Modal, ConfirmDialog } from "../common/Modal";
import { Icon } from "../common/Icon";
import { reviewService, ReviewResponse, ReviewCreate, ReviewUpdate } from "../../services/review.service";
import toast from "react-hot-toast";

interface ReviewManagementProps {
  shopId: string | number;
  shopName: string;
}

export default function ReviewManagement({ shopId, shopName }: ReviewManagementProps) {
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [myReview, setMyReview] = useState<ReviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchReviews();
  }, [shopId]);

  const fetchReviews = async () => {
    try {
      const [shopReviews, myReviews] = await Promise.all([
        reviewService.getShopReviews(shopId),
        reviewService.getMyReviews()
      ]);
      
      setReviews(shopReviews);
      const userReview = myReviews.find(r => r.shop_id === Number(shopId));
      setMyReview(userReview || null);
      
      if (userReview) {
        setRating(userReview.rating);
        setComment(userReview.comment || "");
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      const reviewData: ReviewCreate = {
        shop_id: Number(shopId),
        rating,
        comment
      };

      const newReview = await reviewService.createReview(reviewData);
      setReviews([newReview, ...reviews]);
      setMyReview(newReview);
      setShowAddModal(false);
      setRating(0);
      setComment("");
      toast.success("Review submitted successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to submit review");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      const updateData: ReviewUpdate = {
        rating,
        comment
      };

      const updatedReview = await reviewService.updateReview(myReview!.id, updateData);
      setReviews(reviews.map(r => r.id === updatedReview.id ? updatedReview : r));
      setMyReview(updatedReview);
      setShowEditModal(false);
      toast.success("Review updated successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update review");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    setLoading(true);
    try {
      await reviewService.deleteReview(myReview!.id);
      setReviews(reviews.filter(r => r.id !== myReview!.id));
      setMyReview(null);
      setRating(0);
      setComment("");
      toast.success("Review deleted successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (currentRating: number, interactive = false) => {
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && setRating(star)}
            disabled={!interactive}
            className={`transition-all duration-300 ${
              interactive ? "cursor-pointer hover:scale-125" : "cursor-default"
            }`}
          >
            <Icon 
              icon="star" 
              size={18} 
              className={`${star <= currentRating ? "text-gold" : "text-white/10"}`} 
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
        <div className="text-gold/60 text-sm font-medium animate-pulse">Loading reviews...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-cream">Customer Reviews</h2>
        {myReview ? (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowEditModal(true)}
            >
              Edit My Review
            </Button>
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(true)}
              className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            >
              Delete My Review
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            Write a Review
          </Button>
        )}
      </div>

      {myReview && (
        <Card className="p-6 mb-6 bg-gold/5 border-gold/20">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-bold text-cream mb-2">Your Review</h3>
              {renderStars(myReview.rating)}
            </div>
            <span className="text-xs text-cream/50">
              {new Date(myReview.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="text-cream/80">{myReview.comment}</p>
        </Card>
      )}

      {reviews.length === 0 && !myReview ? (
        <Card className="text-center py-12">
          <h3 className="text-xl text-cream mb-4">No reviews yet</h3>
          <p className="text-cream/60 mb-6">Be the first to review {shopName}</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {(myReview ? reviews.filter(r => r.id !== myReview.id) : reviews).map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-bold text-cream">{review.user?.full_name || "Anonymous"}</h4>
                  {renderStars(review.rating)}
                </div>
                <span className="text-xs text-cream/50">
                  {new Date(review.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-cream/80">{review.comment}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Add Review Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Write a Review"
      >
        <form onSubmit={handleSubmitReview} className="space-y-4">
          <div>
            <label className="block text-cream font-medium mb-2">Rating</label>
            {renderStars(rating, true)}
          </div>
          <div>
            <label className="block text-cream font-medium mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience at this salon..."
              className="w-full px-4 py-3 bg-coffee/20 border border-white/10 rounded-lg text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-coffee/30 transition-colors resize-none"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Review Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Your Review"
      >
        <form onSubmit={handleUpdateReview} className="space-y-4">
          <div>
            <label className="block text-cream font-medium mb-2">Rating</label>
            {renderStars(rating, true)}
          </div>
          <div>
            <label className="block text-cream font-medium mb-2">Your Review</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience at this salon..."
              className="w-full px-4 py-3 bg-coffee/20 border border-white/10 rounded-lg text-cream placeholder-cream/40 focus:outline-none focus:border-gold/50 focus:bg-coffee/30 transition-colors resize-none"
              rows={4}
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowEditModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Updating..." : "Update Review"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Review"
        message="Are you sure you want to delete your review? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        onConfirm={() => { setShowDeleteConfirm(false); handleDeleteReview(); }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
