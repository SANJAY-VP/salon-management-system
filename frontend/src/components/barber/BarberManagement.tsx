import { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import Input from "../common/Input";
import { Modal } from "../common/Modal";
import { Icon } from "../common/Icon";
import { barberService } from "../../services/barber.service";
import { toast } from "react-hot-toast";
import { Barber } from "../../types";
import React from "react";
import { serviceService, ServiceResponse } from "../../services/service.service";

interface BarberManagementProps {
  shopId: string | number;
}

export default function BarberManagement({ shopId }: BarberManagementProps) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    experience_years: 0,
    specialization: "",
    bio: "",
    is_active: true
  });
  const [shopServices, setShopServices] = useState<ServiceResponse[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<number[]>([]);

  const normalizeBarber = (b: any): Barber => ({
    ...b,
    experience: b.experience_years ?? b.experience ?? 0,
    isActive: b.is_active ?? b.isActive ?? true
  });

  useEffect(() => {
    fetchBarbers();
    fetchShopServices();
  }, [shopId]);

  const fetchShopServices = async () => {
    try {
      const services = await serviceService.getShopServices(shopId);
      setShopServices(services);
    } catch (err) {
      console.error("Failed to fetch services", err);
    }
  };

  const fetchBarbers = async () => {
    setLoading(true);
    try {
      const data = await barberService.getShopBarbers(shopId);
      setBarbers(data.map(normalizeBarber));
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to fetch barbers");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newBarber = await barberService.createBarber({
        shop_id: Number(shopId),
        ...formData
      });
      setBarbers([...barbers, normalizeBarber(newBarber)]);
      setShowAddModal(false);
      resetForm();
      toast.success("Barber added successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to add barber");
    } finally {
      setLoading(false);
    }
  };

  const handleEditBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBarber) return;

    setLoading(true);
    try {
      const updatedBarber = await barberService.updateBarber(editingBarber.id, formData);
      setBarbers(barbers.map(b => b.id === updatedBarber.id ? normalizeBarber(updatedBarber) : b));
      setShowEditModal(false);
      setEditingBarber(null);
      resetForm();
      toast.success("Barber updated successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update barber");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBarber = async (barberId: number) => {
    if (!confirm("Are you sure you want to remove this barber?")) return;

    setLoading(true);
    try {
      await barberService.deleteBarber(barberId);
      setBarbers(barbers.filter(b => b.id !== barberId));
      toast.success("Barber removed successfully!");
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to remove barber");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles the barber's active status.
   * When a barber is ACTIVE  → they appear in the customer's "Barbers" tab and can be booked
   *                            for home-service appointments.
   * When INACTIVE → hidden from customers; no bookings accepted.
   */
  const toggleBarberStatus = async (barberId: number, isActive: boolean) => {
    try {
      const updatedBarber = await barberService.updateBarber(barberId, { is_active: isActive });
      setBarbers(barbers.map(b =>
        b.id === barberId
          ? { ...updatedBarber, isActive: (updatedBarber as any).is_active ?? updatedBarber.isActive ?? isActive }
          : b
      ));
      toast.success(
        isActive
          ? "home service bookings activated"
          : "home service bookings paused"
      );
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || "Failed to update barber status");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      experience_years: 0,
      specialization: "",
      bio: "",
      is_active: true
    });
    setSelectedServiceIds([]);
  };

  const toggleService = (service: ServiceResponse) => {
    const isSelected = selectedServiceIds.includes(service.id);
    let newIds;
    if (isSelected) {
      newIds = selectedServiceIds.filter(id => id !== service.id);
    } else {
      newIds = [...selectedServiceIds, service.id];
    }
    setSelectedServiceIds(newIds);

    // Update specialization field with selected service names
    const names = shopServices
      .filter(s => newIds.includes(s.id))
      .map(s => s.name)
      .join(", ");
    setFormData(prev => ({ ...prev, specialization: names }));
  };

  const openEditModal = (barber: Barber) => {
    setEditingBarber(barber);
    setFormData({
      name: barber.name,
      email: barber.email || "",
      phone: barber.phone || "",
      experience_years: barber.experience || 0,
      specialization: barber.specialization || "",
      bio: barber.bio || "",
      is_active: (barber as any).isActive !== false
    });

    // Pre-select services based on specialization string
    if (barber.specialization) {
      const names = barber.specialization.split(",").map(s => s.trim());
      const ids = shopServices
        .filter(s => names.includes(s.name))
        .map(s => s.id);
      setSelectedServiceIds(ids);
    } else {
      setSelectedServiceIds([]);
    }
    setShowEditModal(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-gold text-xl animate-pulse">Loading barbers...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-cream">Barber Management</h3>
        <Button
          variant="primary"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Add Barber
        </Button>
      </div>

      {barbers.length === 0 ? (
        <Card className="text-center py-12">
          <Icon icon="profile" size={48} className="text-cream/50 mx-auto mb-4" />
          <h3 className="text-xl text-cream mb-2">No barbers yet</h3>
          <p className="text-cream/60 mb-6">Add barbers to your team to manage appointments</p>
          <Button
            variant="primary"
            onClick={() => setShowAddModal(true)}
          >
            Add Your First Barber
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {barbers.map((barber) => (
            <Card key={barber.id} className="p-8 bg-white/[0.02] border-white/5 rounded-[32px] hover:border-gold/20 transition-all duration-700 group relative overflow-hidden">
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/[0.02] blur-3xl group-hover:bg-gold/[0.05] transition-all" />

              <div className="flex justify-between items-start relative z-10">
                <div className="flex flex-col gap-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[28px] bg-gold/10 border border-gold/20 p-1 group-hover:scale-105 transition-transform duration-700 shadow-2xl">
                      <div className="w-full h-full rounded-[24px] bg-gold/5 flex items-center justify-center overflow-hidden">
                        {(barber.profileImage) ? (
                          <img src={barber.profileImage} alt={barber.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl text-gold font-serif font-bold">{barber.name.charAt(0)}</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-4 mb-2">
                        <h4 className="text-2xl font-bold text-white font-serif tracking-tighter uppercase">{barber.name}</h4>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${barber.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                          {barber.isActive ? " Home Service ON" : "Home Service OFF"}
                        </span>
                      </div>
                      <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] font-serif italic">Craftsman Specialist</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                    {[
                      { icon: "phone", value: barber.phone || "No line", label: "Contact" },
                      { icon: "star", value: `${barber.experience || 0} Years`, label: "Mastery" },
                      { icon: "email", value: barber.email || "No dispatch", label: "Correspondence" },
                      { icon: "settings", value: barber.specialization || "Hair cut", label: "Signature" }
                    ].map((stat) => (
                      <div key={stat.label} className="group/stat">
                        <div className="flex items-center gap-2 mb-1.5 opacity-50 group-hover/stat:opacity-100 transition-opacity">
                          <Icon icon={stat.icon as any} size={10} className="text-gold" />
                          <span className="text-[8px] font-black text-white uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <p className="text-xs font-bold text-white/70 group-hover/stat:text-white transition-colors">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-8 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(barber)}
                    className="w-9 h-9 rounded-[12px] bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/30 hover:text-gold hover:border-gold/30 transition-all"
                    title="Edit"
                  >
                    <Icon icon="settings" size={13} />
                  </button>
                  <button
                    onClick={() => toggleBarberStatus(Number(barber.id), !barber.isActive)}
                    className={`w-9 h-9 rounded-[12px] border flex items-center justify-center transition-all ${barber.isActive ? "bg-red-500/5 border-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/40 hover:bg-emerald-500 hover:text-white"}`}
                    title={barber.isActive ? "Disable home service for this barber" : "Enable home service for this barber"}
                  >
                    <Icon icon={barber.isActive ? "times" : "check"} size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteBarber(Number(barber.id))}
                    className="w-9 h-9 rounded-[12px] bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete"
                  >
                    <Icon icon="delete" size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Barber Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Barber"
      >
        <form onSubmit={handleAddBarber} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter barber's full name"
            required
          />
          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
          <Input
            label="Experience (years)"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.experience_years === 0 ? "" : formData.experience_years.toString()}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, experience_years: val ? parseInt(val) : 0 });
            }}
            placeholder="Years of experience"
          />
          <div className="space-y-3">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 ml-1">
              Provided Services
            </label>
            <div className="flex flex-wrap gap-2">
              {shopServices.length === 0 ? (
                <p className="text-xs text-white/30 italic px-2">No services defined in shop. Please add services first.</p>
              ) : (
                shopServices.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedServiceIds.includes(service.id)
                        ? "bg-gold text-cocoa border-gold"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-gold/30"
                      }`}
                  >
                    {service.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Adding..." : "Add Barber"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Barber Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Barber"
      >
        <form onSubmit={handleEditBarber} className="space-y-4">
          <Input
            label="Full Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter barber's full name"
            required
          />
          <Input
            type="email"
            label="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter email address"
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
          <Input
            label="Experience (years)"
            inputMode="numeric"
            pattern="[0-9]*"
            value={formData.experience_years === 0 ? "" : formData.experience_years.toString()}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '');
              setFormData({ ...formData, experience_years: val ? parseInt(val) : 0 });
            }}
            placeholder="Years of experience"
          />
          <div className="space-y-3">
            <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-3 ml-1">
              Provided Services
            </label>
            <div className="flex flex-wrap gap-2">
              {shopServices.length === 0 ? (
                <p className="text-xs text-white/30 italic px-2">No services defined in shop.</p>
              ) : (
                shopServices.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedServiceIds.includes(service.id)
                        ? "bg-gold text-cocoa border-gold"
                        : "bg-white/5 text-white/50 border-white/10 hover:border-gold/30"
                      }`}
                  >
                    {service.name}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setShowEditModal(false); setEditingBarber(null); }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Updating..." : "Update Barber"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
