import { useState, useEffect } from "react";
import Card from "../common/Card";
import Button from "../common/Button";
import { Modal, ConfirmDialog } from "../common/Modal";
import { Icon } from "../common/Icon";
import {
  serviceService,
  ServiceResponse,
  ServiceCreate,
  ServiceUpdate,
  SERVICE_CATEGORIES,
  ServiceCategory,
} from "../../services/service.service";
import toast from "react-hot-toast";

interface ServiceManagementProps {
  shopId: string | number;
}

const EMPTY_FORM: ServiceCreate = {
  name: "",
  description: "",
  category: "haircut",
  duration_minutes: 30,
  price: 0,
};

// ─── ServiceForm is defined OUTSIDE to prevent re-mount on parent re-renders ──
interface ServiceFormProps {
  formData: ServiceCreate;
  onChange: (data: ServiceCreate) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
}

function ServiceForm({ formData, onChange, onSubmit, onCancel, submitLabel }: ServiceFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 ml-1">
          Service Name *
        </label>
        <input
          value={formData.name}
          onChange={(e) => onChange({ ...formData, name: e.target.value })}
          placeholder="e.g. Haircut, Beard Trim"
          required
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all"
        />
      </div>

      <div>
        <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 ml-1">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => onChange({ ...formData, description: e.target.value })}
          placeholder="Brief description of the service"
          rows={3}
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-gold/50 focus:bg-white/[0.08] transition-all resize-none"
        />
      </div>

      <div>
        <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 ml-1">
          Category *
        </label>
        <select
          value={formData.category}
          onChange={(e) => onChange({ ...formData, category: e.target.value as ServiceCategory })}
          required
          className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:border-gold/50 transition-all cursor-pointer"
        >
          {SERVICE_CATEGORIES.map((cat) => (
            <option key={cat.value} value={cat.value} className="bg-[#1a1a1a]">
              {cat.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 ml-1">
            Duration (min) *
          </label>
          <input
            type="number"
            value={formData.duration_minutes}
            onChange={(e) => onChange({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
            min={15}
            max={300}
            required
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:border-gold/50 transition-all"
          />
        </div>
        <div>
          <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 ml-1">
            Price (₹) *
          </label>
          <input
            type="number"
            value={formData.price}
            onChange={(e) => onChange({ ...formData, price: parseFloat(e.target.value) || 0 })}
            min={0}
            step="0.01"
            required
            className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-5 py-3 text-white text-sm focus:outline-none focus:border-gold/50 transition-all"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

// ──────────────────────────────────────────────────────────────────────────────

export default function ServiceManagement({ shopId }: ServiceManagementProps) {
  const [services, setServices] = useState<ServiceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceResponse | null>(null);
  const [formData, setFormData] = useState<ServiceCreate>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<string | number | null>(null);

  useEffect(() => {
    if (shopId) fetchServices();
  }, [shopId]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const data = await serviceService.getShopServices(shopId, true);
      setServices(data);
    } catch {
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Adding service...");
    try {
      const newService = await serviceService.createService(shopId, formData);
      setServices((prev) => [...prev, newService]);
      setShowAddModal(false);
      setFormData(EMPTY_FORM);
      toast.success("Service added successfully!", { id: toastId });
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data?.errors)
          ? err.response.data.errors.map((e: any) => `${e.loc?.slice(-1)}: ${e.msg}`).join("; ")
          : "Failed to add service");
      toast.error(msg, { id: toastId });
    }
  };

  const handleEditService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    const toastId = toast.loading("Updating service...");
    try {
      const updatePayload: ServiceUpdate = {
        name: formData.name,
        description: formData.description,
        category: formData.category as ServiceCategory,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
      };
      const updated = await serviceService.updateService(editingService.id, updatePayload);
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      setShowEditModal(false);
      setEditingService(null);
      setFormData(EMPTY_FORM);
      toast.success("Service updated!", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to update service", { id: toastId });
    }
  };

  const handleDeleteService = async (serviceId: string | number) => {
    const toastId = toast.loading("Deleting...");
    try {
      await serviceService.deleteService(serviceId);
      setServices((prev) => prev.filter((s) => s.id !== serviceId));
      toast.success("Service deleted", { id: toastId });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Failed to delete service", { id: toastId });
    }
  };

  const toggleStatus = async (serviceId: string | number, isActive: boolean) => {
    try {
      const updated = await serviceService.updateService(serviceId, { is_active: isActive });
      setServices((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
      toast.success(isActive ? "Service activated" : "Service deactivated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const openEditModal = (service: ServiceResponse) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description || "",
      category: service.category,
      duration_minutes: service.duration_minutes,
      price: service.price,
    });
    setShowEditModal(true);
  };

  const openAddModal = () => {
    setFormData(EMPTY_FORM);
    setShowAddModal(true);
  };

  if (loading && services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-gold/20 border-t-gold rounded-full animate-spin mb-4" />
        <div className="text-gold/60 text-sm font-medium animate-pulse">Loading services...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-cream font-serif uppercase tracking-tighter">Services</h2>
        <Button variant="primary" onClick={openAddModal} className="flex items-center gap-2 !rounded-xl px-6">
          <Icon icon="plus" size={16} />
          Add Service
        </Button>
      </div>

      {services.length === 0 ? (
        <Card className="text-center py-16 border-dashed border-white/10">
          <Icon icon="scissors" size={48} className="text-white/10 mx-auto mb-6" />
          <h3 className="text-xl text-cream mb-3 font-serif uppercase tracking-tighter">No services yet</h3>
          <p className="text-cream/60 mb-8 text-sm">Add your first service to start accepting bookings</p>
          <Button variant="primary" onClick={openAddModal}>
            Add First Service
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((service) => (
            <Card
              key={service.id}
              className="p-8 bg-white/[0.02] border-white/5 rounded-[32px] hover:border-gold/20 transition-all duration-700 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/[0.02] blur-3xl group-hover:bg-gold/[0.05] transition-all" />

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-4 flex-1 min-w-0 pr-4">
                  <div className="flex items-center gap-3">
                 
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight truncate">{service.name}</h3>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                        {SERVICE_CATEGORIES.find((c) => c.value === service.category)?.label || service.category}
                      </span>
                    </div>
                  </div>

                  {service.description && (
                    <p className="text-xs text-white/60 leading-relaxed italic line-clamp-2">"{service.description}"</p>
                  )}

                  <div className="flex items-center gap-6 pt-3 border-t border-white/5">
                    <div>
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Price</span>
                      <span className="text-xl font-bold font-serif text-white">₹{service.price}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Duration</span>
                      <span className="text-sm font-bold text-white/60">{service.duration_minutes} MIN</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 flex-shrink-0">
                  <button
                    onClick={() => openEditModal(service)}
                    className="w-9 h-9 rounded-[12px] bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/30 transition-all cursor-pointer"
                    title="Edit service"
                    aria-label={`Edit ${service.name}`}
                  >
                    <Icon icon="settings" size={13} />
                  </button>
                  <button
                    onClick={() => toggleStatus(service.id, !service.is_active)}
                    className={`w-9 h-9 rounded-[12px] border flex items-center justify-center transition-all cursor-pointer ${
                      service.is_active
                        ? "bg-red-500/5 border-red-500/10 text-red-500/40 hover:bg-red-500 hover:text-white"
                        : "bg-emerald-500/5 border-emerald-500/10 text-emerald-500/40 hover:bg-emerald-500 hover:text-white"
                    }`}
                    title={service.is_active ? "Deactivate" : "Activate"}
                    aria-label={service.is_active ? `Deactivate ${service.name}` : `Activate ${service.name}`}
                  >
                    <Icon icon={service.is_active ? "times" : "check"} size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(service.id)}
                    className="w-9 h-9 rounded-[12px] bg-red-500/5 border border-red-500/10 flex items-center justify-center text-red-500/40 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                    title="Delete service"
                    aria-label={`Delete ${service.name}`}
                  >
                    <Icon icon="delete" size={13} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Service">
        <ServiceForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleAddService}
          onCancel={() => setShowAddModal(false)}
          submitLabel="Add Service"
        />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Service">
        <ServiceForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleEditService}
          onCancel={() => setShowEditModal(false)}
          submitLabel="Update Service"
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteTarget !== null}
        title="Delete Service"
        message="Are you sure you want to delete this service? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous
        onConfirm={() => { if (deleteTarget) handleDeleteService(deleteTarget); setDeleteTarget(null); }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
