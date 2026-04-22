import { useState, useEffect, useMemo } from "react";
import { useCartStore } from "../../hooks/useCartStore";
import { PageLayoutDesktop, PageContainerDesktop, Tabs } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { Modal } from "../../components/common/Modal";
import { useShopStore } from "../../hooks/useShopStore";
import { useParams, useNavigate } from "react-router-dom";
import ReviewManagement from "../../components/customer/ReviewManagement";
import { ServiceCard, BarberCard } from "../../components/common/ReusableCards";
import Pagination from "../../components/common/Pagination";
import { resolveShopImage } from "../../config/images";
import { Service } from "../../types";
import toast from "react-hot-toast";
import BackButton from "../../components/common/BackButton";

const PAGE_SIZE = 10;

// ─── Service Picker Modal ─────────────────────────────────────────────────────
interface ServicePickerModalProps {
  isOpen: boolean;
  services: Service[];
  isHomeService: boolean;
  onSelect: (service: Service) => void;
  onClose: () => void;
}

function ServicePickerModal({ isOpen, services, isHomeService, onSelect, onClose }: ServicePickerModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={isHomeService ? "Select a Service" : "Select a Service"}
      onClose={onClose}
    >
      {services.length === 0 ? (
        <p className="text-white/50 text-sm text-center py-8">No services available for this salon.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-white/50 text-xs uppercase tracking-widest font-bold mb-2">
            {isHomeService ? "Choose a service for your home appointment" : "Choose a service to book"}
          </p>
          {services.map((svc) => (
            <button
              key={svc.id}
              onClick={() => onSelect(svc)}
              className="group flex items-center justify-between p-4 rounded-xl border border-white/10 hover:border-gold/40 hover:bg-gold/5 transition-all text-left cursor-pointer"
            >
              <div>
                <p className="text-white font-bold text-sm group-hover:text-gold transition-colors">{svc.name}</p>
                <p className="text-white/40 text-xs mt-1 flex items-center gap-2">
                  <Icon icon="clock" size={10} className="text-gold/50" />
                  {svc.durationMinutes} mins
                  {svc.description && (
                    <span className="hidden sm:inline truncate max-w-[180px]">· {svc.description}</span>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-gold font-black text-lg font-serif">₹{svc.price}</span>
                <div className="w-7 h-7 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold group-hover:bg-gold group-hover:text-black transition-all">
                  <Icon icon="arrow-right" size={12} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function CustomerShopDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("services");
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicePage, setServicePage] = useState(1);
  const [barberPage, setBarberPage] = useState(1);

  // Service picker modal state
  const [pickerState, setPickerState] = useState<{
    open: boolean;
    barberId: string | null;
    isHome: boolean;
  }>({ open: false, barberId: null, isHome: false });

  const { addToCart, items } = useCartStore();
  
  const { 
    selectedShop, 
    barbers,
    services, 
    reviews, 
    loading, 
    fetchShopById, 
    fetchShopBarbers,
    fetchShopServices, 
    fetchShopReviews 
  } = useShopStore();

  const paginatedServices = useMemo(
    () => services.slice((servicePage - 1) * PAGE_SIZE, servicePage * PAGE_SIZE),
    [services, servicePage]
  );
  const paginatedBarbers = useMemo(
    () => barbers.slice((barberPage - 1) * PAGE_SIZE, barberPage * PAGE_SIZE),
    [barbers, barberPage]
  );
  
  useEffect(() => {
    if (!id) return;
    setServicesLoading(true);
    fetchShopById(id);
    fetchShopBarbers(id);
    fetchShopServices(id).finally(() => setServicesLoading(false));
    fetchShopReviews(id);
  }, [id]);  // eslint-disable-line react-hooks/exhaustive-deps

  /** Open the service picker modal for a specific barber. */
  const handleBarberBook = (barberId: string | number, isHome: boolean) => {
    if (!selectedShop) return;
    if (servicesLoading) {
      toast("Loading services, please wait a moment…", { icon: "⏳" });
      return;
    }
    if (isHome && !selectedShop.acceptsHomeService) {
      toast.error("This salon does not offer home service.");
      return;
    }
    setPickerState({ open: true, barberId: barberId.toString(), isHome });
  };

  /** Called when user confirms a service in the picker modal. */
  const handleServicePicked = (service: Service) => {
    if (!selectedShop || !pickerState.barberId) return;
    setPickerState((s) => ({ ...s, open: false }));
    addToCart({
      id: `${pickerState.isHome ? "home" : "barber"}-${pickerState.barberId}-${Date.now()}`,
      shopId: selectedShop.id.toString(),
      shopName: selectedShop.name,
      serviceId: service.id.toString(),
      serviceName: service.name,
      price: service.price,
      duration: service.durationMinutes,
      shopImage: resolveShopImage(selectedShop.images || selectedShop.shopImage),
      barberId: pickerState.barberId,
      isHomeService: pickerState.isHome,
    });
  };

  if (loading && !selectedShop) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mb-6" />
          <div className="text-gold font-serif tracking-[0.3em] uppercase text-sm animate-pulse">Loading...</div>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  if (!selectedShop) {
    return (
      <PageLayoutDesktop variant="customer">
        <PageContainerDesktop className="text-center py-20">
          <h2 className="text-3xl font-serif text-cream mb-6 uppercase tracking-widest">Salon Not Found</h2>
          <Button onClick={() => navigate("/home")} variant="secondary">Back to Home</Button>
        </PageContainerDesktop>
      </PageLayoutDesktop>
    );
  }

  const tabs = [
    { id: "services", label: "Services" },
    { id: "barbers", label: "Barbers" },
    { id: "reviews", label: `Reviews (${reviews.length})` },
  ];

  return (
     <PageLayoutDesktop variant="customer" fullScreen showHeader={false}>
       <div className="relative h-[40vh] md:h-[65vh] w-full overflow-hidden">
         <img
           src={resolveShopImage(selectedShop.images || selectedShop.shopImage, true)}
           alt={selectedShop.name}
           className="w-full h-full object-cover scale-105"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0F] via-[#0B0B0F]/90 to-black/50" />

         {/* Floating Back Button */}
         <div className="absolute top-5 md:top-12 left-5 md:left-12 z-20">
          <BackButton to="/customer/search" label="Back" />
            {/* <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-4 text-white/60 hover:text-gold transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-3xl border border-white/10 flex items-center justify-center group-hover:border-gold/30 group-hover:bg-gold/10 transition-all">
                <Icon icon="back" size={16} />
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.2em] italic opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">Back</span>
            </button> */}
         </div>

         <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 max-w-7xl mx-auto w-full pb-8 md:pb-20">
           <div className="animate-fade-in-up">
             <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-4">
               <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl ${
                 selectedShop.isOpen ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
               }`}>
                 {selectedShop.isOpen ? "Open" : "Closed"}
               </span>
               <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full text-xs text-white border border-white/10">
                 <Icon icon="star" size={12} className="text-gold" />
                 <span className="font-serif font-bold">{selectedShop.rating?.toFixed(1)}</span>
               </div>
             </div>
             <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black font-serif text-gold tracking-tighter uppercase mb-2 md:mb-4 drop-shadow-[0_0_30px_rgba(212,175,55,0.2)]">
               {selectedShop.name}
             </h1>
             <div className="flex items-center gap-2 text-white font-bold text-xs md:text-sm uppercase tracking-[0.2em]">
               <Icon icon="location" size={12} className="text-gold" />
               <span className="opacity-80 truncate max-w-xs md:max-w-none">{selectedShop.city}</span>
             </div>
           </div>
        </div>
      </div>

      <PageContainerDesktop maxWidth="xl" className="px-4 md:px-12 py-6 md:py-12">
        <div className="mb-12">
           <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        <div className="min-h-[50vh] mb-32">
          {activeTab === "services" && (
            <>
              <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {services.length > 0 ? paginatedServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    shopName={selectedShop.name}
                    onAdd={() => {
                      addToCart({
                        id: `${service.id}-${Date.now()}`,
                        shopId: selectedShop.id.toString(),
                        shopName: selectedShop.name,
                        serviceId: service.id.toString(),
                        serviceName: service.name,
                        price: service.price,
                        duration: service.durationMinutes,
                        shopImage: resolveShopImage(selectedShop.images || selectedShop.shopImage),
                      });
                    }}
                  />
                )) : (
                  <div className="col-span-full py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center">
                    <Icon icon="search" size={48} className="text-white/5 mb-4" />
                    <p className="text-cream/50 uppercase tracking-widest font-black text-xs">No services available</p>
                  </div>
                )}
              </div>
              <Pagination
                currentPage={servicePage}
                totalPages={Math.ceil(services.length / PAGE_SIZE)}
                onPageChange={setServicePage}
              />
            </>
          )}

          {activeTab === "barbers" && (
            <>
              <div className="grid gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-3">
                {barbers.length > 0 ? paginatedBarbers.map((barber) => (
                  <BarberCard
                    key={barber.id}
                    barber={barber}
                    acceptsHomeService={selectedShop.acceptsHomeService || false}
                    onBook={() => handleBarberBook(
                      barber.id,
                      Boolean(selectedShop.acceptsHomeService && barber.isActive !== false)
                    )}
                  />
                )) : (
                  <div className="col-span-full py-20 border border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center">
                    <Icon icon="search" size={48} className="text-white/5 mb-4" />
                    <p className="text-cream/50 uppercase tracking-widest font-black text-xs">No barbers found</p>
                  </div>
                )}
              </div>
              <Pagination
                currentPage={barberPage}
                totalPages={Math.ceil(barbers.length / PAGE_SIZE)}
                onPageChange={setBarberPage}
              />
            </>
          )}

          {activeTab === "reviews" && (
            <ReviewManagement 
              shopId={selectedShop.id} 
              shopName={selectedShop.name} 
            />
          )}
        </div>

        {/* Info & Map Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-32">
           <Card className="p-10 bg-coffee/20 border-white/5">
              <h3 className="text-xs font-black text-gold/80 uppercase tracking-widest mb-8">Salon Information</h3>
              <div className="space-y-6">
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold/40 border border-white/5">
                       <Icon icon="clock" size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Opening Hours</p>
                       <p className="text-white font-bold">{selectedShop.openingTime} - {selectedShop.closingTime}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold/40 border border-white/5">
                       <Icon icon="phone" size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Contact Number</p>
                       <p className="text-white font-bold">{selectedShop.phone}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gold/40 border border-white/5">
                       <Icon icon="location" size={20} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-white/30 uppercase tracking-widest">Address</p>
                       <p className="text-white font-bold truncate max-w-xs">{selectedShop.address}, {selectedShop.city}</p>
                    </div>
                 </div>
              </div>
           </Card>

           <Card className="p-0 overflow-hidden bg-coffee/20 border-white/5 min-h-[300px]">
              <iframe
                title="Salon Location"
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg)' }}
                src={`https://maps.google.com/maps?q=${selectedShop.latitude},${selectedShop.longitude}&z=15&output=embed`}
                allowFullScreen
              ></iframe>
           </Card>
        </div>

        {/* Action Bar */}
        <div className="fixed bottom-4 md:bottom-10 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg px-0 md:px-6 z-50">
           <div className="bg-black/60 backdrop-blur-2xl p-3 md:p-4 rounded-2xl md:rounded-[32px] border border-white/10 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.8)] flex items-center justify-between">
              <div className="pl-3 md:pl-6">
                 <div className="text-[9px] text-cream/60 font-black uppercase tracking-widest mb-0.5 hidden sm:block">Selection</div>
                 <div className="text-base md:text-xl font-bold text-white font-serif tracking-tighter uppercase">
                   {items.length > 0 ? `${items.length} item${items.length > 1 ? "s" : ""} • Checkout` : "Checkout"}
                 </div>
              </div>
              <Button
                variant="primary"
                onClick={() => navigate("/customer/cart")}
                className="!rounded-xl md:!rounded-2xl px-5 md:px-8 py-3 md:py-4 shadow-xl shadow-gold/20 font-black uppercase tracking-widest text-xs"
              >
                Go to Cart →</Button>
           </div>
        </div>
      </PageContainerDesktop>

      {/* Service picker modal — opened when user clicks Book on a BarberCard */}
      <ServicePickerModal
        isOpen={pickerState.open}
        services={services}
        isHomeService={pickerState.isHome}
        onSelect={handleServicePicked}
        onClose={() => setPickerState((s) => ({ ...s, open: false }))}
      />
    </PageLayoutDesktop>
  );
}
