import { useState, useCallback, useEffect } from "react";
import Card from "../common/Card";
import { Icon } from "../common/Icon";
import { TimeSlot, Booking, Barber, Shop } from "../../types";
import { Modal } from "../common/Modal";
import { slotService } from "../../services/slot.service";
import toast from "react-hot-toast";

interface ShopCalendarProps {
  shopId: string | number;
  slots: TimeSlot[];
  bookings: Booking[];
  barbers: Barber[];
  shop: Shop;
}

interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  slotCount: number;
  bookedCount: number;
  availableCount: number;
}

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatTime(t: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function ShopCalendar({ shopId, slots, bookings, barbers, shop }: ShopCalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDayModal, setShowDayModal] = useState(false);
  const [daySlots, setDaySlots] = useState<TimeSlot[]>([]);
  const [loadingDay, setLoadingDay] = useState(false);
  const [monthSlots, setMonthSlots] = useState<TimeSlot[]>(slots);

  // Fetch (and trigger auto-generation for) the full visible month whenever the month changes
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).toISOString().split("T")[0];
    const lastDay = new Date(year, month + 1, 0).toISOString().split("T")[0];

    slotService
      .getShopSlots(shopId, firstDay, lastDay)
      .then((data) => setMonthSlots(data))
      .catch(() => setMonthSlots(slots));
  }, [currentDate, shopId]);

  // Max navigation: 1 month ahead from today
  const maxMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
  const canGoNext = currentDate < maxMonth;
  const canGoPrev = currentDate > new Date(today.getFullYear(), today.getMonth(), 1);

  const navigateMonth = (dir: "prev" | "next") => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === "next" ? 1 : -1));
      return d;
    });
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startOffset = firstDay.getDay();
    const days: CalendarDay[] = [];

    // Pad before
    for (let i = 0; i < startOffset; i++) {
      const d = new Date(year, month, -startOffset + i + 1);
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false, slotCount: 0, bookedCount: 0, availableCount: 0 });
    }

    // Current month days
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split("T")[0];
      const daySlotList = monthSlots.filter((s) => s.date === dateStr);
      const booked = daySlotList.filter((s) => s.status === "booked" || s.status === "BOOKED").length;
      const available = daySlotList.filter((s) => s.status === "available" || s.status === "AVAILABLE").length;
      days.push({ date: d, day, isCurrentMonth: true, slotCount: daySlotList.length, bookedCount: booked, availableCount: available });
    }

    // Pad after to complete the grid (6 rows × 7 = 42)
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, day: d.getDate(), isCurrentMonth: false, slotCount: 0, bookedCount: 0, availableCount: 0 });
    }

    return days;
  };

  const handleDayClick = useCallback(
    async (calDay: CalendarDay) => {
      if (!calDay.isCurrentMonth) return;
      setSelectedDay(calDay.date);
      setShowDayModal(true);
      setLoadingDay(true);

      try {
        const dateStr = calDay.date.toISOString().split("T")[0];
        // Fetch all slots for the day (backend auto-generates from shop hours if missing)
        const fetched = await slotService.getShopSlots(shopId, dateStr, dateStr);
        setDaySlots(fetched);

        // Refresh calendar dots for this month after potential auto-generation
        setMonthSlots((prev) => {
          const withoutDay = prev.filter((s) => s.date !== dateStr);
          return [...withoutDay, ...fetched];
        });
      } catch {
        toast.error("Failed to load slots for this day");
        setDaySlots([]);
      } finally {
        setLoadingDay(false);
      }
    },
    [shopId, today, slots]
  );

  const getBookingForSlot = (slotId: string | number): Booking | undefined =>
    bookings.find((b) => b.slot_id?.toString() === slotId?.toString());

  const calDays = getCalendarDays();
  const monthLabel = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Calendar header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center bg-white/5 p-1.5 rounded-2xl border border-white/5 gap-1">
          <button
            onClick={() => navigateMonth("prev")}
            disabled={!canGoPrev}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-gold hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Icon icon="chevronLeft" size={14} />
          </button>
          <span className="px-6 text-sm font-black uppercase tracking-[0.2em] text-white italic min-w-[180px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={() => navigateMonth("next")}
            disabled={!canGoNext}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white/60 hover:text-gold hover:bg-white/5 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <Icon icon="chevronRight" size={14} />
          </button>
        </div>

        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-6 py-3 rounded-xl bg-gold/10 border border-gold/20 text-[10px] font-black text-gold uppercase tracking-widest hover:bg-gold hover:text-white transition-all duration-500"
        >
          Today
        </button>
      </div>

      {/* Slots legend */}
      <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-white/60">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-white/60">Booked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gold" />
          <span className="text-white/60">Today</span>
        </div>
        <p className="text-white/30 italic ml-4">Click any day to view or generate slots</p>
      </div>

      {/* Monthly calendar grid */}
      <Card className="p-8 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl overflow-hidden">
        {/* Day labels */}
        <div className="grid grid-cols-7 gap-2 mb-6">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-black text-white/30 uppercase tracking-[0.3em] py-2">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar cells */}
        <div className="grid grid-cols-7 gap-2">
          {calDays.map((calDay, idx) => {
            const isToday = calDay.date.toDateString() === today.toDateString();
            const isPast = calDay.date < today && !isToday;
            const isFuture = calDay.date > today;
            const isSelected = selectedDay?.toDateString() === calDay.date.toDateString();

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(calDay)}
                disabled={!calDay.isCurrentMonth || isPast}
                className={`
                  h-14 md:h-16 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all relative
                  ${!calDay.isCurrentMonth ? "text-white/10 cursor-default" : ""}
                  ${calDay.isCurrentMonth && !isPast ? "hover:border-gold/30 hover:bg-gold/10 cursor-pointer" : ""}
                  ${isPast && calDay.isCurrentMonth ? "text-white/30 opacity-60 cursor-not-allowed" : ""}
                  ${isToday ? "border border-gold bg-gold/5 text-gold" : calDay.isCurrentMonth ? "border border-white/5 bg-white/[0.02] text-white" : ""}
                  ${isSelected ? "!bg-gold !text-cocoa border-gold shadow-2xl shadow-gold/20 scale-105 z-10" : ""}
                `}
              >
                <span>{calDay.day}</span>
                {calDay.isCurrentMonth && calDay.slotCount > 0 && (
                  <div className="flex gap-0.5">
                    {calDay.availableCount > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 opacity-80" />
                    )}
                    {calDay.bookedCount > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 opacity-80" />
                    )}
                  </div>
                )}
                {calDay.isCurrentMonth && calDay.slotCount === 0 && (isFuture || isToday) && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Day Detail Modal */}
      <Modal
        isOpen={showDayModal}
        onClose={() => { setShowDayModal(false); setSelectedDay(null); setDaySlots([]); }}
        title={selectedDay ? selectedDay.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : ""}
      >
        {loadingDay ? (
          <div className="py-16 flex flex-col items-center gap-6">
            <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
            <p className="text-[10px] font-black text-white/30 uppercase tracking-widest animate-pulse">
              Loading Slots...
            </p>
          </div>
        ) : daySlots.length === 0 ? (
          <div className="py-12 text-center">
            <Icon icon="clock" size={40} className="text-white/10 mx-auto mb-6" />
            <p className="text-sm font-bold text-white/60 mb-2">No slots available</p>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">
              {shop.openingTime && shop.closingTime
                ? "Slots will be auto-generated on next click"
                : "Configure opening & closing times in shop settings"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary bar */}
            <div className="flex items-center gap-6 p-4 bg-white/5 rounded-2xl border border-white/5 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold font-serif text-white">{daySlots.length}</p>
                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Total</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold font-serif text-emerald-400">
                  {daySlots.filter((s) => s.status === "available" || s.status === "AVAILABLE").length}
                </p>
                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Available</p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold font-serif text-red-400">
                  {daySlots.filter((s) => s.status === "booked" || s.status === "BOOKED").length}
                </p>
                <p className="text-[8px] font-black text-white/50 uppercase tracking-widest">Booked</p>
              </div>
            </div>

            {/* Slot list */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
              {daySlots.map((slot) => {
                const isBooked = slot.status === "booked" || slot.status === "BOOKED";
                const booking = isBooked ? getBookingForSlot(slot.id) : undefined;
                const barber = barbers.find((b) => b.id?.toString() === slot.barber_id?.toString());

                return (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isBooked
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-emerald-500/5 border-emerald-500/20"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isBooked ? "bg-red-500" : "bg-emerald-500"}`} />
                      <div>
                        <p className="text-sm font-bold text-white">
                          {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                        </p>
                        {isBooked && booking && (
                          <p className="text-[10px] font-black text-red-400/70 uppercase tracking-wider mt-0.5">
                            {booking.customer_name}
                          </p>
                        )}
                        {barber && (
                          <p className="text-[10px] text-white/30 uppercase tracking-wider mt-0.5">
                            {barber.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                        isBooked
                          ? "text-red-400 border-red-500/20 bg-red-500/10"
                          : "text-emerald-400 border-emerald-500/20 bg-emerald-500/10"
                      }`}
                    >
                      {isBooked ? "Booked" : "Open"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
