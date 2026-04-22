import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PageLayoutDesktop, PageContainerDesktop } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import BackButton from "../../components/common/BackButton";
import { BookingCard } from "../../components/common/ReusableCards";
import { ConfirmDialog } from "../../components/common/Modal";
import { shopService } from "../../services/shop.service";
import { slotService } from "../../services/slot.service";
import { bookingService } from "../../services/booking.service";
import { reviewService } from "../../services/review.service";
import ServiceManagement from "../../components/barber/ServiceManagement";
import BarberManagement from "../../components/barber/BarberManagement";
import ShopCalendar from "../../components/barber/ShopCalendar";
import { barberService } from "../../services/barber.service";
import { Shop, TimeSlot, Booking, Review, Barber } from "../../types";
import ShopEditModal from "../../components/barber/ShopEditModal";
import InvoiceModal from "../../components/common/InvoiceModal";
import ImageUploader from "../../components/common/ImageUploader";
import Pagination from "../../components/common/Pagination";
import { resolveShopImage } from "../../config/images";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

const TABS = [
  { id: "overview", label: "Overview", icon: "dashboard" },
  { id: "barbers", label: "Barbers", icon: "profile" },
  { id: "services", label: "Services", icon: "settings" },
  { id: "calendar", label: "Calendar", icon: "calendar" },
  { id: "reviews", label: "Reviews", icon: "star" },
];

