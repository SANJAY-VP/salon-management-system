import api from './api';
import { Shop, Service, Review } from '../types';

// ─── Request shapes that match backend BarberShopCreate exactly ──────────────
export interface ShopCreate {
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
  opening_time?: string;
  closing_time?: string;
  accepts_home_service?: boolean;
  images?: string;
}

export interface ShopUpdate {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  opening_time?: string;
  closing_time?: string;
  accepts_home_service?: boolean;
  images?: string;
}

/**
 * Converts a raw backend BarberShopResponse to our frontend Shop type,
 * populating the UI-friendly aliases so all existing components keep working.
 */
function mapShop(data: any): Shop {
  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    description: data.description,
    phone: data.phone,
    email: data.email,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    latitude: data.latitude,
    longitude: data.longitude,
    openingTime: data.opening_time,
    closingTime: data.closing_time,
    isOpen: data.is_open ?? false,
    isActive: data.is_active ?? true,
    acceptsHomeService: data.accepts_home_service ?? false,
    rating: data.average_rating ?? 0,
    reviewCount: data.total_reviews ?? 0,
    images: data.images,
    shopImage: data.images ?? undefined,
    startingPrice: 0,
    amenities: [],
    barbers: [],
    services: [],
  };
}

export const shopService = {
  getAllShops: async (params?: any): Promise<Shop[]> => {
    const response = await api.get('/api/v1/dashboard/search', { params });
    return (response.data as any[]).map(mapShop);
  },

  getShopById: async (id: string | number): Promise<Shop> => {
    const response = await api.get(`/api/v1/shops/${id}`);
    return mapShop(response.data);
  },

  getMyShops: async (): Promise<Shop[]> => {
    const response = await api.get('/api/v1/shops/owner/my-shops');
    return (response.data as any[]).map(mapShop);
  },

  getShopServices: async (shopId: string | number): Promise<Service[]> => {
    const response = await api.get(`/api/v1/dashboard/shops/${shopId}/services`);
    return response.data;
  },

  getShopReviews: async (shopId: string | number): Promise<Review[]> => {
    const response = await api.get(`/api/v1/reviews/shop/${shopId}`);
    return response.data;
  },

  createShop: async (data: ShopCreate): Promise<Shop> => {
    const response = await api.post('/api/v1/shops', data);
    return mapShop(response.data);
  },

  updateShop: async (id: string | number, shopData: ShopUpdate): Promise<Shop> => {
    const response = await api.put(`/api/v1/shops/${id}`, shopData);
    return mapShop(response.data);
  },

  toggleShopStatus: async (id: string | number, isOpen: boolean): Promise<Shop> => {
    const response = await api.patch(`/api/v1/shops/${id}/status`, { is_open: isOpen });
    return mapShop(response.data);
  },

  deleteShop: async (id: string | number) => {
    const response = await api.delete(`/api/v1/shops/${id}`);
    return response.data;
  },

  getFeaturedShops: async (limit?: number): Promise<Shop[]> => {
    const params: any = {};
    if (limit) params.limit = limit;
    const response = await api.get('/api/v1/dashboard/featured', { params });
    return (response.data as any[]).map(mapShop);
  },
};
