import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { slotService } from "../../services/slot.service";
import { bookingService } from "../../services/booking.service";
import { serviceService } from "../../services/service.service";
import { useShopStore } from "../../hooks/useShopStore";
import { useAuthStore } from "../../hooks/useAuthStore";
import { TimeSlot } from "../../types";
import { useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const slotId = searchParams.get("slotId");
  const shopId = searchParams.get("shopId");

  const { user } = useAuthStore();
  const { selectedShop, fetchShopById } = useShopStore();
  
  const [slot, setSlot] = useState<TimeSlot | null>(null);
  const [firstServiceId, setFirstServiceId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (shopId && !selectedShop) fetchShopById(shopId);
  }, [shopId, selectedShop, fetchShopById]);

  useEffect(() => {
    const fetchData = async () => {
      if (!slotId || !shopId) return;
      try {
        const [slots, services] = await Promise.all([
          slotService.getShopSlots(shopId),
          serviceService.getShopServices(shopId),
        ]);
        const foundSlot = slots.find((s) => s.id.toString() === slotId.toString());
        setSlot(foundSlot || null);
        if (services.length > 0) setFirstServiceId(services[0].id);
      } catch {
        toast.error("Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slotId, shopId]);

  if (loading) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
          <div className="text-gold/60 font-serif tracking-[0.3em] uppercase text-sm animate-pulse">Finalizing Details</div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  if (!slot || !selectedShop) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop className="text-center py-20 px-8">
          <h2 className="text-4xl text-cream font-serif uppercase tracking-widest mb-6">Information Missing</h2>
          <Button onClick={() => navigate("/home")} variant="secondary">Back to Collections</Button>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  const basePrice = slot.price || 0;
  const tax = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + tax;

  const handleConfirm = async () => {
    if (!firstServiceId) {
      toast.error("No services available at this shop. Please contact the owner.");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Confirming your booking...");
    try {
      const response = await bookingService.createBooking({
        slot_id: Number(slot.id),
        service_id: firstServiceId,
        customer_name: user?.name || "Customer",
        customer_phone: user?.phone || "9999999999",
        points_used: 0,
      });
      toast.success("Booking confirmed!", { id: toastId });
      navigate(`/customer/payment?bookingId=${response.id}&amount=${totalPrice}`);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || "Failed to create booking. Please try again.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="xl" className="px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <PageHeader 
            title="Review Selection" 
            subtitle="One final verification before you meet your artisan." 
            onBack={() => navigate(-1)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 items-start">
            <div className="space-y-10">
              <Card className="p-10 bg-coffee/40 border-gold/20 rounded-[40px] shadow-2xl relative overflow-hidden group hover:border-gold/40 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full" />
                <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <h2 className="font-bold font-serif text-2xl text-gold uppercase tracking-tighter">Booking Details</h2>
                  <Icon icon="calendar" size={24} className="text-gold" />
                </div>
                <div className="space-y-6">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Salon</span>
                    <span className="text-xl font-bold text-white font-serif tracking-tight">{selectedShop.name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Address</span>
                    <span className="text-sm font-medium text-cream/70 uppercase tracking-widest">{selectedShop.address}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-white/5 mt-4">
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Date</span>
                        <span className="text-lg font-bold text-white font-serif tracking-tighter">
                          {new Date(slot.date).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                     </div>
                     <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Time</span>
                        <span className="text-lg font-bold text-gold font-serif tracking-tighter uppercase">{(slot.start_time || slot.time || "").slice(0, 5)}</span>
                     </div>
                  </div>
                </div>
              </Card>


            </div>

            <Card className="p-10 bg-coffee/60 backdrop-blur-2xl border-gold/10 rounded-[40px] shadow-2xl relative overflow-hidden">
               <div className="absolute bottom-0 right-0 w-48 h-48 bg-gold/5 blur-3xl rounded-full" />
               <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                  <h2 className="font-bold font-serif text-2xl text-gold uppercase tracking-tighter">Price Summary</h2>
                  <Icon icon="earnings" size={24} className="text-gold" />
               </div>
              <div className="space-y-6 text-xs font-bold uppercase tracking-widest">
                <div className="flex justify-between text-cream/60">
                  <span>Price</span>
                  <span className="text-white">₹{basePrice}</span>
                </div>
                <div className="flex justify-between text-cream/60">
                  <span>Tax (18%)</span>
                  <span className="text-white">₹{tax}</span>
                </div>
                <div className="border-t border-white/5 pt-8 mt-4 flex flex-col gap-2">
                  <span className="text-[10px] text-gold/60 font-black">Total Price</span>
                  <div className="flex justify-between items-end">
                     <span className="text-white/40 text-[10px]">ALL INCLUSIVE</span>
                     <span className="text-5xl font-bold text-white font-serif tracking-tighter">₹{totalPrice}</span>
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col gap-4">
                <Button
                  variant="primary"
                  fullWidth
                  disabled={isSubmitting}
                  onClick={handleConfirm}
                  className="py-6 !rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-gold/20 hover:scale-[1.02] transition-transform active:scale-95 disabled:opacity-20"
                >
                  {isSubmitting ? "BOOKING..." : `Confirm Booking →`}
                </Button>
                <p className="text-center text-[10px] uppercase tracking-widest text-white/30 mt-6 font-bold leading-relaxed px-10">
                   By confirming, you agree to our cancellation policy. 24h notice required for changes.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
