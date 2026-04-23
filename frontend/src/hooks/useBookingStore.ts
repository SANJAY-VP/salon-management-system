import { create } from 'zustand';
import { Booking, Shop, SearchFilters } from '../types';

interface BookingState {
  bookings: Booking[];
  currentBooking: Booking | null;
  shops: Shop[];
  filters: SearchFilters;
  addBooking: (booking: Booking) => void;
  updateBooking: (bookingId: string, updates: Partial<Booking>) => void;
  cancelBooking: (bookingId: string) => void;
  setCurrentBooking: (booking: Booking | null) => void;
  setShops: (shops: Shop[]) => void;
  setFilters: (filters: SearchFilters) => void;
  clearBooking: () => void;
  loginWithGoogle: () => Promise<void>;
}

export const useBookingStore = create<BookingState>(
  (set) => ({
    bookings: [],
    currentBooking: null,
    shops: [],
    filters: {
      rating: 0,
      priceMax: 2000,
      distance: 10,
      openNow: false
    },

  addBooking: (booking: Booking) => {
    set((state) => ({ bookings: [...state.bookings, booking] }));
  },

  updateBooking: (bookingId: string, updates: Partial<Booking>) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, ...updates } : b
      ),
      currentBooking:
        state.currentBooking?.id === bookingId
          ? { ...state.currentBooking, ...updates }
          : state.currentBooking,
    }));
  },

  cancelBooking: (bookingId: string) => {
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: "cancelled" } : b
      ),
    }));
  },

  setCurrentBooking: (booking: Booking | null) => {
    set({ currentBooking: booking });
  },

  setShops: (shops: Shop[]) => {
    set({ shops });
  },

  setFilters: (filters: SearchFilters) => {
    set({ filters });
  },

  clearBooking: () => {
    set({ currentBooking: null });
  },
// NW
  loginWithGoogle: async () => {
    await new Promise(r => setTimeout(r, 1000));
    console.log("Simulating Google Login");
  }
}));
