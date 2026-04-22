import { Modal } from "./Modal";
import { Icon } from "./Icon";
import Button from "./Button";
import { Booking } from "../../types";
import { toPng } from "html-to-image";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
}

function fmtTime(t?: string): string {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  return `${h % 12 || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export default function InvoiceModal({ isOpen, onClose, booking }: InvoiceModalProps) {
  // ── Derived display values ──────────────────────────────────────────────
  const shopName =
    booking.shop_name || (booking as any).shop?.name || "Premium Salon";

  const serviceName =
    booking.service_name || (booking as any).service?.name || "Haircut & Styling";

  // Appointment date — prefer slot_date (the actual appointment), fall back to booking creation date
  const appointmentDate = booking.slot_date
    ? new Date(booking.slot_date + "T00:00:00").toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : new Date(booking.created_at).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      });

  const appointmentTime =
    booking.slot_start_time && booking.slot_end_time
      ? `${fmtTime(booking.slot_start_time)} – ${fmtTime(booking.slot_end_time)}`
      : null;

  // Use amount_paid (real payment) → service_price → 0
  const basePrice =
    booking.amount_paid ??
    booking.service_price ??
    (booking as any).service?.price ??
    0;

  // If amount_paid already includes tax, show it directly; else add 5% tax
  // amount_paid comes from the payment transaction so it's the real charge
  const serviceAmount = booking.amount_paid != null
    ? Math.round(booking.amount_paid / 1.05)   // extract pre-tax from the real amount
    : basePrice;
  const tax = Math.round(serviceAmount * 0.05);
  const total = serviceAmount + tax;

  const handleDownload = async () => {
    const element = document.getElementById("invoice-content");
    if (!element) return;
    try {
      const dataUrl = await toPng(element, { backgroundColor: "#0B0B0F", pixelRatio: 2 });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `Receipt-${booking.booking_code || booking.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to capture receipt", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Receipt">
      <div
        id="invoice-content"
        className="bg-[#0B0B0F] border border-[#D4AF37]/20 p-8 md:p-10 rounded-[28px] text-white relative shadow-[0_0_50px_rgba(212,175,55,0.05)] mx-auto overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center border-b border-white/10 pb-8 mb-8 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-xl flex items-center justify-center text-[#D4AF37] shadow-lg">
              <Icon icon="scissors" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-widest text-[#D4AF37] font-serif italic">
                Receipt
              </h2>
              <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.3em] mt-1">
                {booking.booking_code ? `Booking: ${booking.booking_code}` : `Ref #${booking.id}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">
              {booking.slot_date ? "Appointment" : "Booked On"}
            </p>
            <p className="text-sm font-bold text-white/90">{appointmentDate}</p>
            {appointmentTime && (
              <p className="text-xs text-[#D4AF37]/70 font-black mt-0.5">{appointmentTime}</p>
            )}
          </div>
        </div>

        {/* Billed To */}
        <div className="mb-8 relative z-10">
          <p className="text-[10px] font-black text-[#D4AF37]/60 uppercase tracking-[0.2em] mb-2">
            Billed To
          </p>
          <p className="text-lg font-bold text-white tracking-wide capitalize">
            {booking.customer_name || "Guest"}
          </p>
          {booking.customer_email && (
            <p className="text-xs text-white/50 mt-1 font-medium">{booking.customer_email}</p>
          )}
          {booking.customer_phone && (
            <p className="text-xs text-white/50 mt-0.5 font-medium">{booking.customer_phone}</p>
          )}
        </div>

        {/* Line items */}
        <div className="border border-white/10 rounded-xl overflow-hidden mb-8 relative z-10 bg-white/[0.02]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th className="py-4 px-6 text-left text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Description
                </th>
                <th className="py-4 px-6 text-right text-[10px] font-black text-white/40 uppercase tracking-widest">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              <tr>
                <td className="py-6 px-6">
                  <p className="text-sm font-bold text-white tracking-wide">{serviceName}</p>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-1.5">
                    @ {shopName}
                  </p>
                  {booking.payment_method && (
                    <p className="text-[9px] text-white/25 uppercase tracking-wider mt-1">
                      via {booking.payment_method}
                    </p>
                  )}
                </td>
                <td className="py-6 px-6 text-right font-black text-[#D4AF37] text-lg font-serif italic">
                  ₹{serviceAmount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex flex-col items-end gap-3 mb-10 mr-2 relative z-10">
          <div className="flex justify-between w-56 text-sm">
            <span className="text-white/50 font-black text-[10px] uppercase tracking-widest">Subtotal</span>
            <span className="font-bold text-white/90">₹{serviceAmount}</span>
          </div>
          <div className="flex justify-between w-56 text-sm">
            <span className="text-white/50 font-black text-[10px] uppercase tracking-widest">GST (5%)</span>
            <span className="font-bold text-white/90">₹{tax}</span>
          </div>
          <div className="flex justify-between items-center w-64 text-base border-t border-white/10 pt-5 mt-2">
            <span className="font-black uppercase tracking-[0.2em] text-[#D4AF37] text-xs">Total Paid</span>
            <span className="font-black text-3xl text-[#D4AF37] font-serif italic">₹{total}</span>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex justify-center mb-6 relative z-10">
          {booking.status === "confirmed" || booking.status === "completed" ? (
            <span className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-[10px] font-black uppercase tracking-widest">
              ✓ Payment Confirmed
            </span>
          ) : (
            <span className="px-6 py-2 bg-gold/10 border border-gold/20 text-gold rounded-full text-[10px] font-black uppercase tracking-widest">
              {booking.status}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-white/10 relative z-10">
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mb-1.5">
            SalonBook · Premium Experience
          </p>
          <p className="text-[9px] text-white/20 font-medium italic">
            Thank you for your booking
          </p>
        </div>
      </div>

      <div className="flex gap-4 mt-8 px-2 max-w-sm mx-auto">
        <Button
          variant="secondary"
          onClick={onClose}
          fullWidth
          className="!rounded-xl py-4 uppercase font-black tracking-[0.2em] text-[10px] bg-white/5 border-white/10"
        >
          Dismiss
        </Button>
        <Button
          variant="primary"
          onClick={handleDownload}
          fullWidth
          className="!rounded-xl py-4 uppercase font-black tracking-[0.2em] text-[10px] flex items-center justify-center gap-2 shadow-xl shadow-gold/10"
        >
          <Icon icon="image" size={14} />
          Download
        </Button>
      </div>
    </Modal>
  );
}
