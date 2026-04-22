import { useState, useRef, useEffect, memo } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import { Icon } from "../../components/common/Icon";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shopService } from "../../services/shop.service";
import { slotService } from "../../services/slot.service";
import { bookingService } from "../../services/booking.service";
import { Shop, TimeSlot as APISlot } from "../../types";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { 
  HOURS, 
  DAYS_FULL, 
  MONTHS, 
  PX_PER_MINUTE, 
  HOUR_HEIGHT, 
  STATUS_BG, 
  STATUS_TEXT 
} from "../../data/constants";
import { parseSlotMinutes, formatDateHeader } from "../../utils/time";

// ─── Types ────────────────────────────────────────────────────────────────────
type SlotStatus = "available" | "booked" | "break" | "closed";
type CalendarView = "day" | "week" | "month";

interface DashboardSlot {
  id?: string | number;
  time: string;
  status: SlotStatus;
  booking?: {
    id: string | number;
    customerName: string;
    service: string;
    duration: string;
    paymentStatus: "Paid" | "Pending";
  };
}

// ─── Sub-Components ──────────────────────────────────────────────────────────
const PerformanceStats = memo(({ stats }: { stats: any }) => (
  <Card className="p-8 bg-coffee/20 border-white/5 rounded-[32px] overflow-hidden relative">
    <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-2xl rounded-full" />
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-8">Performance</h3>
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/55 mb-1">Encounters</p>
        <p className="text-3xl font-bold text-white font-serif">{stats.bookings}</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/55 mb-1">Available Windows</p>
        <p className="text-3xl font-bold text-emerald-400 font-serif">{stats.free}</p>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/55 mb-1">Est. Revenue</p>
        <p className="text-3xl font-bold text-gold font-serif">₹{stats.revenue.toLocaleString()}</p>
      </div>
    </div>
  </Card>
));

