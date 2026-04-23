import api from './api';
import { Barber } from '../types';

export interface BarberCreate {
  shop_id: number;
  name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  experience_years?: number;
  bio?: string;
  profile_image?: string;
}

export interface BarberUpdate {
  name?: string;
  phone?: string;
  email?: string;
  specialization?: string;
  experience_years?: number;
  bio?: string;
  profile_image?: string;
  is_active?: boolean;
}

export const barberService = {
  getShopBarbers: async (shopId: string | number): Promise<Barber[]> => {
    const response = await api.get(`/api/v1/barbers/shop/${shopId}`);
    return response.data;
  },

  getBarberById: async (id: string | number): Promise<Barber> => {
    const response = await api.get(`/api/v1/barbers/${id}`);
    return response.data;
  },

  createBarber: async (data: BarberCreate): Promise<Barber> => {
    const response = await api.post('/api/v1/barbers', data);
    return response.data;
  },

  updateBarber: async (id: string | number, data: BarberUpdate): Promise<Barber> => {
    const response = await api.put(`/api/v1/barbers/${id}`, data);
    return response.data;
  },

  deleteBarber: async (id: string | number): Promise<{ message: string }> => {
    const response = await api.delete(`/api/v1/barbers/${id}`);
    return response.data;
  },
};
