import { create } from 'zustand';

export interface OnboardingData {
  step: number;
  role: string;
  inspirationStyles: string[];
  preferredFormats: string[];
  goals: string[];
  discoverySource: string;
}

interface OnboardingStoreState extends OnboardingData {
  setStep: (step: number) => void;
  setRole: (role: string) => void;
  setInspirationStyles: (styles: string[]) => void;
  toggleInspirationStyle: (style: string) => void;
  setPreferredFormats: (formats: string[]) => void;
  togglePreferredFormat: (format: string) => void;
  setGoals: (goals: string[]) => void;
  toggleGoal: (goal: string) => void;
  setDiscoverySource: (source: string) => void;
  loadFromLocalStorage: () => void;
  saveToLocalStorage: () => void;
  clearOnboarding: () => void;
}

const STORAGE_KEY = 'dzinr_onboarding_progress';

const initialData: OnboardingData = {
  step: 1, // Start at Welcome screen
  role: '',
  inspirationStyles: [],
  preferredFormats: [],
  goals: [],
  discoverySource: '',
};

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  ...initialData,

  setStep: (step) => {
    set({ step });
    get().saveToLocalStorage();
  },

  setRole: (role) => {
    set({ role });
    get().saveToLocalStorage();
  },

  setInspirationStyles: (inspirationStyles) => {
    set({ inspirationStyles });
    get().saveToLocalStorage();
  },

  toggleInspirationStyle: (style) => {
    const current = get().inspirationStyles;
    const next = current.includes(style)
      ? current.filter((s) => s !== style)
      : [...current, style];
    set({ inspirationStyles: next });
    get().saveToLocalStorage();
  },

  setPreferredFormats: (preferredFormats) => {
    set({ preferredFormats });
    get().saveToLocalStorage();
  },

  togglePreferredFormat: (format) => {
    const current = get().preferredFormats;
    const next = current.includes(format)
      ? current.filter((f) => f !== format)
      : [...current, format];
    set({ preferredFormats: next });
    get().saveToLocalStorage();
  },

  setGoals: (goals) => {
    set({ goals });
    get().saveToLocalStorage();
  },

  toggleGoal: (goal) => {
    const current = get().goals;
    const next = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    set({ goals: next });
    get().saveToLocalStorage();
  },

  setDiscoverySource: (discoverySource) => {
    set({ discoverySource });
    get().saveToLocalStorage();
  },

  saveToLocalStorage: () => {
    const { step, role, inspirationStyles, preferredFormats, goals, discoverySource } = get();
    const data: OnboardingData = { step, role, inspirationStyles, preferredFormats, goals, discoverySource };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  loadFromLocalStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<OnboardingData>;
        // Validate type check
        set({
          step: typeof parsed.step === 'number' ? parsed.step : 1,
          role: typeof parsed.role === 'string' ? parsed.role : '',
          inspirationStyles: Array.isArray(parsed.inspirationStyles) ? parsed.inspirationStyles : [],
          preferredFormats: Array.isArray(parsed.preferredFormats) ? parsed.preferredFormats : [],
          goals: Array.isArray(parsed.goals) ? parsed.goals : [],
          discoverySource: typeof parsed.discoverySource === 'string' ? parsed.discoverySource : '',
        });
      }
    } catch (e) {
      console.error('Failed to load onboarding progress from localStorage:', e);
    }
  },

  clearOnboarding: () => {
    localStorage.removeItem(STORAGE_KEY);
    set({ ...initialData });
  },
}));
