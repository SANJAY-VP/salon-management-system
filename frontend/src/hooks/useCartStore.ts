import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { toast } from 'react-hot-toast';

export interface CartItem {
  id: string;
  shopId: string;
  shopName: string;
  serviceId: string;
  serviceName: string;
  price: number;
  duration?: number;
  shopImage?: string;
  /** Barber ID — set for home-service bookings where a specific barber is requested */
  barberId?: string;
  /** True when this item is a home-service booking */
  isHomeService?: boolean;
  // Slot selection per service
  slotId?: string;
  slotDate?: string;       // "YYYY-MM-DD"
  slotTime?: string;       // "9:00 AM - 9:30 AM"
  slotStartTime?: string;  // raw "09:00"
  slotEndTime?: string;    // raw "09:30"
}

interface CartState {
  items: CartItem[];
  total: number;
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItemSlot: (itemId: string, slot: {
    slotId: string;
    slotDate: string;
    slotTime: string;
    slotStartTime: string;
    slotEndTime: string;
  }) => void;
  clearSlotForItem: (itemId: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,

      addToCart: (newItem: CartItem) => {
        const { items } = get();
        if (!items.some((item) => item.serviceId === newItem.serviceId && item.shopId === newItem.shopId)) {
          const newItems = [...items, newItem];
          set({
            items: newItems,
            total: newItems.reduce((sum, item) => sum + item.price, 0),
          });
          toast.success(`${newItem.serviceName} added to cart`);
        } else {
          toast.error('This service is already in your cart!');
        }
      },

      removeFromCart: (itemId: string) => {
        const { items } = get();
        const itemToRemove = items.find((item) => item.id === itemId);
        const newItems = items.filter((item) => item.id !== itemId);
        set({
          items: newItems,
          total: newItems.reduce((sum, item) => sum + item.price, 0),
        });
        if (itemToRemove) {
          toast.success(`${itemToRemove.serviceName} removed`);
        }
      },

      updateCartItemSlot: (itemId, slot) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId ? { ...item, ...slot } : item
          ),
        }));
      },

      clearSlotForItem: (itemId: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === itemId
              ? { ...item, slotId: undefined, slotDate: undefined, slotTime: undefined, slotStartTime: undefined, slotEndTime: undefined }
              : item
          ),
        }));
      },

      clearCart: () => {
        set({ items: [], total: 0 });
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