export default function ShopDetails() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();

  const [shop, setShop] = useState<Shop | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [expandedReview, setExpandedReview] = useState<string | number | null>(null);
  const [isEditingShop, setIsEditingShop] = useState(false);
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Per-tab pagination
  const [barberPage, setBarberPage] = useState(1);
  const [reviewPage, setReviewPage] = useState(1);

  const paginatedBarbers = useMemo(
    () => barbers.slice((barberPage - 1) * PAGE_SIZE, barberPage * PAGE_SIZE),
    [barbers, barberPage]
  );
  const paginatedReviews = useMemo(
    () => reviews.slice((reviewPage - 1) * PAGE_SIZE, reviewPage * PAGE_SIZE),
    [reviews, reviewPage]
  );

  useEffect(() => {
    if (shopId) fetchShopData();
  }, [shopId]);

  const fetchShopData = async () => {
    if (!shopId) return;
    setLoading(true);
    try {
      const [shopData, slotsData, bookingsData, reviewsData, barbersData] = await Promise.all([
        shopService.getShopById(shopId),
        slotService.getShopSlots(shopId),
        bookingService.getShopBookings(shopId),
        reviewService.getShopReviews(shopId),
        barberService.getShopBarbers(shopId),
      ]);
      setShop(shopData);

      setSlots(slotsData);
      setBookings(bookingsData);
      
      // Map reviews to include customerName
      const mappedReviews = reviewsData.map((r: any) => ({
        ...r,
        customerName: r.user?.full_name || "Guest",
      }));
      setReviews(mappedReviews);
      
      setBarbers(barbersData);
    } catch (error) {
      console.error("Failed to fetch shop data:", error);
      toast.error("Failed to load shop data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleShopStatus = async () => {
    if (!shop) return;
    const next = !shop.isOpen;
    const toastId = toast.loading(next ? "Opening salon..." : "Closing salon...");
    try {
      const updated = await shopService.toggleShopStatus(shop.id, next);
      setShop(updated);
      toast.success(next ? "Salon is now open" : "Salon is now closed", { id: toastId });
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update status", { id: toastId });
    }
  };

  const handleDeleteShop = async () => {
    if (!shop) return;
    const toastId = toast.loading("Deleting salon...");
    try {
      await shopService.deleteShop(shop.id);
      toast.success("Salon deleted", { id: toastId });
      navigate("/barber/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to delete shop", { id: toastId });
    }
  };



  if (loading) {
    return (
      <PageLayoutDesktop variant="barber">
        <PageContainerDesktop className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-14 h-14 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
          <div className="text-gold/60 font-serif tracking-[0.3em] uppercase text-sm animate-pulse">Loading...</div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  if (!shop) {
    return (
      <PageLayoutDesktop variant="barber">
        <PageContainerDesktop maxWidth="md" className="text-center py-40">
          <h2 className="text-4xl font-serif text-white mb-6 uppercase tracking-tighter">Shop Not Found</h2>
          <Button onClick={() => navigate("/barber/dashboard")} variant="primary">
            Return to Dashboard
          </Button>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  const revenue = bookings
    .filter((b) => b.status === "completed")
    .reduce((acc, b) => acc + ((b as any).service?.price || 0), 0);

  const availableSlots = slots.filter((s) => s.status === "available" || s.status === "AVAILABLE").length;

  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="2xl" className="px-8 py-12">

        {/* Back Button */}
        <div className="mb-10 animate-fade-in">
          <BackButton to="/barber/dashboard" label="Back" />
        </div>

        {/* Shop Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 md:gap-8 mb-8 md:mb-16 animate-fade-up">
          <div className="flex items-center gap-4 md:gap-8">
            <ImageUploader
              variant="shop"
              context="shop"
              entityId={shop.id}
              initialUrl={resolveShopImage(shop.images || shop.shopImage)}
              name={shop.name}
              onUpload={async (result) => {
                try {
                  const updated = await shopService.updateShop(shop.id, { images: result.filename });
                  setShop(updated);
                } catch {
                  toast.error("Failed to save image.");
                }
              }}
              className="w-28 h-28 flex-shrink-0 border border-gold/10 shadow-2xl"
            />
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl md:text-5xl font-bold font-serif text-white tracking-tighter uppercase">{shop.name}</h1>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${shop.isOpen ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}>
                  {shop.isOpen ? "Open" : "Closed"}
                </span>
              </div>
              <div className="flex items-center gap-6 text-cream/50 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-2"><Icon icon="location" size={12} className="text-gold" />{shop.city}</span>
                <span className="flex items-center gap-2"><Icon icon="star" size={12} className="text-gold" />{shop.rating?.toFixed(1)} ({shop.reviewCount})</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="primary"
              onClick={handleToggleShopStatus}
              className={`!rounded-xl px-8 py-4 text-[10px] font-black uppercase tracking-widest ${shop.isOpen ? "!bg-red-500/10 !text-red-400 !border !border-red-500/20" : "shadow-gold/20"
                }`}
            >
              {shop.isOpen ? "Close Salon" : "Open Salon"}
            </Button>

          </div>
        </div>

        {/* Tabs */}
        <div
          role="tablist"
          className="bg-white/5 p-1.5 rounded-2xl md:rounded-[28px] border border-white/5 mb-8 md:mb-12 animate-fade-up overflow-x-auto scrollbar-hide"
        >
          <div className="flex md:grid md:grid-cols-5 gap-1 md:gap-1.5 min-w-max md:min-w-0">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center justify-center gap-2 py-3 md:py-4 px-4 md:px-2 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500 whitespace-nowrap ${
                    isActive
                      ? "bg-gold text-black/80 shadow-2xl scale-[1.02]"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon icon={tab.icon as any} size={13} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px] animate-fade-in mb-24">

          {/* ── Overview ─────────────────────────────────────────────────────── */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Stats table + recent bookings */}
              <div className="lg:col-span-2 space-y-8">
                {/* Stats table */}
                <Card className="p-8 bg-white/[0.02] border-white/5 rounded-[32px] overflow-hidden">
                  <h3 className="text-xs font-black text-gold/80 uppercase tracking-widest mb-6">Performance Overview</h3>
                  <table className="w-full">
                    <tbody className="divide-y divide-white/5">
                      {[
                        { label: "Total Revenue", value: `₹${revenue.toLocaleString()}`, color: "text-gold" },
                        { label: "Active Barbers", value: barbers.length, color: "text-white" },
                        { label: "Total Bookings", value: bookings.length, color: "text-white" },
                        { label: "Available Slots", value: availableSlots, color: "text-emerald-400" },
                        { label: "Average Rating", value: `${shop.rating?.toFixed(1) || "—"} ★`, color: "text-gold" },
                        { label: "Total Reviews", value: shop.reviewCount || 0, color: "text-white" },
                      ].map(({ label, value, color }) => (
                        <tr key={label} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4 text-[13px] font-medium text-white/80 capitalize">{label}</td>
                          <td className={`py-4 px-4 text-right text-lg font-bold font-serif ${color}`}>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Card>

                {/* Recent bookings */}
                <Card className="p-8 bg-white/[0.02] border-white/5 rounded-[32px]">
                  <h3 className="text-xs font-black text-gold/80 uppercase tracking-widest mb-6">Recent Bookings</h3>
                  {bookings.length === 0 ? (
                    <p className="text-[11px] text-white/30 uppercase tracking-widest py-8 text-center">No bookings yet</p>
                  ) : (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((b: any) => (
                        <BookingCard key={b.id} booking={b} />
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Right sidebar: shop info + controls */}
              <div className="space-y-6">
                <Card className="p-8 bg-white/[0.02] border-white/5 rounded-[32px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-gold/80 uppercase tracking-widest">Shop Details</h3>
                    <button
                      onClick={() => setIsEditingShop(true)}
                      className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-gold hover:bg-gold hover:text-black uppercase tracking-widest transition-all flex items-center gap-2 group/edit"
                    >
                      Edit Details
                    </button>
                  </div>
                  <div className="space-y-5">
                    {[
                      { icon: "scissors", label: "Name", value: shop.name },
                      { icon: "location", label: "Address", value: `${shop.address}, ${shop.city}` },
                      { icon: "phone", label: "Phone", value: shop.phone || "—" },
                      { icon: "email", label: "Email", value: shop.email || "—" },
                      { icon: "clock", label: "Hours", value: `${shop.openingTime || "—"} – ${shop.closingTime || "—"}` },
                      { icon: "check", label: "Home Service", value: shop.acceptsHomeService ? "Available" : "Not Available" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gold/50 flex-shrink-0 mt-0.5">
                          <Icon icon={item.icon as any} size={12} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-0.5">{item.label}</p>
                          <p className="text-sm font-medium text-white/70 truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full p-5 rounded-2xl border border-red-500/30 
bg-red-500/10 hover:bg-red-500/20 
flex items-center justify-between 
transition-all duration-300 group cursor-pointer"
                  title="Delete Shop"
                >
                  {/* Left: Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center 
bg-red-500/20 text-red-300 
transition-all duration-300 
group-hover:bg-red-500 group-hover:text-white group-hover:scale-110"
                  >
                    <Icon icon="delete" size={18} />
                  </div>

                  {/* Center: Text */}
                  <p className="text-sm font-semibold text-red-300 tracking-tight 
group-hover:text-white transition-colors">
                    Delete Shop
                  </p>

                  {/* Right: subtle arrow / spacer */}
                  <div className="w-6" />
                </button>
              </div>
            </div>
          )}

          {activeTab === "barbers" && (
            <>
              <BarberManagement shopId={shop.id} />
              <Pagination
                currentPage={barberPage}
                totalPages={Math.ceil(barbers.length / PAGE_SIZE)}
                onPageChange={setBarberPage}
                className="mt-4"
              />
            </>
          )}

          {activeTab === "services" && <ServiceManagement shopId={shop.id} />}

          {activeTab === "calendar" && (
            <ShopCalendar
              shopId={shop.id}
              slots={slots}
              bookings={bookings}
              barbers={barbers}
              shop={shop}
            />
          )}

          {/* ── Reviews ───────────────────────────────────────────────────────── */}
          {activeTab === "reviews" && (
            <div className="max-w-3xl mx-auto">
              {reviews.length === 0 ? (
                <div className="py-32 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gold/30 mb-8 border border-white/5">
                    <Icon icon="star" size={32} />
                  </div>
                  <h3 className="text-2xl font-serif text-white mb-3 uppercase tracking-tighter">No Reviews Yet</h3>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest text-center">
                    Client testimonials will appear once the salon receives bookings.
                  </p>
                </div>
              ) : (
                <>
                <div className="space-y-3">
                  {paginatedReviews.map((review) => {
                    const isExpanded = expandedReview === review.id;
                    const name = review.customerName || "Anonymous";
                    const date = review.createdAt;

                    return (
                      <div
                        key={review.id}
                        className="border border-white/5 rounded-2xl bg-white/[0.02] hover:border-gold/20 transition-all duration-300 overflow-hidden"
                      >
                        {/* Accordion header */}
                        <button
                          className="w-full flex items-center justify-between p-6 text-left"
                          onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-gold/10 text-gold flex items-center justify-center font-black text-base flex-shrink-0">
                              {name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white uppercase tracking-tight">{name}</p>
                              {date && (
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-0.5">
                                  {new Date(date).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  icon="star"
                                  size={13}
                                  className={star <= review.rating ? "text-gold" : "text-white/10"}
                                />
                              ))}
                              <span className="text-sm font-bold text-gold ml-1">{review.rating}</span>
                            </div>
                            <Icon
                              icon={isExpanded ? "chevronLeft" : "chevronRight"}
                              size={14}
                              className={`text-white/50 transition-transform duration-300 ${isExpanded ? "rotate-90" : "-rotate-90"}`}
                            />
                          </div>
                        </button>

                        {/* Accordion body */}
                        {isExpanded && (
                          <div className="px-6 pb-6 border-t border-white/5">
                            {review.title && (
                              <p className="text-sm font-bold text-gold/80 mt-4 mb-2">{review.title}</p>
                            )}
                            <p className="text-sm text-white/60 leading-relaxed italic">
                              "{review.comment || "No comment provided."}"
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <Pagination
                  currentPage={reviewPage}
                  totalPages={Math.ceil(reviews.length / PAGE_SIZE)}
                  onPageChange={setReviewPage}
                />
                </>
              )}
            </div>
          )}
        </div>
        
        <ShopEditModal
          isOpen={isEditingShop}
          onClose={() => setIsEditingShop(false)}
          shop={shop}
          onUpdate={(updated) => setShop(updated)}
          updateShop={shopService.updateShop}
        />

        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Delete Salon"
          message={`Are you sure you want to permanently delete "${shop?.name}"? This action cannot be undone and all associated data will be lost.`}
          confirmText="Delete Permanently"
          cancelText="Cancel"
          isDangerous
          onConfirm={() => { setShowDeleteConfirm(false); handleDeleteShop(); }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
