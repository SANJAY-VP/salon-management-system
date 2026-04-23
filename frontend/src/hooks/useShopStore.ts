import { create } from 'zustand';
import { Shop, Barber, Service, Review } from '../types';
import { shopService } from '../services/shop.service';
import { barberService } from '../services/barber.service';
import { serviceService } from '../services/service.service';
import { reviewService } from '../services/review.service';

interface ShopState {
  shops: Shop[];
  selectedShop: Shop | null;
  barbers: Barber[];
  services: Service[];
  reviews: Review[];
  loading: boolean;
  error: string | null;
  fetchShops: (params?: any) => Promise<void>;
  fetchShopById: (id: string | number) => Promise<void>;
  fetchShopBarbers: (id: string | number) => Promise<void>;
  fetchShopServices: (id: string | number) => Promise<void>;
  fetchShopReviews: (id: string | number) => Promise<void>;
  setSelectedShop: (shop: Shop | null) => void;
}

export const useShopStore = create<ShopState>((set) => ({
  shops: [],
  selectedShop: null,
  barbers: [],
  services: [],
  reviews: [],
  loading: false,
  error: null,

  fetchShops: async (params?: any) => {
    set({ loading: true, error: null });
    try {
      const shops = await shopService.getAllShops(params);
      set({ shops, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to fetch shops', loading: false });
    }
  },

  fetchShopById: async (id: string | number) => {
    set({ loading: true, error: null, selectedShop: null });
    try {
      const shop = await shopService.getShopById(id);
      set({ selectedShop: shop, loading: false });
    } catch (error: any) {
      set({
        selectedShop: null,
        error: error.message || 'Failed to fetch shop details',
        loading: false,
      });
    }
  },

  fetchShopBarbers: async (id: string | number) => {
    try {
      const barbers = await barberService.getShopBarbers(id);
      set({ barbers });
    } catch (error: any) {
      console.error('Failed to fetch barbers', error);
    }
  },

  fetchShopServices: async (id: string | number) => {
    try {
      const services = await serviceService.getShopServices(id);
      set({ services });
    } catch (error: any) {
      console.error('Failed to fetch services', error);
    }
  },

  fetchShopReviews: async (id: string | number) => {
    try {
      const reviews = await reviewService.getShopReviews(id);
      set({ reviews });
    } catch (error: any) {
      console.error('Failed to fetch reviews', error);
    }
  },

  setSelectedShop: (shop) => set({ selectedShop: shop }),
}));
