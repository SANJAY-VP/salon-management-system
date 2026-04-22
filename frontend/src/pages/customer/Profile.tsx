import { useState, useEffect } from "react";
import { ProfileLayout } from "../../components/common/ProfileLayout";
import { ProfileEditForm } from "../../components/common/ProfileEditForm";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { BookingCard } from "../../components/common/ReusableCards";
import { ConfirmDialog } from "../../components/common/Modal";
import { useAuthStore } from "../../hooks/useAuthStore";
import { bookingService } from "../../services/booking.service";
import { Booking } from "../../types";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import toast from "react-hot-toast";
import InvoiceModal from "../../components/common/InvoiceModal";
import Pagination from "../../components/common/Pagination";

const PAGE_SIZE = 10;


export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    profileImage: user?.profileImage || "",
  });
  
  const [selectedBookingForInvoice, setSelectedBookingForInvoice] = useState<Booking | null>(null);
  const [bookingPage, setBookingPage] = useState(1);
  const [cancelTarget, setCancelTarget] = useState<string | number | null>(null);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        profileImage: user.profileImage || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await bookingService.getMyBookings();
        setBookings(data);
      } catch {
        // silently ignore
      } finally {
        setLoadingBookings(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      await api.put("/api/v1/auth/me", {
        full_name: profile.name,
        phone: profile.phone,
      });
      updateUser({ name: profile.name, phone: profile.phone });
      setIsEditing(false);
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update profile");
    }
  };

  const handleCancelBooking = async (bookingId: string | number) => {
    const toastId = toast.loading("Cancelling...");
    try {
      await bookingService.cancelBooking(bookingId, "Customer requested");
      setBookings((prev) => prev.map((b) => b.id === bookingId ? { ...b, status: "cancelled" } : b));
      toast.success("Booking cancelled", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to cancel booking", { id: toastId });
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const filteredBookings =
    filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const totalBookingPages = Math.ceil(filteredBookings.length / PAGE_SIZE);
  const paginatedBookings = filteredBookings.slice(
    (bookingPage - 1) * PAGE_SIZE,
    bookingPage * PAGE_SIZE
  );

  const bookingCounts = {
    all: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    completed: bookings.filter((b) => b.status === "completed").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <ProfileLayout
      variant="customer"
      profile={profile}
      isEditing={isEditing}
      onToggleEdit={() => setIsEditing(!isEditing)}
      onLogout={handleLogout}
      menuItems={[
        { label: "Settings", icon: "settings" },
        { label: "Help & Support", icon: "support" },
        { label: "Policies", icon: "terms" },
      ]}
    >
      {isEditing ? (
        <ProfileEditForm
          profile={profile}
          setProfile={setProfile}
          onCancel={() => setIsEditing(false)}
          onSave={handleSave}
        />
      ) : (
        <div className="space-y-6">
          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total", value: bookings.length, color: "text-white" },
              { label: "Confirmed", value: bookingCounts.confirmed, color: "text-emerald-400" },
              { label: "Completed", value: bookingCounts.completed, color: "text-gold" },
            ].map(({ label, value, color }) => (
              <div key={label} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
                <p className={`text-2xl font-bold font-serif ${color}`}>{value}</p>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mt-1">{label}</p>
              </div>
            ))}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {(["all", "confirmed", "completed", "cancelled"] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setBookingPage(1); }}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer ${
                  filter === f ? "bg-gold text-cocoa border-gold" : "bg-white/5 text-white/50 border-white/10 hover:border-gold/30"
                }`}
              >
                {f} ({bookingCounts[f as keyof typeof bookingCounts] ?? bookings.length})
              </button>
            ))}
          </div>

          {/* Booking list */}
          <Card className="bg-transparent border-white/5 p-8 rounded-[40px] bg-white/[0.01]">
            <h3 className="font-bold font-serif text-2xl text-white uppercase tracking-tighter mb-6">
              My Bookings
            </h3>

            {loadingBookings ? (
              <div className="py-12 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
              </div>
            ) : filteredBookings.length === 0 ? (
              <div className="py-16 border border-dashed border-white/10 rounded-[32px] flex flex-col items-center">
                <Icon icon="calendar" size={40} className="text-white/5 mb-4" />
                <p className="text-white/50 uppercase tracking-widest font-black text-[10px]">
                  {filter === "all" ? "No bookings yet" : `No ${filter} bookings`}
                </p>
                {filter === "all" && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-6"
                    onClick={() => navigate("/customer/search")}
                  >
                    Browse Salons
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedBookings.map((b) => (
                    <BookingCard
                      key={b.id}
                      booking={b}
                      onInvoice={(booking) => setSelectedBookingForInvoice(booking)}
                      actions={
                        (b.status === "pending" || b.status === "confirmed") && (
                          <button
                            onClick={() => setCancelTarget(b.id)}
                            className="px-4 py-2 rounded-xl bg-red-500/5 border border-red-500/20 text-[9px] font-black text-red-400 hover:bg-red-500 hover:text-white uppercase tracking-widest transition-all shadow-lg cursor-pointer"
                          >
                            Cancel
                          </button>
                        )
                      }
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={bookingPage}
                  totalPages={totalBookingPages}
                  onPageChange={setBookingPage}
                />
              </>
            )}
          </Card>
        </div>
      )}
      
      {selectedBookingForInvoice && (
        <InvoiceModal 
          isOpen={!!selectedBookingForInvoice} 
          onClose={() => setSelectedBookingForInvoice(null)} 
          booking={selectedBookingForInvoice} 
        />
      )}

      <ConfirmDialog
        isOpen={cancelTarget !== null}
        title="Cancel Booking"
        message="Are you sure you want to cancel this booking? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Booking"
        isDangerous
        onConfirm={() => { if (cancelTarget) handleCancelBooking(cancelTarget); setCancelTarget(null); }}
        onCancel={() => setCancelTarget(null)}
      />
    </ProfileLayout>
  );
}
