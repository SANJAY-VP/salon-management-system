import api from './api';

// Matches backend ReviewCreate schema
export interface ReviewCreate {
  shop_id: number;
  rating: number;
  title?: string;
  comment?: string;
}

// Matches backend ReviewUpdate schema
export interface ReviewUpdate {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewResponse {
  id: number;
  shop_id: number;
  user_id: number;
  rating: number;
  title?: string;
  comment?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  user?: {
    id: number;
    full_name: string;
  };
}

export const reviewService = {
  createReview: async (data: ReviewCreate): Promise<ReviewResponse> => {
    const response = await api.post<ReviewResponse>('/api/v1/reviews', data);
    return response.data;
  },

  getReviewById: async (reviewId: string | number): Promise<ReviewResponse> => {
    const response = await api.get<ReviewResponse>(`/api/v1/reviews/${reviewId}`);
    return response.data;
  },

  getShopReviews: async (shopId: string | number, skip?: number, limit?: number): Promise<ReviewResponse[]> => {
    const params: any = {};
    if (skip !== undefined) params.skip = skip;
    if (limit !== undefined) params.limit = limit;
    const response = await api.get<ReviewResponse[]>(`/api/v1/reviews/shop/${shopId}`, { params });
    return response.data;
  },

  getMyReviews: async (skip?: number, limit?: number): Promise<ReviewResponse[]> => {
    const params: any = {};
    if (skip !== undefined) params.skip = skip;
    if (limit !== undefined) params.limit = limit;
    const response = await api.get<ReviewResponse[]>('/api/v1/reviews/user/my-reviews', { params });
    return response.data;
  },

  updateReview: async (reviewId: string | number, data: ReviewUpdate): Promise<ReviewResponse> => {
    const response = await api.put<ReviewResponse>(`/api/v1/reviews/${reviewId}`, data);
    return response.data;
  },

  deleteReview: async (reviewId: string | number) => {
    const response = await api.delete(`/api/v1/reviews/${reviewId}`);
    return response.data;
  },
};
