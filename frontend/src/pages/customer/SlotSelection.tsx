import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { slotService } from "../../services/slot.service";
import { useShopStore } from "../../hooks/useShopStore";
import { TimeSlot } from "../../types";
import { useLocation, useNavigate } from "react-router-dom";

export default function SlotSelection() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const shopId = searchParams.get("shopId");
  const barberId = searchParams.get("barberId");

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | number | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const { selectedShop, fetchShopById } = useShopStore();

  useEffect(() => {
    if (shopId) {
      fetchShopById(shopId);
    }
  }, [shopId, fetchShopById]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!shopId) return;
      setLoading(true);
      try {
        const data = await slotService.getAvailableSlots(shopId, selectedDate, barberId || undefined);
        setSlots(data);
        // Reset selected slot if not in the new list
        setSelectedSlotId(null);
      } catch (error) {
        console.error("Failed to fetch slots", error);
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSlots();
  }, [shopId, barberId, selectedDate]);

  const selectedSlot = slots.find(s => String(s.id) === String(selectedSlotId));


  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="xl" className="px-8 py-12">
        <PageHeader 
          title="Schedule Visit" 
          subtitle="Choose a time that aligns with your lifestyle. Our artisans await your presence." 
          onBack={() => navigate(-1)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12 items-start">
          <div className="lg:col-span-8 space-y-10">
            {/* DATE SELECTOR */}
            <section>
              <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Icon icon="calendar" className="text-gold" size={16} />
                Select Date
              </h2>
              <div className="flex gap-3 overflow-x-auto pb-6 scrollbar-hide">
                {Array.from({ length: 14 }).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i);
                  const dateStr = date.toISOString().split("T")[0];
                  const isSelected = selectedDate === dateStr;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedSlotId(null);
                      }}
                      className={`flex-shrink-0 w-20 h-28 rounded-xl border transition-all duration-300 font-bold flex flex-col items-center justify-center gap-1 shadow-md cursor-pointer ${isSelected
                          ? "border-gold bg-gold text-cocoa scale-105"
                          : "border-white/5 bg-white/5 text-white/60 hover:border-gold/30 hover:bg-white/10"
                        }`}
                    >
                      <span className="text-[10px] uppercase font-bold opacity-60">
                         {date.toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="text-2xl font-bold">{date.getDate()}</span>
                      <span className="text-[10px] uppercase font-bold opacity-60">
                        {date.toLocaleDateString("en-US", { month: "short" })}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* TIME SELECTOR */}
            <section>
              <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2">
                <Icon icon="clock" className="text-gold" size={16} />
                Select Time
              </h2>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10">
                   <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
                   <p className="text-xs text-white/50">Checking availability...</p>
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {slots.map((slot) => {
                    const isSelected = String(selectedSlotId) === String(slot.id);

                    return (
                      <button
                        key={slot.id}
                        onClick={() => setSelectedSlotId(slot.id)}
                        aria-label={`Select time ${slot.time?.slice(0, 5) || "unknown"}`}
                        className={`py-4 rounded-xl border transition-all duration-300 font-bold text-sm cursor-pointer ${isSelected
                            ? "border-gold bg-gold text-cocoa shadow-lg scale-105"
                            : "border-white/5 bg-white/5 text-white/70 hover:border-gold/40 hover:text-gold"
                          }`}
                      >
                        {slot.time?.slice(0, 5) || "??:??"}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-white/5 rounded-2xl border border-dashed border-white/10">
                   <Icon icon="clock" size={40} className="text-white/10 mb-4 mx-auto" />
                   <p className="text-white/50 text-xs font-bold">No slots available for this date</p>
                </div>
              )}
            </section>
          </div>

          {/* SUMMARY SIDEBAR */}
          <div className="lg:col-span-4 lg:sticky lg:top-32">
             <Card className="p-8 bg-white/5 border-white/10 rounded-3xl shadow-xl">
                <h3 className="text-lg font-bold text-gold mb-8 uppercase tracking-wider border-b border-white/5 pb-4">Booking Details</h3>
                
                <div className="space-y-6">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gold">
                         <Icon icon="store" size={18} />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Shop</p>
                         <p className="text-base font-bold text-white">{selectedShop?.name || "Loading..."}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gold">
                         <Icon icon="calendar" size={18} />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Date</p>
                         <p className="text-base font-bold text-white">{new Date(selectedDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                      </div>
                   </div>

                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-gold">
                         <Icon icon="clock" size={18} />
                      </div>
                      <div>
                         <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-0.5">Time</p>
                         <p className="text-base font-bold text-white">
                            {selectedSlot ? selectedSlot.time?.slice(0, 5) : "Not selected"}
                         </p>
                      </div>
                   </div>
                </div>

                <div className="mt-10 pt-8 border-t border-white/5">
                   <Button
                      variant="primary"
                      fullWidth
                      disabled={!selectedSlotId}
                      onClick={() =>
                        navigate(`/customer/confirmation?shopId=${shopId}&slotId=${selectedSlotId}${barberId ? `&barberId=${barberId}` : ''}`)
                      }
                      className="py-4 !rounded-xl text-sm font-bold shadow-lg"
                   >
                      Confirm Booking →
                   </Button>
                   <p className="text-center text-[10px] text-white/30 mt-6 font-bold">Cancellation policy applies</p>
                </div>
             </Card>
          </div>
        </div>

      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
