import { ReactNode } from "react";
import Card from "./Card";
import { Icon } from "./Icon";
import Button from "./Button";
import { Shop, Service, Barber } from "../../types";
import { resolveShopImage, resolveAvatarImage } from "../../config/images";

export { StatCard } from "./StatCard";
export { SleekStatCard } from "./SleekStatCard";

interface ShopCardProps {
  shop: Shop;
  onClick?: () => void;
}

export function ShopCard({ shop, onClick, variant = "customer" }: ShopCardProps & { variant?: "customer" | "barber" }) {
  const isOpen = shop.isOpen;
  return (
    <Card
      className="group p-0 overflow-hidden border-white/[0.05] bg-surface/40 backdrop-blur-sm cursor-pointer hover:shadow-2xl hover:shadow-black/60 transition-all duration-700 rounded-[24px] md:rounded-[40px]"
      onClick={onClick}
    >
      {/* Shop image — shorter on mobile */}
      <div className="relative h-44 sm:h-56 md:h-72 overflow-hidden">
        <img
          src={resolveShopImage(shop.images || shop.shopImage)}
          alt={shop.name}
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute top-4 md:top-8 right-4 md:right-8 bg-background/60 backdrop-blur-xl px-3 py-1 rounded-full border border-white/10 shadow-2xl flex items-center gap-1.5">
          <Icon icon="star" size={12} className="text-gold" />
          <span className="text-xs font-black text-white tracking-widest leading-none mt-0.5">
            {Number(shop.rating || 0).toFixed(1)}
          </span>
        </div>

        <div className={`absolute top-4 md:top-8 left-4 md:left-8 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-2xl border ${isOpen
          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
          : "bg-red-500/20 text-red-300 border-red-400/30"}`}>
          {isOpen ? (variant === "barber" ? "Open" : "Open Now") : "Closed"}
        </div>

        {variant === "customer" && (
          <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 right-4 md:right-8 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
            <div className="flex flex-wrap gap-1.5">
              {shop.amenities?.slice(0, 3).map((amenity, i) => (
                <span key={i} className="px-2 py-0.5 bg-white/10 backdrop-blur-md rounded-full text-[8px] uppercase tracking-[0.2em] text-white border border-white/10 font-bold">
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card body — tighter padding on mobile */}
      <div className="p-5 md:p-10">
        <div className="flex justify-between items-start mb-4 md:mb-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl md:text-3xl font-bold font-serif text-white mb-1 md:mb-2 group-hover:text-gold transition-colors tracking-tighter uppercase truncate">
              {shop.name}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-white/60 uppercase tracking-widest">
              <Icon icon="location" size={12} className="text-gold/50" />
              <span className="truncate">{shop.city}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.05] pt-4 md:pt-8 mt-3 md:mt-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {[1, 2].map(i => (
                <div key={i} className="w-7 h-7 md:w-9 md:h-9 rounded-[10px] md:rounded-[14px] border-2 border-background bg-stone-900 overflow-hidden ring-1 ring-white/5">
                  <img src={resolveAvatarImage(null, `${shop.id}${i}`)} alt="barber" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">{shop.reviewCount || 0} reviews</span>
          </div>

          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center text-white/50 group-hover:bg-gold group-hover:text-cocoa group-hover:border-gold transition-all duration-500 group-hover:scale-110 cursor-pointer shadow-lg shadow-black/40`}>
            <Icon icon="arrow-right" size={13} className="transition-colors group-hover:text-black" />
          </div>
        </div>
      </div>
    </Card>
  );
}

interface BookingCardProps {
  booking: any;
  onClick?: () => void;
  onInvoice?: (booking: any) => void;
  actions?: ReactNode;
}

const statusClasses = {
  confirmed: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  completed: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  cancelled: "bg-red-500/10 text-red-400 border border-red-500/20",
  scheduled: "bg-white/5 text-white/60 border border-white/10",
  "in-progress": "bg-gold/10 text-gold border border-gold/20",
};

export function BookingCard({
  booking,
  onClick,
  onInvoice,
  actions,
}: BookingCardProps) {
  // Prefer enriched slot fields; fall back to created_at for legacy data
  const appointmentDate = booking.slot_date
    ? new Date(booking.slot_date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short", month: "short", day: "numeric", year: "numeric",
      })
    : new Date(booking.created_at || Date.now()).toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      });

  const appointmentTime =
    booking.slot_start_time && booking.slot_end_time
      ? (() => {
          const fmt = (t: string) => {
            const [h, m] = t.split(":").map(Number);
            return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
          };
          return `${fmt(booking.slot_start_time)} – ${fmt(booking.slot_end_time)}`;
        })()
      : new Date(booking.created_at || Date.now()).toLocaleTimeString("en-US", {
          hour: "2-digit", minute: "2-digit",
        });

  const serviceName =
    booking.service_name ||
    (booking as any).service?.name ||
    "Premium Session";

  const shopName =
    booking.shop_name ||
    (booking as any).shop?.name ||
    "Salon";

  // amount_paid is the real payment; fall back to service_price
  const displayPrice =
    booking.amount_paid ??
    booking.service_price ??
    (booking as any).service?.price ??
    0;

  const STATUS_STYLES: Record<string, string> = {
    confirmed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    completed: "bg-white/5 text-white/50 border-white/10",
    cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-gold/10 text-gold border-gold/20",
    no_show: "bg-red-500/10 text-red-300 border-red-500/20",
  };

  return (
    <Card
      className="group p-4 md:p-5 rounded-[20px] md:rounded-[24px] relative overflow-hidden transition-all duration-500 hover:border-gold/20 bg-white/[0.02] border-white/5"
      onClick={onClick}
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold/5 blur-[80px] rounded-full -mr-24 -mt-24" />

      <div className="relative z-10">
        <div className="flex justify-between items-start gap-3 mb-3 md:mb-4 pb-3 md:pb-4 border-b border-white/5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shadow-md">
              <Icon icon="scissors" size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-0.5">
                #{booking.booking_code || `REF-${booking.id}`}
              </p>
              <h3 className="text-sm md:text-base font-bold text-white font-serif tracking-tight truncate italic">
                {serviceName}
              </h3>
              <p className="text-[10px] font-bold text-gold/80 flex items-center gap-1 mt-0.5 uppercase tracking-widest truncate">
                <Icon icon="store" size={10} />
                {shopName}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="text-lg md:text-xl font-black text-white font-serif italic tracking-tighter">
              ₹{displayPrice}
            </span>
            <span
              className={`text-[9px] font-black px-2 md:px-3 py-0.5 md:py-1 rounded-full border uppercase tracking-widest ${
                STATUS_STYLES[booking.status] || STATUS_STYLES.pending
              }`}
            >
              {booking.status}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 px-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold/60">
              <Icon icon="calendar" size={10} />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-white/80">{appointmentDate}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gold/60">
              <Icon icon="clock" size={10} />
            </div>
            <span className="text-[11px] md:text-xs font-bold text-white/80">{appointmentTime}</span>
          </div>
          {booking.notes?.toLowerCase().includes("home") && (
            <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
              Home
            </span>
          )}
        </div>

        {(onInvoice || actions) && (
          <div className="flex flex-wrap justify-between items-center gap-3 pt-3 md:pt-4 mt-3 md:mt-4 border-t border-white/5">
            {actions && <div className="flex-1">{actions}</div>}
            {onInvoice && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInvoice(booking);
                }}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-gold text-cocoa font-black uppercase tracking-widest text-[9px] flex items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
              >
                <Icon icon="image" size={11} />
                Receipt
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

export function ServiceCard({ service, onAdd }: { service: Service, onAdd: () => void, shopName: string }) {
  return (
    <Card className="group hover:border-gold/40 transition-all flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-coffee/20 border-white/5 backdrop-blur-sm relative overflow-hidden rounded-2xl">
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold/5 blur-2xl rounded-full" />
      <div>
        <div className="flex justify-between items-start mb-3 md:mb-4 gap-2">
           <h3 className="font-bold font-serif text-white text-lg md:text-2xl group-hover:text-gold transition-colors tracking-tight uppercase truncate">{service.name}</h3>
           <p className="text-lg md:text-2xl font-bold text-gold font-serif tracking-tighter flex-shrink-0">₹{service.price}</p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase font-black tracking-widest text-cream/50 mb-4 md:mb-6">
            <div className="flex items-center gap-1.5">
               <Icon icon="clock" size={12} className="text-gold/50" />
               {service.durationMinutes} MINS
            </div>
            <div className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="hidden sm:inline">PREMIUM CARE</span>
        </div>
        {service.description && (
          <p className="text-xs md:text-sm text-cream/50 leading-relaxed font-medium mb-4 md:mb-8 border-l-2 border-gold/20 pl-4 line-clamp-2">
            {service.description}
          </p>
        )}
      </div>     
      <Button
        variant="primary"
        fullWidth
        onClick={onAdd}
        className="group-hover:bg-gold group-hover:text-cocoa transition-all duration-500 font-black uppercase tracking-[0.2em] text-[10px] py-3 md:py-4 rounded-xl"
      >
        Add to Cart
      </Button>
    </Card>
  );
}

interface BarberCardProps {
  barber: Barber;
  /** Called when the user clicks "Book Appointment" — handles both in-salon & home-service */
  onBook: () => void;
  acceptsHomeService: boolean;
}

export function BarberCard({ barber, onBook, acceptsHomeService }: BarberCardProps) {
  const isBookable = barber.isActive !== false;

  return (
    <Card className="group hover:border-gold/40 transition-all flex flex-col justify-between p-6 md:p-8 bg-coffee/20 border-white/5 backdrop-blur-sm relative overflow-hidden rounded-2xl">
      <div className="absolute -top-4 -right-4 w-20 h-20 bg-gold/5 blur-2xl rounded-full" />
      <div>
        <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-black text-lg md:text-xl flex-shrink-0 group-hover:bg-gold group-hover:text-black transition-all duration-500 shadow-lg">
            {barber.name?.charAt(0)?.toUpperCase() || "B"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold font-serif text-white text-lg md:text-2xl group-hover:text-gold transition-colors tracking-tight uppercase truncate">
              {barber.name}
            </h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-gold/60 uppercase tracking-widest mt-1">
              <Icon icon="star" size={10} className="text-gold" />
              <span>{barber.rating || "5.0"}</span>
              <span className="text-white/20">·</span>
              <span>{barber.experience || 5}+ yrs</span>
            </div>
          </div>
        </div>

        {barber.specialization && (
          <p className="text-[10px] text-white/40 font-medium uppercase tracking-wider mb-4 truncate">
            {barber.specialization}
          </p>
        )}

        {/* Availability badge */}
        <div className={`flex items-center gap-1.5 mb-4 rounded-lg px-3 py-1.5 w-fit border text-[9px] font-black uppercase tracking-widest ${
          isBookable
            ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            : "text-red-400/60 bg-red-500/5 border-red-500/10"
        }`}>
          <Icon icon="home" size={10} />
          {isBookable
            ? acceptsHomeService ? "Home Service Available" : "Available"
            : "Currently Unavailable"}
        </div>
      </div>

      <Button
        variant="primary"
        fullWidth
        onClick={onBook}
        disabled={!isBookable}
        aria-label={isBookable ? `Book appointment with ${barber.name}` : `${barber.name} is unavailable`}
        className="font-black uppercase tracking-[0.2em] text-[10px] py-3 md:py-4 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isBookable
          ? acceptsHomeService ? "Book Home Service" : "Book Appointment"
          : "Unavailable"}
      </Button>
    </Card>
  );
}

export function ReviewCard({ review, actions }: {
  review: {
    customerName: string;
    rating: number;
    comment: string;
    date?: string;
    avatar?: string;
  };
  actions?: ReactNode;
}) {
  return (
    <Card className="relative overflow-hidden group p-5 sm:p-8 md:p-12 transition-all duration-700 hover:scale-[1.01] border-white/[0.05] rounded-[20px] md:rounded-[32px]">
      <div className="absolute top-0 right-0 w-48 h-48 bg-gold/[0.03] blur-[100px] rounded-full -mr-24 -mt-24 group-hover:bg-gold/[0.08] transition-all duration-1000" />

      <div className="flex justify-between items-start mb-5 md:mb-10 relative z-10 gap-3">
        <div className="flex items-center gap-3 md:gap-6 min-w-0">
          <div className="w-12 h-12 md:w-20 md:h-20 flex-shrink-0 rounded-xl md:rounded-2xl border border-white/10 bg-background overflow-hidden p-0.5 md:p-1 shadow-2xl ring-1 ring-white/5">
            <img src={resolveAvatarImage(review.avatar, review.customerName)} alt={review.customerName} className="w-full h-full object-cover rounded-lg md:rounded-xl" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base md:text-2xl font-black text-white tracking-tight leading-none mb-1 md:mb-2 italic truncate">{review.customerName}</h3>
            {review.date && (
              <span className="px-2 md:px-3 py-0.5 md:py-1 bg-white/[0.03] border border-white/[0.05] rounded-full text-[10px] md:text-xs text-white/60 font-bold">
                {review.date}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-1.5 bg-background/40 backdrop-blur-xl px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl border border-white/10 flex-shrink-0">
          <Icon icon="star" size={12} className="text-gold" />
          <span className="text-xs md:text-sm font-black text-white pt-0.5">{review.rating.toFixed(1)}</span>
        </div>
      </div>

      <div className="mb-4 md:mb-8 relative z-10">
        <div className="absolute -left-3 md:-left-6 top-0 text-4xl md:text-6xl text-gold/10 font-serif leading-none select-none italic">"</div>
        <p className="text-sm md:text-lg text-white/80 leading-relaxed font-medium mt-2 md:mt-4 italic line-clamp-4 md:line-clamp-none">
          {review.comment}
        </p>
      </div>

      {actions && <div className="mt-4 md:mt-8 flex justify-end">{actions}</div>}
    </Card>
  );
}

export function EmptyState({ icon, title, description, action }: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="py-16 px-16 flex flex-col items-center justify-center border-dashed border-white/10 bg-transparent group overflow-hidden rounded-3xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(212,175,55,0.01),transparent_70%)]" />

      {icon && (
        <div className="w-24 h-24 rounded-3xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-white/10 mb-10 group-hover:scale-110 group-hover:border-gold/10 transition-all duration-1000">
          <div className="text-5xl">{icon}</div>
        </div>
      )}

      <h3 className="text-3xl font-black text-white mb-6 leading-none italic">{title}</h3>
      {description && (
        <p className="text-white/60 text-base mb-12 max-w-sm font-medium leading-relaxed text-center">{description}</p>
      )}
      {action && <div className="animate-fade-up">{action}</div>}
    </Card>
  );
}
