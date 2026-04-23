import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { bookingService } from "../../services/booking.service";
import { useLocation, useNavigate } from "react-router-dom";
import { Booking } from "../../types";

export default function BookingSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const bookingId = searchParams.get("id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }
      try {
        const data = await bookingService.getBookingById(bookingId);
        setBooking(data);
      } catch (error) {
        console.error("Failed to fetch booking", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
          <div className="text-gold/60 font-serif tracking-[0.3em] uppercase text-sm animate-pulse">Securing Your Arrival</div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  if (!booking) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop maxWidth="md" className="text-center py-40 px-10">
          <Icon icon="search" size={64} className="text-white/20 mb-8 mx-auto" />
          <h2 className="text-4xl font-serif text-white mb-6 uppercase tracking-tighter">Manifest Lost</h2>
          <p className="text-cream/50 mb-12 font-medium tracking-wide">We couldn't retrieve your booking manifest. It might have been misplaced in the archives.</p>
          <Button onClick={() => navigate("/home")} variant="primary" className="px-12 py-5 !rounded-2xl font-black text-[10px] uppercase tracking-widest">Return to Sanctuary</Button>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${booking.booking_code}&color=000000&bgcolor=ffffff&format=svg`;

  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="lg" className="px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-24 h-24 bg-gold/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-gold/20 relative group">
              <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              <Icon icon="check" className="text-gold relative z-10" size={40} />
            </div>
            <h1 className="text-5xl font-bold font-serif text-white mb-4 uppercase tracking-tighter">
              Booking Confirmed
            </h1>
            <p className="text-cream/60 font-medium uppercase tracking-[0.3em] text-[10px]">Your presence is anticipated at the salon.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
            <Card className="p-10 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full" />
              <h2 className="font-bold font-serif text-gold text-xl uppercase tracking-tighter mb-10 border-b border-white/5 pb-6 flex items-center gap-3">
                <Icon icon="calendar" size={18} />
                Encounter Details
              </h2>
              <div className="space-y-8">
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1 leading-relaxed">Artisan Code</p>
                  <p className="text-4xl font-bold text-white font-serif tracking-tighter">{booking.booking_code}</p>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Establishment</p>
                    <p className="text-sm font-bold text-cream uppercase">{(booking as any).shop?.name || "Premium Salon"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Status</p>
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em]">{booking.status}</p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Horizon Date</p>
                  <p className="text-sm font-bold text-cream uppercase">{new Date(booking.created_at).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>
            </Card>

            <Card className="p-10 bg-[#0B0B0F] border-gold/10 rounded-[40px] shadow-2xl text-center group">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <h2 className="font-bold font-serif text-gold text-xl uppercase tracking-tighter mb-8 pb-4">Digital Key</h2>
              
              <div className="relative mb-8 bg-white p-4 rounded-3xl inline-block group-hover:scale-105 transition-transform border border-gold/20 shadow-[0_0_40px_rgba(212,175,55,0.08)]">
                <img
                  src={qrCodeUrl}
                  alt="Booking QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>
              
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest leading-relaxed px-6">
                Present this QR code at the salon reception for check-in.
              </p>
            </Card>
          </div>

          <div className="flex flex-col gap-4">
            <Button
              variant="primary"
              fullWidth
              className="py-6 !rounded-2xl text-[10px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-gold/20"
              onClick={() => navigate("/customer/profile")}
            >
              Continue Exploration →
              </Button>
          </div>

          <p className="text-center text-[10px] uppercase tracking-widest text-white/30 mt-12 font-bold leading-relaxed px-16">
            Your booking secures the barber's dedicated time. Late arrivals may result in a shorter session.
          </p>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
