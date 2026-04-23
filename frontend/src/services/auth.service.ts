import api from './api';

export interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  role?: string;
  /** Full image URL or basename from POST /images/upload */
  avatar?: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post('/api/v1/auth/login', { email, password });
    return response.data;
  },
  
  
  register: async (userData: any) => {
    const response = await api.post('/api/v1/auth/register', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await api.get('/api/v1/auth/me');
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put('/api/v1/auth/me', data);
    return response.data;
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.post('/api/v1/auth/change-password', data);
    return response.data;
  },

  verifyEmail: async (userId: string | number) => {
    const response = await api.post(`/api/v1/auth/verify-email/${userId}`);
    return response.data;
  },

  deactivateAccount: async () => {
    const response = await api.post('/api/v1/auth/deactivate');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/api/v1/auth/logout');
    return response.data;
  },
  
  forgotPassword: async (email: string) => {
    const response = await api.post('/api/v1/auth/forgot-password', { email });
    return response.data;
  },
  
  googleLogin: async () => {
    const response = await api.post('/api/v1/auth/google-login');
    return response.data;
  }
};
