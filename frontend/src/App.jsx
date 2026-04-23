import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuthStore } from "./hooks/useAuthStore";
import ProtectedRoute from "./components/common/ProtectedRoute";

// Customer Pages
import CustomerRegister from "./pages/auth/Register";
import CustomerLogin from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import CustomerHome from "./pages/customer/Home";
import SlotSelection from "./pages/customer/SlotSelection";
import CustomerShopDetails from "./pages/customer/ShopDetails";
import BookingConfirmation from "./pages/customer/BookingConfirmation";
import Payment from "./pages/customer/Payment";
import BookingSuccess from "./pages/customer/BookingSuccess";
import CustomerProfile from "./pages/customer/Profile";
import Cart from "./pages/customer/Cart";
import Search from "./pages/customer/Search";

// Barber Pages
import BarberBookings from "./pages/barber/Bookings";
import BarberReviews from "./pages/barber/Reviews";
import BarberProfile from "./pages/barber/Profile";
import ManageSlots from "./pages/barber/ManageSlots";
import BarberDashboard from "./pages/barber/BarberDashboard";
import ShopDetails from "./pages/barber/ShopDetails";

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      {/* Global toast notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 5000,
          className: "toast-container",
          success: {
            iconTheme: { primary: "#d4af37", secondary: "#1a1a1a" },
          },
          error: {
            iconTheme: { primary: "#ef4444", secondary: "#fff" },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/register" element={<CustomerRegister />} />
        <Route path="/login" element={<CustomerLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/home" element={<CustomerHome />} />

        {/* Discovery: browse salons & shop detail without logging in (cart/checkout stay protected) */}
        <Route path="/customer/search" element={<Search />} />
        <Route path="/customer/shop/:id" element={<CustomerShopDetails />} />

        {/* Customer Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route path="/customer/slots" element={<SlotSelection />} />
          <Route path="/customer/confirmation" element={<BookingConfirmation />} />
          <Route path="/customer/payment" element={<Payment />} />
          <Route path="/customer/success" element={<BookingSuccess />} />
          <Route path="/customer/profile" element={<CustomerProfile />} />
          <Route path="/customer/cart" element={<Cart />} />
        </Route>

        {/* Barber Protected Routes */}
        <Route element={<ProtectedRoute allowedRoles={["barber"]} />}>
          <Route path="/barber/dashboard" element={<BarberDashboard />} />
          <Route path="/barber/shop/:shopId" element={<ShopDetails />} />
          <Route path="/barber/bookings" element={<BarberBookings />} />
          <Route path="/barber/reviews" element={<BarberReviews />} />
          <Route path="/barber/profile" element={<BarberProfile />} />
          <Route path="/barber/slots" element={<ManageSlots />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
