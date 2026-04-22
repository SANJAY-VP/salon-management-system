import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore, CartItem } from "../../hooks/useCartStore";
import { useAuthStore } from "../../hooks/useAuthStore";
import { PageLayoutDesktop, PageContainerDesktop } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import BackButton from "../../components/common/BackButton";
import { slotService } from "../../services/slot.service";
import { bookingService } from "../../services/booking.service";
import { TimeSlot } from "../../types";
import toast from "react-hot-toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${period}`;
}

function getNextDays(n: number): { label: string; value: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const value = d.toISOString().split("T")[0];
    const label =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { label, value };
  });
}

// ─── Inline slot picker ──────────────────────────────────────────────────────

interface SlotPickerProps {
  item: CartItem;
  /** Slot IDs reserved by OTHER items in this user's cart */
  reservedSlotIds: Set<string>;
  onSlotSelect: (
    itemId: string,
    slot: {
      slotId: string;
      slotDate: string;
      slotTime: string;
      slotStartTime: string;
      slotEndTime: string;
    }
  ) => void;
  onClear: (itemId: string) => void;
}

function SlotPicker({ item, reservedSlotIds, onSlotSelect, onClear }: SlotPickerProps) {
  const days = getNextDays(7);
  const [open, setOpen] = useState(false);
  const [activeDay, setActiveDay] = useState(days[0].value);
  const [allSlots, setAllSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch ALL slots for the day (available + booked) so we can show occupancy.
  // For home-service items the slot is shop-level (barber_id = NULL in DB) —
  // the barberId on the cart item records WHO visits, not a slot filter.
  const fetchSlots = useCallback(
    async (date: string) => {
      setLoading(true);
      try {
        const slotBarberId = item.isHomeService ? undefined : item.barberId;
        const data = await slotService.getShopSlots(
          item.shopId,
          date,        // start_date
          date,        // end_date  (same day)
          slotBarberId
        );
        setAllSlots(data);
      } catch {
        setAllSlots([]);
      } finally {
        setLoading(false);
      }
    },
    [item.shopId, item.barberId, item.isHomeService]
  );

  useEffect(() => {
    if (open) fetchSlots(activeDay);
  }, [open, activeDay, fetchSlots]);

  const handlePickSlot = (slot: TimeSlot) => {
    const slotTime = `${formatTime(slot.start_time)} – ${formatTime(slot.end_time)}`;
    onSlotSelect(item.id, {
      slotId: slot.id.toString(),
      slotDate: slot.date,
      slotTime,
      slotStartTime: slot.start_time,
      slotEndTime: slot.end_time,
    });
    setOpen(false);
  };

  const hasSlot = Boolean(item.slotId);

  // Slot status classification
  const isAvailable = (s: TimeSlot) =>
    s.status === "available" || s.status === "AVAILABLE";

  const isBooked = (s: TimeSlot) =>
    s.status === "booked" || s.status === "BOOKED" ||
    s.status === "completed" || s.status === "COMPLETED";

  const isInMyCart = (s: TimeSlot) =>
    reservedSlotIds.has(s.id.toString());

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      {hasSlot ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-emerald-400">
            <Icon icon="calendar" size={14} />
            <div>
              <p className="font-bold">
                {item.slotDate &&
                  new Date(item.slotDate + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
              </p>
              <p className="text-[10px] font-black text-emerald-400/70 uppercase tracking-wider">
                {item.slotTime}
              </p>
            </div>
          </div>
          {/* Proper "Change" button */}
          <button
            onClick={() => { onClear(item.id); setOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-gold/40 hover:bg-gold/10 text-[10px] font-black text-white/50 hover:text-gold uppercase tracking-widest transition-all cursor-pointer"
            title="Change time slot"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between py-3 px-4 rounded-xl bg-white/5 border border-white/10 hover:border-gold/30 text-[11px] font-black text-white/50 hover:text-gold uppercase tracking-widest transition-all"
        >
          <span className="flex items-center gap-2">
            <Icon icon="clock" size={13} />
            Select Time Slot
          </span>
          <Icon
            icon={open ? "chevronLeft" : "chevronRight"}
            size={12}
            className={`transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
          />
        </button>
      )}

      {open && !hasSlot && (
        <div className="mt-3 bg-white/[0.03] border border-white/10 rounded-2xl p-4">
          {/* Day tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 scrollbar-hide">
            {days.map((d) => (
              <button
                key={d.value}
                onClick={() => setActiveDay(d.value)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all flex-shrink-0 ${activeDay === d.value
                    ? "bg-gold text-cocoa"
                    : "bg-white/5 text-white/60 hover:bg-white/10"
                  }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Slot grid */}
          {loading ? (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-gold/20 border-t-gold rounded-full animate-spin mx-auto" />
            </div>
          ) : allSlots.length === 0 ? (
            <div className="py-6 text-center">
              <Icon icon="clock" size={24} className="text-white/10 mx-auto mb-3" />
              <p className="text-[11px] font-bold text-white/50 mb-1">
                No slots available for this day
              </p>
              <p className="text-[10px] text-white/30 font-black uppercase tracking-wider">
                Try a different date or contact the salon
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {allSlots.map((slot) => {
                const idStr = slot.id.toString();
                const inMyCart = isInMyCart(slot);
                const booked = isBooked(slot);
                const available = isAvailable(slot) && !inMyCart;

                let cls = "";
                let label = formatTime(slot.start_time);
                let disabled = true;
                let title = "";

                if (inMyCart) {
                  // Selected by this user in another cart item
                  cls = "bg-amber-500/10 border-amber-500/20 text-amber-400/60 cursor-not-allowed";
                  title = "Already in your cart";
                } else if (booked) {
                  // Booked by someone else — show in yellow so users know it's taken
                  cls = "bg-yellow-500/10 border-yellow-500/20 text-yellow-400/50 cursor-not-allowed";
                  title = "Booked";
                } else if (available) {
                  cls = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white cursor-pointer";
                  disabled = false;
                } else {
                  cls = "bg-white/5 border-white/10 text-white/20 cursor-not-allowed";
                  title = "Unavailable";
                }

                return (
                  <button
                    key={slot.id}
                    onClick={() => !disabled && handlePickSlot(slot)}
                    disabled={disabled}
                    title={title}
                    className={`py-2 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${cls}`}
                  >
                    {label}
                    {booked && !inMyCart && (
                      <span className="block text-[8px] mt-0.5 opacity-70">Booked</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4 text-[9px] font-black uppercase tracking-wider text-white/30">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              Booked by others
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              In your cart
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Cart ───────────────────────────────────────────────────────────────

export default function Cart() {
  const { items, removeFromCart, updateCartItemSlot, clearSlotForItem, clearCart, total } =
    useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const reservedSlotIds = new Set<string>(
    items.filter((i) => i.slotId).map((i) => i.slotId!)
  );

  const platformFee = Math.round(total * 0.1);
  const grandTotal = total + platformFee;
  const allSlotsSelected = items.length > 0 && items.every((i) => i.slotId);

  const handleMakePayment = async () => {
    if (!allSlotsSelected) {
      toast.error("Please select a time slot for every service");
      return;
    }
    if (!user) {
      toast.error("Please log in to continue");
      return;
    }

    setIsCheckingOut(true);
    const toastId = toast.loading("Creating your bookings…");

    try {
      const bookingPromises = items.map((item) =>
        bookingService.createBooking({
          slot_id: parseInt(item.slotId!),
          service_id: parseInt(item.serviceId),
          customer_name: user.name || user.fullName || "",
          customer_phone: user.phone || "",
          customer_email: user.email || undefined,
          notes: item.isHomeService ? "Home service requested" : undefined,
        })
      );

      const createdBookings = await Promise.all(bookingPromises);
      toast.success(`${createdBookings.length} booking(s) created!`, { id: toastId });

      const firstId = createdBookings[0].id;
      clearCart();
      navigate(
        `/customer/payment?bookingId=${firstId}&amount=${grandTotal}&count=${createdBookings.length}`
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || "Failed to create bookings. Please try again.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop maxWidth="xl" className="py-20 px-10">
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gold/50 mb-8">
              <Icon icon="cart" size={32} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 font-serif uppercase tracking-tighter">
              Your cart is empty
            </h2>
            <p className="max-w-xs text-sm text-white/60 mb-10 text-center">
              Add services from a salon to get started.
            </p>
            <Button
              variant="primary"
              onClick={() => navigate("/customer/search")}
              className="px-10 py-4 !rounded-xl"
            >
              Explore Salons →
            </Button>
          </div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="xl" className="py-12 px-6 md:px-10">
        <div className="mb-8 animate-fade-in">
          <BackButton label="Back" />
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-white uppercase tracking-tighter">
            Your Cart
          </h1>
          <p className="text-sm text-white/60 mt-1">
            Select a time slot for each service, then proceed to payment.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-up">
          {/* Service cards */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => {
              const otherReserved = new Set<string>(
                items.filter((i) => i.id !== item.id && i.slotId).map((i) => i.slotId!)
              );

              return (
                <Card
                  key={item.id}
                  className="p-6 bg-white/5 border-white/5 hover:border-gold/20 transition-all rounded-2xl relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-4">
                        {item.shopImage && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                            <img
                              src={item.shopImage}
                              alt={item.shopName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-white truncate">
                              {item.serviceName}
                            </h3>
                            {item.isHomeService && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest flex-shrink-0">
                                Home Service
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60 flex items-center gap-1.5 mt-0.5">
                            <Icon icon="store" size={10} className="text-gold/50" />
                            {item.shopName}
                          </p>
                          {item.duration && (
                            <p className="text-[10px] font-black text-white/30 uppercase tracking-wider mt-1 flex items-center gap-1">
                              <Icon icon="clock" size={10} />
                              {item.duration} min
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3 flex-shrink-0">
                      <span className="text-xl font-bold text-white font-serif">
                        ₹{item.price}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-all"
                        title="Remove from cart"
                      >
                        <Icon icon="delete" size={14} />
                      </button>
                    </div>
                  </div>

                  <SlotPicker
                    item={item}
                    reservedSlotIds={otherReserved}
                    onSlotSelect={(id, slot) => updateCartItemSlot(id, slot)}
                    onClear={clearSlotForItem}
                  />
                </Card>
              );
            })}
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-28 bg-white/5 border-white/10 p-8 rounded-3xl shadow-xl">
              <h3 className="text-lg font-bold text-white mb-6 pb-4 border-b border-white/5 font-serif uppercase tracking-tighter">
                Order Summary
              </h3>

              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="text-white/60 flex-1 pr-2 flex items-center gap-1.5 min-w-0">
                     {item.serviceName}
                    </div>
                    <span className="text-white font-medium flex-shrink-0">₹{item.price}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/5 pt-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Subtotal</span>
                  <span className="text-white">₹{total}</span>
                </div>
                <div className="flex justify-between text-sm text-gold/70">
                  <span>Platform Fee (10%)</span>
                  <span>₹{platformFee}</span>
                </div>
              </div>

              <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl mb-6">
                <span className="text-xs font-black text-white/60 uppercase tracking-widest">
                  Grand Total
                </span>
                <span className="text-3xl font-black text-gold font-serif">₹{grandTotal}</span>
              </div>

              {!allSlotsSelected && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-4">
                  <svg className="w-4 h-4 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-[11px] text-amber-400 font-black uppercase tracking-wider">
                    Select slots for {items.filter((i) => !i.slotId).length} remaining service(s)
                  </p>
                </div>
              )}

              <Button
                variant="primary"
                fullWidth
                onClick={handleMakePayment}
                disabled={!allSlotsSelected || isCheckingOut}
                className="py-4 !rounded-xl text-sm font-black uppercase tracking-widest shadow-lg shadow-gold/20 disabled:opacity-60"
              >
                {isCheckingOut ? "Processing…" : "Make Payment →"}
              </Button>

              <p className="text-center text-[10px] text-white/35 mt-5 font-medium">
                Secure · Encrypted · Instant Confirmation
              </p>
            </Card>
          </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