const Legend = memo(() => (
  <Card className="p-8 bg-coffee/20 border-white/5 rounded-[32px]">
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-8">Legend</h3>
    <div className="space-y-4">
      {Object.entries(STATUS_TEXT).map(([status, textClass]) => (
        <div key={status} className="flex items-center gap-4 group">
          <div className={`w-3 h-3 rounded-full ${STATUS_BG[status as SlotStatus]} border ${textClass.replace('text-', 'border-')}`} />
          <span className={`text-[10px] font-black uppercase tracking-widest ${textClass}`}>{status}</span>
        </div>
      ))}
    </div>
  </Card>
));

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BarberOperations() {
  const [view, setView] = useState<CalendarView>("day");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [shop, setShop] = useState<Shop | null>(null);
  const [slots, setSlots] = useState<DashboardSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTimeTop, setCurrentTimeTop] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const myShops = await shopService.getMyShops();
        if (myShops.length > 0) setShop(myShops[0]);
      } catch (error) {
        console.error("Operations shop fetch error", error);
      }
    };
    fetchShop();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!shop) return;
      setLoading(true);
      try {
        const dateStr = selectedDate.toISOString().split("T")[0];
        const [apiSlots, apiBookings] = await Promise.all([
          slotService.getShopSlots(shop.id),
          bookingService.getShopBookings(shop.id)
        ]);

        const daySlots = apiSlots.filter(s => s.date === dateStr);
        const dayBookings = apiBookings.filter(b => b.status !== 'cancelled');

        const mappedSlots: DashboardSlot[] = daySlots.map(s => {
          const booking = dayBookings.find(b => b.slot_id === s.id);
          const status = booking ? 'booked' : (s.status.toLowerCase() as SlotStatus);
          
          return {
            id: s.id,
            time: (s.start_time || s.time || "").slice(0, 5),
            status,
            booking: booking ? {
              id: booking.id,
              customerName: booking.customer_name,
              service: (booking as any).service?.name || "Premium Cut",
              duration: "45m",
              paymentStatus: "Paid"
            } : undefined
          };
        });

        mappedSlots.sort((a,b) => a.time.localeCompare(b.time));
        setSlots(mappedSlots);
      } catch (error) {
        console.error("Operations data fetch error", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [shop, selectedDate]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      if (now.getHours() >= 9 && now.getHours() <= 21) {
        const mins = (now.getHours() - 9) * 60 + now.getMinutes();
        setCurrentTimeTop(mins * PX_PER_MINUTE);
      }
    };
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);

  const stats = {
    bookings: slots.filter((s) => s.status === "booked").length,
    free: slots.filter((s) => s.status === "available").length,
    revenue: slots.filter(s => s.status === 'booked').length * 1200, 
  };

  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="2xl" className="px-10 py-12">
        <div className="flex justify-between items-end mb-12">
           <PageHeader 
              title="Daily Operations" 
              subtitle={`Orchestrating excellence at ${shop?.name || 'your establishment'}.`} 
           />
           <div className="flex bg-coffee/40 backdrop-blur-xl p-1.5 rounded-2xl border border-white/5">
              {["day", "week", "month"].map(v => (
                <button 
                  key={v}
                  onClick={() => setView(v as CalendarView)}
                  className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 ${view === v ? "bg-gold text-cocoa shadow-lg" : "text-cream/60 hover:text-white"}`}
                >
                  {v}
                </button>
              ))}
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
           <div className="space-y-8">
              <PerformanceStats stats={stats} />
              <Legend />
           </div>

           <div className="lg:col-span-3">
              <Card className="p-0 bg-coffee/40 border-white/5 rounded-[40px] shadow-2xl overflow-hidden flex flex-col min-h-[70vh]">
                 <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                    <div className="flex items-center gap-6">
                       <button 
                         onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() - 1);
                            setSelectedDate(d);
                         }}
                         className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cream/60 hover:bg-gold hover:text-cocoa transition-all duration-500"
                       >
                          <Icon icon="back" size={16} />
                       </button>
                       <h2 className="text-2xl font-bold font-serif text-white tracking-tighter uppercase">
                         {formatDateHeader(selectedDate, DAYS_FULL, MONTHS)}
                       </h2>
                       <button 
                         onClick={() => {
                            const d = new Date(selectedDate);
                            d.setDate(d.getDate() + 1);
                            setSelectedDate(d);
                         }}
                         className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-cream/60 hover:bg-gold hover:text-cocoa transition-all duration-500 rotate-180"
                       >
                          <Icon icon="back" size={16} />
                       </button>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedDate(new Date())}
                      className="!rounded-xl px-6 py-2.5 text-[9px] font-black uppercase tracking-widest"
                    >
                      Return to Present
                    </Button>
                 </div>

                 <div className="flex-1 relative overflow-y-auto px-10 py-10 no-scrollbar" ref={scrollRef}>
                    <div className="flex min-h-[900px]">
                       <div className="w-20 shrink-0 border-r border-white/5 relative">
                          {HOURS.map((h, i) => (
                             <div key={h} className="absolute right-6 text-[10px] font-black text-white/50 uppercase tracking-widest" style={{ top: i * HOUR_HEIGHT }}>
                                {h > 12 ? `${h-12} PM` : `${h} ${h === 12 ? 'PM' : 'AM'}`}
                             </div>
                          ))}
                       </div>

                       <div className="flex-1 relative ml-10">
                          {HOURS.map((_, i) => (
                             <div key={i} className="absolute left-0 right-0 border-t border-white/5" style={{ top: i * HOUR_HEIGHT }} />
                          ))}
                          
                          {selectedDate.toDateString() === new Date().toDateString() && currentTimeTop > 0 && (
                             <div className="absolute left-0 right-0 z-50 flex items-center pointer-events-none" style={{ top: currentTimeTop }}>
                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)] -ml-1.5" />
                                <div className="flex-1 h-px bg-red-500/50" />
                             </div>
                          )}

                          {loading ? (
                             <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-gold animate-pulse text-sm font-serif uppercase tracking-[0.3em]">Syncing Schedule</div>
                             </div>
                          ) : (
                             slots.map((slot, idx) => {
                                const offsetMins = parseSlotMinutes(slot.time);
                                const top = offsetMins * PX_PER_MINUTE;
                                const height = 45 * PX_PER_MINUTE - 4; 

                                return (
                                   <div
                                      key={idx}
                                      className={`absolute left-0 right-4 rounded-2xl border transition-all duration-500 p-4 group cursor-pointer ${STATUS_BG[slot.status]}`}
                                      style={{ top, height }}
                                   >
                                      <div className="flex justify-between items-start">
                                         <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center ${STATUS_TEXT[slot.status]}`}>
                                               <Icon icon={slot.status === 'booked' ? "users" : "clock"} size={18} />
                                            </div>
                                            <div>
                                               <p className={`text-sm font-bold font-serif uppercase tracking-tight ${STATUS_TEXT[slot.status]}`}>
                                                  {slot.status === 'booked' ? slot.booking?.customerName : slot.status === 'break' ? 'Personal Interlude' : 'Open Window'}
                                               </p>
                                               <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mt-0.5">
                                                  {slot.time} {slot.status === 'booked' && `* ${slot.booking?.service}`}
                                               </p>
                                            </div>
                                         </div>
                                         {slot.status === 'booked' && (
                                            <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                                               Paid
                                            </div>
                                         )}
                                      </div>
                                   </div>
                                );
                             })
                          )}
                       </div>
                    </div>
                 </div>
              </Card>
           </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
