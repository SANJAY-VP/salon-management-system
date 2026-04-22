import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop } from "../../components/common/Header";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { Modal } from "../../components/common/Modal";
import Input from "../../components/common/Input";
import { useAuthStore } from "../../hooks/useAuthStore";
import { shopService, ShopCreate } from "../../services/shop.service";
import { Shop } from "../../types";
import { useNavigate } from "react-router-dom";
import { ShopCard } from "../../components/common/ReusableCards";
import Pagination from "../../components/common/Pagination";
import toast from "react-hot-toast";

const PAGE_SIZE = 10;

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

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.latitude || !formData.longitude) {
      toast.error("Please enter valid coordinates (latitude & longitude)");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Creating your salon...");
    try {
      const newShop = await shopService.createShop(formData);
      setShops((prev) => [...prev, newShop]);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
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
      <PageContainerDesktop maxWidth="2xl" className="px-10 py-12">
        {loading ? (
          <div className="py-40 text-center">
            <div className="inline-block w-12 h-12 border-2 border-gold/10 border-t-gold rounded-full animate-spin mb-10" />
            <p className="text-gold/50 font-bold text-[11px] tracking-widest uppercase animate-pulse">Fetching Salon Data</p>
          </div>
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
                onClick={() => setShowAddModal(true)}
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
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Register New Salon">
          <form onSubmit={handleAddShop} className="space-y-5 pt-4">
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
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                placeholder="e.g. 19.0760"
                step="any"
                required
              />
              <Input
                label="Longitude *"
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
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
                onClick={() => setShowAddModal(false)}
                className="py-4 !rounded-2xl uppercase tracking-[0.3em] text-[10px] font-black"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={submitting}
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
