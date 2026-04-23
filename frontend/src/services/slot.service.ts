import api from "./api";
import { TimeSlot } from "../types";

// Matches backend SlotCreate schema exactly
export interface SlotCreate {
  shop_id: number;
  barber_id?: number;
  date: string;        // "YYYY-MM-DD"
  start_time: string;  // "HH:MM" or "HH:MM:SS"
  end_time: string;    // "HH:MM" or "HH:MM:SS"
}

// Matches backend SlotUpdate schema
export interface SlotUpdate {
  barber_id?: number;
  status?: string;
  is_active?: boolean;
}

export const slotService = {
  getShopSlots: async (
    shopId: string | number,
    startDate?: string,
    endDate?: string,
    barberId?: string | number
  ): Promise<TimeSlot[]> => {
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    if (barberId) params.barber_id = barberId;
    const response = await api.get<TimeSlot[]>(`/api/v1/slots/shop/${shopId}`, { params });
    // Populate the legacy .time field for components that still use it
    return response.data.map((s) => ({ ...s, time: s.start_time || s.time }));
  },

  getAvailableSlots: async (
    shopId: string | number,
    date?: string,
    barberId?: string | number
  ): Promise<TimeSlot[]> => {
    const params: any = {};
    if (date) params.slot_date = date;
    if (barberId) params.barber_id = barberId;
    const response = await api.get<TimeSlot[]>(`/api/v1/slots/shop/${shopId}/available`, { params });
    return response.data.map((s) => ({ ...s, time: s.start_time || s.time }));
  },

  getSlotById: async (slotId: string | number): Promise<TimeSlot> => {
    const response = await api.get<TimeSlot>(`/api/v1/slots/${slotId}`);
    return { ...response.data, time: response.data.start_time || response.data.time };
  },

  createSlot: async (data: SlotCreate): Promise<TimeSlot> => {
    const response = await api.post<TimeSlot>("/api/v1/slots", data);
    return { ...response.data, time: response.data.start_time || response.data.time };
  },

  updateSlot: async (slotId: string | number, data: SlotUpdate): Promise<TimeSlot> => {
    const response = await api.put<TimeSlot>(`/api/v1/slots/${slotId}`, data);
    return { ...response.data, time: response.data.start_time || response.data.time };
  },

  createBulkSlots: async (slots: SlotCreate[]): Promise<TimeSlot[]> => {
    const response = await api.post<TimeSlot[]>("/api/v1/slots/bulk", slots);
    return response.data.map((s) => ({ ...s, time: s.start_time || s.time }));
  },

  deleteSlot: async (slotId: string | number) => {
    const response = await api.delete(`/api/v1/slots/${slotId}`);
    return response.data;
  },

  /** Auto-generate 30-min slots from shop opening to closing time for a given date. */
  autoGenerateSlots: async (
    shopId: string | number,
    date: string,
    barberId?: string | number,
    intervalMinutes = 30
  ): Promise<TimeSlot[]> => {
    const response = await api.post<TimeSlot[]>(`/api/v1/slots/shop/${shopId}/auto-generate`, {
      date,
      barber_id: barberId ?? null,
      interval_minutes: intervalMinutes,
    });
    return response.data.map((s) => ({ ...s, time: s.start_time || s.time }));
  },
};
