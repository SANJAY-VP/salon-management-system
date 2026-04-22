import { useState, useEffect } from "react";
import { PageLayoutDesktop, PageContainerDesktop } from "../../components/common/Header";
import Card from "../../components/common/Card";
import Button from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import BackButton from "../../components/common/BackButton";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../hooks/useAuthStore";
import api from "../../services/api";
import toast from "react-hot-toast";

// Publishable key from .env — never the secret
const RAZORPAY_KEY = (import.meta as any).env?.VITE_RAZORPAY_KEY_ID || "";

declare global {
  interface Window {
    Razorpay: any;
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const searchParams = new URLSearchParams(location.search);
  const bookingId = searchParams.get("bookingId");
  const amount = parseFloat(searchParams.get("amount") || "0");
  const bookingCount = parseInt(searchParams.get("count") || "1");

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const handleRazorpayPayment = async () => {
    if (!bookingId) {
      toast.error("Missing booking information. Please go back and try again.");
      return;
    }
    if (amount <= 0) {
      toast.error("Invalid payment amount.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Initialising payment…");

    // ── Try Razorpay real flow ────────────────────────────────────────────
    if (RAZORPAY_KEY) {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Could not load payment gateway. Check your network and retry.", { id: toastId });
        setIsProcessing(false);
        return;
      }

      try {
        // Step 1 — create order on backend
        const orderRes = await api.post(
          `/api/v1/bookings/${bookingId}/payment/razorpay-order`,
          { booking_id: parseInt(bookingId), amount }
        );

        const { order_id: orderId, key: backendKey } = orderRes.data;
        const razorpayKey = backendKey || RAZORPAY_KEY;

        toast.dismiss(toastId);

        // Step 2 — open Razorpay checkout
        // NOTE: when order_id is present Razorpay uses the server-side amount.
        // Do NOT pass amount again — it causes "temporary technical issue".
        const options: any = {
          key: razorpayKey,
          currency: "INR",
          name: "SalonBook",
          description: `Booking #${bookingId}`,
          image: "/vite.svg",
          order_id: orderId,
          prefill: {
            name: user?.name || user?.fullName || "",
            email: user?.email || "",
            contact: user?.phone || "",
          },
          theme: { color: "#d4af37" },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              toast("Payment cancelled");
            },
          },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            const verifyId = toast.loading("Verifying payment…");
            try {
              await api.post(`/api/v1/bookings/${bookingId}/payment`, {
                booking_id: parseInt(bookingId),
                payment_method: "razorpay",
                amount,
                discount: 0,
                transaction_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
              toast.success("Payment successful! Booking confirmed.", { id: verifyId });
              navigate(`/customer/success?id=${bookingId}`);
            } catch (err: any) {
              toast.error(
                err?.response?.data?.detail || "Payment verification failed. Contact support.",
                { id: verifyId }
              );
              setIsProcessing(false);
            }
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", (resp: any) => {
          toast.error(
            resp?.error?.description || "Payment failed. Please try again or use a different method."
          );
          setIsProcessing(false);
        });
        rzp.open();
      } catch (err: any) {
        const msg =
          err?.response?.data?.detail || "Could not create payment order. Please retry.";
        toast.error(msg, { id: toastId });
        setIsProcessing(false);
      }
      return;
    }

    // ── Fallback: dev / no Razorpay key ─────────────────────────────────
    // Records payment directly (no real charge) — for local development only.
    try {
      await api.post(`/api/v1/bookings/${bookingId}/payment`, {
        booking_id: parseInt(bookingId),
        payment_method: "razorpay",
        amount,
        discount: 0,
      });
      toast.success("Booking confirmed (dev mode).", { id: toastId });
      navigate(`/customer/success?id=${bookingId}`);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Payment failed. Please try again.", {
        id: toastId,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const isTestMode = RAZORPAY_KEY?.startsWith("rzp_test_");

  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="lg" className="px-8 py-12">
        <div className="mb-8">
          <BackButton label="Back" />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="mb-10">
            <h1 className="text-4xl font-bold font-serif text-white uppercase tracking-tighter">
              Confirm Payment
            </h1>
            <p className="text-sm text-white/60 mt-2">
              Review your order and proceed to secure payment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Amount card */}
            <Card className="p-10 bg-coffee/40 border-gold/10 rounded-[40px] shadow-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl rounded-full" />
              <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.4em] mb-4">
                Total Amount
              </p>
              <h2 className="text-6xl font-bold text-white font-serif tracking-tighter mb-4">
                ₹{amount}
              </h2>
              {bookingCount > 1 && (
                <p className="text-[10px] text-cream/50 uppercase font-black tracking-widest mb-4">
                  {bookingCount} services booked
                </p>
              )}
              <div className="flex items-center gap-2 text-gold/60 font-black uppercase text-[10px] tracking-widest bg-black/20 px-4 py-2 rounded-xl border border-white/5">
                <Icon icon="lock" size={12} />
                <span>Encrypted Transaction</span>
              </div>
              {bookingId && (
                <p className="text-[9px] text-white/50 mt-6 uppercase font-black tracking-widest">
                  Booking Ref: #{bookingId}
                </p>
              )}
            </Card>

            {/* Payment action */}
            <div className="space-y-6">
              <div className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gold/10 flex items-center justify-center text-gold">
                    <Icon icon="earnings" size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">Razorpay</p>
                    <p className="text-[10px] text-white/50 uppercase font-black tracking-wider">
                      UPI · Cards · Net Banking · Wallets
                    </p>
                  </div>
                </div>

                {/* Test mode hint */}
                {isTestMode && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-[10px] text-amber-400 font-black uppercase tracking-wider mb-1">
                      Test Mode — Use test credentials
                    </p>
                    <p className="text-[10px] text-amber-400/70 font-medium">
                      Card: <span className="font-black">4111 1111 1111 1111</span> · CVV: <span className="font-black">any 3 digits</span> · Expiry: any future date
                    </p>
                    <p className="text-[10px] text-amber-400/70 font-medium mt-0.5">
                      UPI: <span className="font-black">success@razorpay</span>
                    </p>
                  </div>
                )}
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleRazorpayPayment}
                disabled={isProcessing || amount === 0}
                className="py-5 !rounded-2xl text-sm font-black uppercase tracking-widest shadow-2xl shadow-gold/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                {isProcessing ? "Processing…" : `Pay ₹${amount} →`}
              </Button>

              <p className="text-center text-[10px] uppercase tracking-widest text-white/30 font-bold leading-relaxed">
                256-bit SSL encryption · Payment details never stored
              </p>
            </div>
          </div>
        </div>
      </PageContainerDesktop>
    </PageLayoutDesktop>
  );
}
