import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthState, User } from '../types';
import { authService } from '../services/auth.service';

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<User>;
  register: (userData: RegisterPayload) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

interface RegisterPayload {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: 'customer' | 'barber';
}

/** Request browser geolocation and silently returns coords or null. */
function fetchGeolocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}

function buildUser(userData: any, geo?: { latitude: number; longitude: number } | null): User {
  return {
    id: userData.id.toString(),
    fullName: userData.full_name,
    name: userData.full_name || '',
    email: userData.email,
    phone: userData.phone || '',
    avatar: userData.avatar || undefined,
    role: userData.role === 'barber_owner' ? 'barber' : 'customer',
    address: userData.address || '',
    city: userData.city || '',
    state: userData.state || '',
    pincode: userData.pincode || '',
    isActive: userData.is_active,
    isVerified: userData.is_verified,
    points: userData.points || 0,
    createdAt: userData.created_at || new Date().toISOString(),
    latitude: geo?.latitude,
    longitude: geo?.longitude,
  };
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: undefined,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authService.login(email, password);
          const token = data.access_token;
          localStorage.setItem('authToken', token);

          // Fetch user profile and geolocation in parallel
          const [userData, geo] = await Promise.all([
            authService.getMe(),
            fetchGeolocation(),
          ]);

          const loggedUser = buildUser(userData, geo);
          set({ user: loggedUser, isAuthenticated: true, isLoading: false, token });
          return loggedUser;
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error?.response?.data?.detail || error.message || 'Invalid credentials';
          throw new Error(message);
        }
      },

      register: async (userData) => {
        set({ isLoading: true });
        try {
          // Map UI role ("barber") to backend role ("barber_owner")
          const backendRole = userData.role === 'barber' ? 'barber_owner' : 'customer';
          await authService.register({
            email: userData.email,
            password: userData.password,
            full_name: userData.name,
            phone: userData.phone,
            role: backendRole,
          });
          // Auto-login after registration
          const user = await get().login(userData.email, userData.password);
          return user;
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error?.response?.data?.detail || error.message || 'Registration failed';
          throw new Error(message);
        }
      },

      logout: () => {
        localStorage.removeItem('authToken');
        set({ user: null, isAuthenticated: false, token: undefined });
      },

      updateUser: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },

      checkAuth: async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;

        set({ isLoading: true });
        try {
          const userData = await authService.getMe();
          const existing = get().user;
          // Preserve previously fetched geolocation
          const geo =
            existing?.latitude != null
              ? { latitude: existing.latitude, longitude: existing.longitude! }
              : null;
          const loggedUser = buildUser(userData, geo);
          set({ user: loggedUser, isAuthenticated: true, isLoading: false, token });
        } catch {
          get().logout();
          set({ isLoading: false });
        }
      },

      loginWithGoogle: async () => {
        set({ isLoading: true });
        try {
          const data = await authService.googleLogin();
          const token = data.access_token;
          localStorage.setItem('authToken', token);

          const [userData, geo] = await Promise.all([
            authService.getMe(),
            fetchGeolocation(),
          ]);

          const loggedUser = buildUser(userData, geo);
          set({ user: loggedUser, isAuthenticated: true, isLoading: false, token });
        } catch (error: any) {
          set({ isLoading: false });
          const message =
            error?.response?.data?.detail || error.message || 'Google login failed';
          throw new Error(message);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    }
  )
);
