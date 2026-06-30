import { create } from "zustand";
import { Design } from "../services/design.service";

interface UploadState {
  drafts: Design[];
  selectedDrafts: Set<string>;
  isUploading: boolean;
  uploadProgress: number;
  importProgress: number;

  setDrafts: (drafts: Design[]) => void;
  addDraft: (draft: Design) => void;
  updateDraft: (id: string, updates: Partial<Design>) => void;
  removeDraft: (id: string) => void;

  toggleDraftSelection: (id: string) => void;
  selectAllDrafts: () => void;
  clearSelection: () => void;

  setIsUploading: (status: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setImportProgress: (progress: number) => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  drafts: [],
  selectedDrafts: new Set(),
  isUploading: false,
  uploadProgress: 0,
  importProgress: 0,

  setDrafts: (drafts) => set({ drafts }),
  addDraft: (draft) => set((state) => ({ drafts: [draft, ...state.drafts] })),
  updateDraft: (id, updates) =>
    set((state) => ({
      drafts: state.drafts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  removeDraft: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedDrafts);
      newSelected.delete(id);
      return {
        drafts: state.drafts.filter((d) => d.id !== id),
        selectedDrafts: newSelected,
      };
    }),

  toggleDraftSelection: (id) =>
    set((state) => {
      const newSelected = new Set(state.selectedDrafts);
      if (newSelected.has(id)) newSelected.delete(id);
      else newSelected.add(id);
      return { selectedDrafts: newSelected };
    }),
  selectAllDrafts: () =>
    set((state) => ({
      selectedDrafts: new Set(state.drafts.map((d) => d.id)),
    })),
  clearSelection: () => set({ selectedDrafts: new Set() }),

  setIsUploading: (isUploading) => set({ isUploading }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setImportProgress: (importProgress) => set({ importProgress }),
}));
