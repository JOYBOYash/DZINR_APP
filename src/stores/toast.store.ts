import { create } from 'zustand';
import { ToastMessage, ToastType } from '../components/Toast';

interface ToastStore {
  toasts: ToastMessage[];
  showToast: (message: string, type: ToastType) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  showToast: (message, type) => 
    set((state) => ({ 
      toasts: [...state.toasts, { id: Math.random().toString(36).substring(7), message, type }] 
    })),
  removeToast: (id) => 
    set((state) => ({ 
      toasts: state.toasts.filter((t) => t.id !== id) 
    })),
}));
