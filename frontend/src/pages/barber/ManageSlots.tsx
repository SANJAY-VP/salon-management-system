import React, { useState, useEffect, useCallback } from "react";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { PageLayoutDesktop, PageContainerDesktop, PageHeader } from "../../components/common/Header";
import { Icon } from "../../components/common/Icon";
import { slotService } from "../../services/slot.service";
import { shopService } from "../../services/shop.service";
import { TimeSlot, Shop } from "../../types";
import { DEFAULT_TIMES } from "../../data/slots";
import toast from "react-hot-toast";



/** Format backend slot for display – uses start_time (HH:MM:SS or HH:MM). */
function slotLabel(slot: TimeSlot): string {
  return (slot.start_time || slot.time || "").slice(0, 5);
}

const ManageSlots: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [shop, setShop] = useState<Shop | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    shopService
      .getMyShops()
      .then((myShops) => {
        if (myShops.length > 0) setShop(myShops[0]);
        else toast("No shops found. Create a shop first.", { icon: "(i)" });
      })
      .catch(() => toast.error("Failed to load your shop"));
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!shop) return;
    setLoading(true);
    try {
      const allSlots = await slotService.getShopSlots(shop.id, selectedDate, selectedDate);
      setSlots(allSlots);
    } catch {
      toast.error("Failed to load slots");
    } finally {
      setLoading(false);
    }
  }, [shop, selectedDate]);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const normalizeStatus = (s: string) =>
    s.toLowerCase() as "available" | "booked" | "cancelled" | "completed";

  const toggleSlotStatus = async (slotId: number | string, currentStatus: string) => {
    const next = normalizeStatus(currentStatus) === "available" ? "CANCELLED" : "AVAILABLE";
    try {
      await slotService.updateSlot(slotId, { status: next });
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: next as any } : s))
      );
    } catch {
      toast.error("Failed to update slot status");
    }
  };

  const createBatchSlots = async () => {
    if (!shop) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Generating time slots...");
    try {
      // Backend SlotCreate requires: shop_id, date, start_time, end_time
      await Promise.all(
        DEFAULT_TIMES.map((t) =>
          slotService.createSlot({
            shop_id: Number(shop.id),
            date: selectedDate,
            start_time: t.start,
            end_time: t.end,
          })
        )
      );
      await fetchSlots();
      toast.success("Slots created successfully", { id: toastId });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || "Failed to create slots";
      toast.error(msg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSlot = async (slotId: string | number) => {
    try {
      await slotService.deleteSlot(slotId);
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      toast.success("Slot removed");
    } catch {
      toast.error("Cannot delete a booked slot");
    }
  };

  const getNextDates = () =>
    Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

  const getDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    })();
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  if (!shop && loading) {
    return (
      <PageLayoutDesktop variant="barber">
        <PageContainerDesktop className="flex items-center justify-center min-h-[60vh]">
          <div className="text-gold text-xl animate-pulse font-serif tracking-widest uppercase">
            Loading...
          </div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="2xl" className="px-8 py-12">
        <PageHeader
          title="Manage Slots"
          subtitle={`Set availability for ${shop?.name || "your salon"}.`}
        />

        {/* Date Selector */}
        <div className="mb-16">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-8">
            Select Date
          </p>
          <div className="overflow-x-auto pb-4 no-scrollbar -mx-4 px-4">
            <div className="flex gap-4">
              {getNextDates().map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 min-w-[100px] p-5 rounded-[20px] border transition-all duration-500 ${
                    selectedDate === date
                      ? "border-gold bg-gold/10 shadow-lg shadow-gold/10"
                      : "border-white/5 bg-white/5 hover:border-white/30"
                  }`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                      selectedDate === date ? "text-gold" : "text-cream/60"
                    }`}
                  >
                    {getDateLabel(date)}
                  </p>
                  <p
                    className={`text-lg font-bold font-serif ${
                      selectedDate === date ? "text-white" : "text-cream/80"
                    }`}
                  >
                    {new Date(date).toLocaleDateString("en-US", { day: "numeric", month: "short" })}
                  </p>
                  <p
                    className={`text-[9px] font-medium uppercase tracking-widest mt-1 ${
                      selectedDate === date ? "text-gold/60" : "text-white/50"
                    }`}
                  >
                    {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
          {/* Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-8 bg-coffee/40 border-gold/10 rounded-[32px] shadow-2xl">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-8">
                Controls
              </h3>
              {slots.length === 0 && !loading ? (
                <div className="space-y-4">
                  <p className="text-sm text-cream/60 leading-relaxed">
                    No slots for this date. Generate the default schedule to start accepting bookings.
                  </p>
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={createBatchSlots}
                    disabled={isSubmitting || !shop}
                    className="!rounded-2xl py-4 text-[10px] font-black uppercase tracking-widest"
                  >
                    {isSubmitting ? "Generating..." : "Generate Slots"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-3 border-b border-white/5">
                    <span className="text-[10px] font-black text-cream/60 uppercase tracking-widest">
                      Available
                    </span>
                    <span className="text-xl font-bold font-serif text-emerald-400">
                      {slots.filter((s) => normalizeStatus(s.status) === "available").length}
                    </span>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-[10px] font-black text-cream/60 uppercase tracking-widest">
                      Booked
                    </span>
                    <span className="text-xl font-bold font-serif text-gold">
                      {slots.filter((s) => normalizeStatus(s.status) === "booked").length}
                    </span>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Slot Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="py-20 text-center text-gold animate-pulse font-serif uppercase tracking-widest">
                Loading slots...
              </div>
            ) : slots.length === 0 ? (
              <Card className="py-40 border-dashed border-gold/20 bg-transparent flex flex-col items-center rounded-[40px]">
                <Icon icon="calendar" size={64} className="text-gold/10 mb-8" />
                <h3 className="text-3xl font-serif text-white uppercase tracking-tighter mb-4">
                  No Slots Yet
                </h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/50 max-w-xs text-center">
                  Click "Generate Slots" on the left to create today's schedule.
                </p>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 animate-fade-in">
                {slots.map((slot) => {
                  const status = normalizeStatus(slot.status);
                  const isBooked = status === "booked";
                  return (
                    <div key={slot.id} className="relative group">
                      <button
                        onClick={() => !isBooked && toggleSlotStatus(slot.id, slot.status)}
                        disabled={isBooked}
                        className={`w-full p-6 rounded-[28px] border transition-all duration-500 text-center ${
                          status === "available"
                            ? "border-gold/20 bg-gold/5 text-gold hover:border-gold/50"
                            : isBooked
                            ? "border-white/5 bg-white/5 text-white/60 cursor-not-allowed"
                            : "border-white/5 bg-black/20 text-cream/50 hover:border-red-500/20"
                        }`}
                      >
                        <div className="text-2xl font-bold font-serif mb-2">{slotLabel(slot)}</div>
                        <div className="flex items-center justify-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status === "available"
                                ? "bg-emerald-400"
                                : isBooked
                                ? "bg-gold"
                                : "bg-red-500"
                            }`}
                          />
                          <span className="text-[9px] font-black uppercase tracking-widest">
                            {status === "available" ? "Open" : isBooked ? "Booked" : "Closed"}
                          </span>
                        </div>
                      </button>
                      {!isBooked && (
                        <button
                          onClick={() => deleteSlot(slot.id)}
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500/80 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          title="Delete slot"
                        >
                          x                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
};

export default ManageSlots;
