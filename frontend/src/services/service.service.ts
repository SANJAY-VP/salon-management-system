import api from './api';

// Mirrors backend ServiceCategory enum
export type ServiceCategory =
  | 'haircut'
  | 'shave'
  | 'makeup'
  | 'spa'
  | 'facial'
  | 'massage'
  | 'hair_color'
  | 'styling'
  | 'other';

export const SERVICE_CATEGORIES: { value: ServiceCategory; label: string }[] = [
  { value: 'haircut', label: 'Haircut' },
  { value: 'shave', label: 'Shave' },
  { value: 'makeup', label: 'Makeup' },
  { value: 'spa', label: 'Spa' },
  { value: 'facial', label: 'Facial' },
  { value: 'massage', label: 'Massage' },
  { value: 'hair_color', label: 'Hair Color' },
  { value: 'styling', label: 'Styling' },
  { value: 'other', label: 'Other' },
];

// Matches backend ServiceCreate schema exactly
export interface ServiceCreate {
  name: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  duration_minutes: number;
}

export interface ServiceUpdate {
  name?: string;
  description?: string;
  category?: ServiceCategory;
  price?: number;
  duration_minutes?: number;
  is_active?: boolean;
}

export interface ServiceResponse {
  id: number;
  shop_id: number;
  name: string;
  description?: string;
  category: ServiceCategory;
  price: number;
  duration_minutes: number;
  is_active: boolean;
}

export const serviceService = {
  createService: async (shopId: string | number, data: ServiceCreate): Promise<ServiceResponse> => {
    const response = await api.post<ServiceResponse>(`/api/v1/services?shop_id=${shopId}`, data);
    return response.data;
  },

  getServiceById: async (serviceId: string | number): Promise<ServiceResponse> => {
    const response = await api.get<ServiceResponse>(`/api/v1/services/${serviceId}`);
    return response.data;
  },

  getShopServices: async (shopId: string | number, includeInactive?: boolean): Promise<ServiceResponse[]> => {
    const params: any = {};
    if (includeInactive !== undefined) params.include_inactive = includeInactive;
    const response = await api.get<ServiceResponse[]>(`/api/v1/services/shop/${shopId}`, { params });
    return response.data;
  },

  updateService: async (serviceId: string | number, data: ServiceUpdate): Promise<ServiceResponse> => {
    const response = await api.put<ServiceResponse>(`/api/v1/services/${serviceId}`, data);
    return response.data;
  },

  deleteService: async (serviceId: string | number) => {
    const response = await api.delete(`/api/v1/services/${serviceId}`);
    return response.data;
  },
};
