import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import { Tabs } from "../../components/common/Layout";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { ConfirmDialog } from "../../components/common/Modal";
import { bookingService } from "../../services/booking.service";
import { shopService } from "../../services/shop.service";
import { Booking } from "../../types";
import toast from "react-hot-toast";

export default function BarberBookings() {
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<string | number | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const shops = await shopService.getMyShops();
        if (shops.length > 0) {
          const allBookings = await Promise.all(
            shops.map(shop => bookingService.getShopBookings(shop.id))
          );
          setBookings(allBookings.flat());
        }
      } catch {
        toast.error("Failed to load bookings");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const filteredBookings = bookings.filter((b) => {
    if (filter === "all") return true;
    if (filter === "pending") return b.status === "pending" || b.status === "confirmed";
    return b.status === "completed";
  });

  const handleComplete = async (bookingId: string | number) => {
    const toastId = toast.loading("Completing booking...");
    try {
      await bookingService.completeBooking(bookingId, 10);
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "completed" } : b))
      );
      toast.success("Booking marked as completed!", { id: toastId });
    } catch {
      toast.error("Failed to mark as completed", { id: toastId });
    }
  };

  const handleCancel = async (bookingId: string | number) => {
    const toastId = toast.loading("Cancelling...");
    try {
      await bookingService.cancelBooking(bookingId, "Cancelled by owner");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      toast.success("Booking cancelled", { id: toastId });
    } catch {
      toast.error("Failed to cancel booking", { id: toastId });
    }
  };

  const tabs = [
    { id: "all", label: "All Sessions" },
    { id: "pending", label: "Upcoming" },
    { id: "completed", label: "Completed" },
  ];

  if (loading) {
    return (
      <PageLayoutDesktop variant="barber">
        <PageContainerDesktop className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
          <div className="text-gold/60 font-serif tracking-[0.3em] uppercase text-sm animate-pulse">Loading Bookings</div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="xl" className="px-8 py-12">
        <PageHeader 
           title="Session Management" 
           subtitle="Oversee and finalize artisanal encounters across your establishments." 
        />

        <div className="mt-12">
           <Tabs
             tabs={tabs}
             activeTab={filter}
             onTabChange={(tab) => setFilter(tab as "all" | "pending" | "completed")}
           />
        </div>

        <div className="grid grid-cols-1 gap-6 mt-10 mb-20">
          {filteredBookings.length === 0 ? (
            <Card className="text-center py-40 bg-transparent border-dashed border-white/10 flex flex-col items-center rounded-[40px]">
               <Icon icon="calendar" size={64} className="text-white/20 mb-8" />
               <h3 className="text-3xl font-serif text-white mb-4 uppercase tracking-tighter">No Sessions Found</h3>
               <p className="text-cream/50 max-w-sm font-medium tracking-wide uppercase text-[10px] leading-relaxed">The schedule for this category is currently clear.</p>
            </Card>
          ) : (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="p-8 bg-coffee/40 border-gold/10 rounded-[32px] shadow-2xl hover:border-gold/30 transition-all duration-500 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-8 flex-1">
                   <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center text-gold border border-white/5">
                      <div className="text-center">
                         <p className="text-[10px] font-black uppercase leading-none">Session</p>
                         <p className="text-xl font-bold font-serif leading-none mt-1">#{booking.id}</p>
                      </div>
                   </div>
                   <div>
                      <h3 className="text-2xl font-bold font-serif text-white tracking-tighter uppercase mb-1">{booking.customer_name}</h3>
                      <div className="flex items-center gap-4">
                         <span className="text-[10px] font-black text-gold/60 uppercase tracking-widest">Code: {booking.booking_code}</span>
                         <span className="w-1 h-1 rounded-full bg-white/10" />
                         <span className="text-[10px] font-black text-cream/50 uppercase tracking-widest">
                            {new Date(booking.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                         </span>
                      </div>
                   </div>
                </div>

                <div className="flex items-center gap-8">
                   <span
                     className={`inline-block text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-[0.2em] border shadow-2xl ${
                       booking.status === "completed"
                         ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                         : booking.status === "confirmed"
                         ? "bg-gold/10 text-gold border-gold/20"
                         : booking.status === "cancelled"
                         ? "bg-red-500/10 text-red-400 border-red-500/20"
                         : "bg-white/5 text-white/60 border-white/5"
                     }`}
                   >
                     {booking.status}
                   </span>
                   
                   {(booking.status === "confirmed" || booking.status === "pending") && (
                     <div className="flex gap-2">
                       <Button
                         size="sm"
                         variant="primary"
                         className="!rounded-xl px-6 py-3 text-[9px] font-black uppercase tracking-widest"
                         onClick={() => handleComplete(booking.id)}
                       >
                         Complete
                       </Button>
                       <Button
                         size="sm"
                         variant="secondary"
                         className="!rounded-xl px-4 py-3 text-[9px] font-black border-red-500/30 text-red-400"
                         onClick={() => setCancelTarget(booking.id)}
                       >
                         Cancel
                       </Button>
                     </div>
                   )}
                </div>
              </Card>
            ))
          )}
        </div>

        <ConfirmDialog
          isOpen={cancelTarget !== null}
          title="Cancel Booking"
          message="Are you sure you want to cancel this booking? The customer will be notified."
          confirmText="Yes, Cancel"
          cancelText="Keep Booking"
          isDangerous
          onConfirm={() => { if (cancelTarget) handleCancel(cancelTarget); setCancelTarget(null); }}
          onCancel={() => setCancelTarget(null)}
        />
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
