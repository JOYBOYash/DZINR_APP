import { create } from 'zustand';
import { AuthState, UserProfile } from '../types';

interface AuthStoreState extends AuthState {
  setUser: (user: UserProfile | null) => void;
  setFirebaseUser: (user: any | null) => void;
  setLoading: (loading: boolean) => void;
  setOnboardingRequired: (required: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,
  onboardingRequired: false,
  error: null,

  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => set({ loading }),
  setOnboardingRequired: (onboardingRequired) => set({ onboardingRequired }),
  setError: (error) => set({ error }),
  
  reset: () => set({ 
    user: null, 
    firebaseUser: null, 
    loading: false, 
    onboardingRequired: false, 
    error: null 
  })
}));
