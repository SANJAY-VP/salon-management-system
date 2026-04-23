// ─── Core domain types (aligned with backend schemas) ────────────────────────

export interface User {
  id: string;
  name: string;
  fullName?: string;
  email: string;
  phone: string;
  role: "customer" | "barber";
  /** Profile photo URL (Cloudinary or API /uploads); mirrors backend `avatar` */
  avatar?: string;
  profileImage?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  isActive?: boolean;
  isVerified?: boolean;
  points: number;
  createdAt: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Shop type mirrors the backend BarberShopResponse.
 * UI-friendly aliases (isOpen, rating, etc.) are populated by the
 * mapShop() adapter in shop.service.ts so existing components work unchanged.
 */
export interface Shop {
  id: number;
  ownerId: number;
  name: string;
  description?: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number;
  longitude: number;
  openingTime?: string;
  closingTime?: string;
  isOpen: boolean;
  isActive?: boolean;
  acceptsHomeService?: boolean;
  rating: number;
  reviewCount: number;
  images?: string;
  shopImage?: string;
  startingPrice?: number;
  distance?: number;
  amenities?: string[];
  barbers?: Barber[];
  services?: Service[];
}

export interface Barber {
  id: string | number;
  shopId: string | number;
  name: string;
  profileImage?: string;
  experience?: number;
  rating?: number;
  specialization?: string;
  bio?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export interface Service {
  id: string | number;
  shopId: string | number;
  name: string;
  durationMinutes: number;
  price: number;
  description?: string;
  category: string;
  isActive?: boolean;
}

export interface TimeSlot {
  id: string | number;
  shop_id: string | number;
  barber_id?: string | number | null;
  date: string;
  start_time: string;
  end_time: string;
  time?: string;
  status: "available" | "booked" | "completed" | "cancelled" | "AVAILABLE" | "BOOKED" | "COMPLETED" | "CANCELLED";
  is_active?: boolean;
  price?: number;
}

export interface Booking {
  id: string | number;
  user_id: string | number;
  shop_id: string | number;
  slot_id: string | number;
  service_id: string | number;
  booking_code: string;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  points_used: number;
  points_earned: number;
  created_at: string;

  // Enriched fields from backend — populated on list/detail endpoints
  slot_date?: string;           // "YYYY-MM-DD"
  slot_start_time?: string;     // "HH:MM:SS"
  slot_end_time?: string;       // "HH:MM:SS"
  service_name?: string;
  service_price?: number;
  shop_name?: string;
  amount_paid?: number;
  payment_method?: string;

  // Nested relations (legacy — only set when explicitly fetched)
  shop?: Shop;
  service?: Service;
  barber?: Barber;
}

export interface Review {
  id: string | number;
  bookingId: string | number;
  customerId: string | number;
  shopId: string | number;
  userId?: string | number;
  rating: number;
  title?: string;
  comment?: string;
  createdAt: string;
  customerName?: string;
  customerImage?: string;
  isActive?: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token?: string;
}

export interface SearchFilters {
  rating: number;
  priceMax: number;
  distance: number;
  openNow: boolean;
}
