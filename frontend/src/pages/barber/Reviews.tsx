import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import toast from "react-hot-toast";
import { shopService } from "../../services/shop.service";
import { ReviewCard } from "../../components/common/ReusableCards";
import { Shop } from "../../types";

export default function BarberReviews() {
  const [replyingTo, setReplyingTo] = useState<string | number | null>(null);
  const [reply, setReply] = useState("");
  const [shops, setShops] = useState<Shop[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllReviews = async () => {
      try {
        const myShops = await shopService.getMyShops();
        setShops(myShops);
        
        const allReviews = await Promise.all(
          myShops.map(shop => shopService.getShopReviews(shop.id))
        );
        
        setReviews(allReviews.flat());
      } catch (err) {
        console.error("Failed to fetch reviews", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllReviews();
  }, []);

  const avgRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const handleReply = (reviewId: string | number) => {
    if (reply.trim()) {
      toast.success(`Reply posted to review #${reviewId}: ${reply}`);
      setReply("");
      setReplyingTo(null);
    }
  };

  if (loading) {
     return (
        <PageLayoutDesktop variant="barber">
           <PageContainerDesktop className="flex items-center justify-center min-h-[60vh]">
              <div className="text-gold text-xl animate-pulse font-serif tracking-widest uppercase">Syncing Client Logs</div>
           </PageContainerDesktop>
        </PageLayoutDesktop>
     );
  }

  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="xl" className="px-8 py-12">
        <PageHeader 
           title="Reputation Archive" 
           subtitle="The collective voice of your clientele across all locations." 
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 mt-12 items-start">
           <Card className="lg:col-span-1 p-8 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl overflow-hidden text-center sticky top-12">
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-3xl rounded-full" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-8">Performance Metric</p>
              <div className="flex flex-col items-center">
                 <div className="text-6xl font-bold font-serif text-white tracking-tighter mb-4 flex items-center gap-3">
                    {avgRating.toFixed(1)}
                    <Icon icon="star" className="text-gold" size={32} />
                 </div>
                 <p className="text-xs font-medium text-cream/60 uppercase tracking-widest leading-relaxed">Based on {reviews.length} authentic encounters.</p>
              </div>
           </Card>

           <div className="lg:col-span-3 space-y-8 mb-20">
              {reviews.map((review) => (
                <div key={review.id} className="relative group">
                   <ReviewCard 
                      review={{
                        ...review,
                        customerName: review.customer_name || "Discerning Client",
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.id}`
                      }} 
                   />
                   
                   <div className="mt-4 px-10">
                      {replyingTo === review.id ? (
                        <Card className="p-8 bg-black/20 border-gold/10 rounded-[32px] animate-fade-in">
                          <textarea
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Draft your artisanal response..."
                            className="w-full px-6 py-6 bg-cocoa/30 border border-white/5 rounded-2xl focus:outline-none focus:border-gold/30 text-white resize-none placeholder-cream/20 font-medium text-sm transition-all mb-6 h-32"
                          />
                          <div className="flex gap-4">
                            <Button
                              variant="primary"
                              onClick={() => handleReply(review.id)}
                              className="px-8 py-3 !rounded-xl text-[9px] font-black uppercase tracking-widest"
                            >
                              Dispatch Response 
                            </Button>
                            <Button
                              variant="secondary"
                              onClick={() => setReplyingTo(null)}
                              className="px-8 py-3 !rounded-xl text-[9px] font-black uppercase tracking-widest"
                            >
                              Discard
                            </Button>
                          </div>
                        </Card>
                      ) : (
                        <button
                          onClick={() => setReplyingTo(review.id)}
                          className="flex items-center gap-2 text-[10px] font-black text-gold/60 hover:text-gold uppercase tracking-[0.3em] transition-all group-hover:translate-x-2"
                        >
                          Address Critique <Icon icon="arrow-right" size={14} />
                        </button>
                      )}
                   </div>
                </div>
              ))}

              {reviews.length === 0 && (
                 <Card className="text-center py-40 bg-transparent border-dashed border-white/10 flex flex-col items-center rounded-[40px]">
                    <Icon icon="star" size={64} className="text-white/20 mb-8" />
                    <h3 className="text-3xl font-serif text-white mb-4 uppercase tracking-tighter">Silence in the Halls</h3>
                    <p className="text-cream/50 max-w-sm font-medium tracking-wide uppercase text-[10px] leading-relaxed">Collect critiques and accolades from your clientele as visits commence.</p>
                 </Card>
              )}
           </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
