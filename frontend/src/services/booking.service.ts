import api from "./api";
import { Booking } from "../types";

// Matches backend BookingCreate schema exactly
export interface BookingCreate {
  slot_id: number;
  service_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  points_used?: number;
}

export const bookingService = {
  getShopBookings: async (shopId: string | number, status?: string) => {
    const params: any = {};
    if (status) params.status = status;
    const response = await api.get<Booking[]>(`/api/v1/bookings/shop/${shopId}`, { params });
    return response.data;
  },

  getMyBookings: async (status?: string) => {
    const params: any = {};
    if (status) params.status = status;
    const response = await api.get<Booking[]>("/api/v1/bookings/user/my-bookings", { params });
    return response.data;
  },

  getBookingById: async (id: string | number) => {
    const response = await api.get<Booking>(`/api/v1/bookings/${id}`);
    return response.data;
  },

  getBookingByCode: async (bookingCode: string) => {
    const response = await api.get<Booking>(`/api/v1/bookings/code/${bookingCode}`);
    return response.data;
  },

  createBooking: async (data: BookingCreate) => {
    const response = await api.post<Booking>("/api/v1/bookings", data);
    return response.data;
  },

  confirmBooking: async (bookingId: string | number) => {
    const response = await api.patch<Booking>(`/api/v1/bookings/${bookingId}/confirm`);
    return response.data;
  },

  completeBooking: async (bookingId: string | number, pointsEarned: number = 0) => {
    const response = await api.patch<Booking>(`/api/v1/bookings/${bookingId}/complete`, {
      points_earned: pointsEarned,
    });
    return response.data;
  },

  // Backend BookingCancel uses field name "reason" (not cancel_reason)
  cancelBooking: async (bookingId: string | number, reason?: string) => {
    const response = await api.patch<Booking>(`/api/v1/bookings/${bookingId}/cancel`, {
      reason: reason ?? "User requested",
    });
    return response.data;
  },
};
