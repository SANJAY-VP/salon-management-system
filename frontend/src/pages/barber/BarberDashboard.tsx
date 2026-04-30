import { useState, useEffect, useCallback } from "react";
import { PageLayoutDesktop, PageContainerDesktop } from "../../components/common/Header";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { Modal } from "../../components/common/Modal";
import Input from "../../components/common/Input";
import { LoadingSpinner } from "../../components/common/LoadingSpinner";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shopService, ShopCreate } from "../../services/shop.service";
import { Shop } from "../../types";
import { useNavigate } from "react-router-dom";
import { ShopCard } from "../../components/common/ReusableCards";
import Pagination from "../../components/common/Pagination";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

/** Rejects (0,0), out-of-range, and non-finite values — matches real map coordinates */
function hasValidShopCoordinates(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return false;
  return true;
}

type GeoPromptState = "idle" | "loading" | "ok" | "denied" | "needs_manual";

const EMPTY_FORM: ShopCreate = {
  name: "",
  description: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  phone: "",
  email: "",
  latitude: 0,
  longitude: 0,
  opening_time: "09:00",
  closing_time: "20:00",
  accepts_home_service: false,
};

export default function BarberDashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState<ShopCreate>(EMPTY_FORM);
  const [geoPrompt, setGeoPrompt] = useState<GeoPromptState>("idle");
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(shops.length / PAGE_SIZE);
  const paginatedShops = shops.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);



  // Pre-fill coordinates from user's geolocation (if available)
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      setFormData((prev) => ({
        ...prev,
        latitude: prev.latitude === 0 ? user.latitude! : prev.latitude,
        longitude: prev.longitude === 0 ? user.longitude! : prev.longitude,
      }));
    }
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const myShops = await shopService.getMyShops();
      setShops(myShops);
    } catch (error) {
      console.error("Dashboard data fetch error", error);
      toast.error("Failed to load salons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const requestSalonLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoPrompt("needs_manual");
      toast.error("Geolocation is not supported in this browser. Enter coordinates manually.");
      return;
    }
    setGeoPrompt("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }));
        setGeoPrompt("ok");
        toast.success("Location captured. You can adjust coordinates if needed.");
      },
      (err) => {
        if (err.code === 1) {
          setGeoPrompt("denied");
          toast.error("Location access is required to register a salon.");
        } else {
          setGeoPrompt("needs_manual");
          toast.error(
            "Could not detect your position. Allow location when prompted, or enter latitude and longitude manually."
          );
        }
      },
      { enableHighAccuracy: true, timeout: 25000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (!showAddModal) {
      setGeoPrompt("idle");
      return;
    }
    requestSalonLocation();
  }, [showAddModal, requestSalonLocation]);

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();

    if (geoPrompt === "denied") {
      toast.error(
        "Enable location permission for this site in your browser settings, then try again."
      );
      return;
    }
    if (geoPrompt === "loading") {
      toast.error("Please wait for location, or fix coordinates below.");
      return;
    }
    if (!hasValidShopCoordinates(formData.latitude, formData.longitude)) {
      toast.error(
        "Enter valid map coordinates (not 0,0). Use “Use my location” or type latitude and longitude."
      );
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating your salon...");
    try {
      const newShop = await shopService.createShop(formData);
      setShops((prev) => [...prev, newShop]);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      setGeoPrompt("idle");
      toast.success("Salon created successfully!", { id: toastId });
    } catch (error: any) {
      const msg =
        error?.response?.data?.detail ||
        (Array.isArray(error?.response?.data?.errors)
          ? error.response.data.errors.map((e: any) => e.msg).join(", ")
          : "Failed to create shop");
      toast.error(msg, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <PageLayoutDesktop variant="barber">
      <PageContainerDesktop maxWidth="2xl" className="px-4 sm:px-8 md:px-10 py-8 md:py-12">
        {loading ? (
          <LoadingSpinner className="py-40 min-h-[40vh]" label="Loading salons" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-10 animate-fade-up">
              {paginatedShops.map((shop) => (
                <ShopCard
                  key={shop.id}
                  shop={shop}
                  variant="barber"
                  onClick={() => navigate(`/barber/shop/${shop.id}`)}
                />
              ))}

              {/* Add Salon Card — always last */}
              <button
                type="button"
                onClick={() => {
                  setFormData(EMPTY_FORM);
                  setGeoPrompt("idle");
                  setShowAddModal(true);
                }}
                className="group relative h-full min-h-[400px] border-2 border-dashed border-white/5 hover:border-gold/30 bg-white/[0.01] hover:bg-gold/[0.02] rounded-[40px] transition-all duration-700 flex flex-col items-center justify-center gap-8 cursor-pointer overflow-hidden"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.03),transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <div className="w-24 h-24 rounded-[32px] bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-gold/60 group-hover:text-gold group-hover:scale-110 group-hover:rotate-90 transition-all duration-700 shadow-2xl">
                  <Icon icon="plus" size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-2xl font-bold font-serif text-white/60 group-hover:text-white uppercase tracking-tighter transition-colors mb-2">
                    Add Salon
                  </h3>
                  <p className="text-[10px] font-black text-white/10 group-hover:text-white/50 uppercase tracking-[0.2em] transition-colors">
                    Register a new establishment
                  </p>
                </div>
              </button>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => {
                setPage(p);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </>
        )}

        {/* Add Shop Modal */}
        <Modal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setFormData(EMPTY_FORM);
            setGeoPrompt("idle");
          }}
          title="Register New Salon"
        >
          <form onSubmit={handleAddShop} className="space-y-5 pt-4">
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                geoPrompt === "denied"
                  ? "border-red-500/40 bg-red-500/10 text-red-200"
                  : geoPrompt === "loading"
                    ? "border-gold/30 bg-gold/5 text-white/70"
                    : geoPrompt === "ok"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                      : "border-white/10 bg-white/[0.03] text-white/60"
              }`}
            >
              {geoPrompt === "loading" && (
                <div className="flex justify-center py-1">
                  <LoadingSpinner size="sm" label="Requesting your location" />
                </div>
              )}
              {geoPrompt === "denied" && (
                <span>
                  Location access is blocked. Allow location for this site to register a salon (browser
                  address bar → site settings).
                </span>
              )}
              {geoPrompt === "ok" && <span>Location captured. Fine-tune coordinates below if needed.</span>}
              {geoPrompt === "needs_manual" && (
                <span>
                  GPS unavailable. Enter the salon&apos;s latitude and longitude (from Google Maps pin).
                </span>
              )}
              {geoPrompt === "idle" && <span>Preparing location…</span>}
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="!rounded-xl text-[10px] font-black uppercase tracking-widest"
                onClick={() => requestSalonLocation()}
                disabled={geoPrompt === "loading"}
              >
                Use my location
              </Button>
            </div>
            <Input
              label="Salon Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Royal Heritage Salon"
              required
            />
            <Input
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Briefly describe your salon"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="10-digit number"
                maxLength={10}
                required
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@salon.com"
              />
            </div>

            <Input
              label="Street Address *"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building / street"
              required
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
              <Input
                label="State *"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
              <Input
                label="Pincode *"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="6-digit"
                maxLength={6}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Latitude *"
                type="number"
                value={formData.latitude}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = parseFloat(v);
                  setFormData({
                    ...formData,
                    latitude: v === "" || Number.isNaN(n) ? 0 : n,
                  });
                }}
                placeholder="e.g. 19.0760"
                step="any"
                required
              />
              <Input
                label="Longitude *"
                type="number"
                value={formData.longitude}
                onChange={(e) => {
                  const v = e.target.value;
                  const n = parseFloat(v);
                  setFormData({
                    ...formData,
                    longitude: v === "" || Number.isNaN(n) ? 0 : n,
                  });
                }}
                placeholder="e.g. 72.8777"
                step="any"
                required
              />
            </div>


            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-cream/60 uppercase tracking-wider mb-1.5">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={formData.opening_time}
                  onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-cream/60 uppercase tracking-wider mb-1.5">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={formData.closing_time}
                  onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-gold/50"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={formData.accepts_home_service}
                onChange={(e) => setFormData({ ...formData, accepts_home_service: e.target.checked })}
                className="w-4 h-4 accent-gold rounded"
              />
              <span className="text-sm text-cream/60 group-hover:text-cream transition-colors">
                Accepts home service
              </span>
            </label>

            <div className="flex gap-4 pt-4 border-t border-white/5">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowAddModal(false);
                  setFormData(EMPTY_FORM);
                  setGeoPrompt("idle");
                }}
                className="py-4 !rounded-2xl uppercase tracking-[0.3em] text-[10px] font-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={
                  submitting ||
                  geoPrompt === "loading" ||
                  geoPrompt === "denied" ||
                  !hasValidShopCoordinates(formData.latitude, formData.longitude)
                }
                className="py-4 !rounded-2xl uppercase tracking-[0.3em] text-[10px] font-black shadow-2xl shadow-gold/20"
              >
                {submitting ? "Creating..." : "Create Salon"}
              </Button>
            </div>
          </form>
        </Modal>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
