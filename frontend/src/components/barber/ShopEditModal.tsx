import { useState, useEffect } from "react";
import { Modal } from "../common/Modal";
import { Shop } from "../../types";
import { ShopUpdate } from "../../services/shop.service";
import Button from "../common/Button";
import { Icon } from "../common/Icon";
import toast from "react-hot-toast";

interface ShopEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: Shop;
  onUpdate: (updatedShop: Shop) => void;
  updateShop: (id: string | number, data: any) => Promise<Shop>;
}

export default function ShopEditModal({ isOpen, onClose, shop, onUpdate, updateShop }: ShopEditModalProps) {
  const [formData, setFormData] = useState({
    name: shop.name,
    description: shop.description || "",
    phone: shop.phone,
    email: shop.email || "",
    address: shop.address,
    city: shop.city,
    state: shop.state,
    pincode: shop.pincode,
    opening_time: shop.openingTime || "09:00",
    closing_time: shop.closingTime || "21:00",
    accepts_home_service: shop.acceptsHomeService || false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: shop.name,
        description: shop.description || "",
        phone: shop.phone,
        email: shop.email || "",
        address: shop.address,
        city: shop.city,
        state: shop.state,
        pincode: shop.pincode,
        opening_time: shop.openingTime || "09:00",
        closing_time: shop.closingTime || "21:00",
        accepts_home_service: shop.acceptsHomeService || false,
      });
    }
  }, [isOpen, shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const toastId = toast.loading("Updating shop details...");
    try {
      const updated = await updateShop(shop.id, formData);
      onUpdate(updated);
      toast.success("Shop information updated", { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update shop", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Salon Information">
      <form onSubmit={handleSubmit} className="space-y-6 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Salon Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Full Address</label>
          <input
            name="address"
            value={formData.address}
            onChange={handleChange}
            required
            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">City</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">State</label>
            <input
              name="state"
              value={formData.state}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Pincode</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Opening Time</label>
            <input
              type="time"
              name="opening_time"
              value={formData.opening_time}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-white/40 uppercase tracking-widest pl-1">Closing Time</label>
            <input
              type="time"
              name="closing_time"
              value={formData.closing_time}
              onChange={handleChange}
              required
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
          <input
            type="checkbox"
            name="accepts_home_service"
            id="home_service"
            checked={formData.accepts_home_service}
            onChange={handleChange}
            className="w-5 h-5 accent-gold border-white/20 bg-transparent rounded"
          />
          <label htmlFor="home_service" className="text-sm font-bold text-white cursor-pointer select-none">
            Accept Home Service?
          </label>
        </div>

        <div className="flex gap-4 pt-6">
          <Button variant="secondary" onClick={onClose} fullWidth className="!rounded-xl py-4 uppercase font-black tracking-widest text-[11px]">
            Cancel
          </Button>
          <Button variant="primary" type="submit" fullWidth disabled={isSubmitting} className="!rounded-xl py-4 uppercase font-black tracking-widest text-[11px]">
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
