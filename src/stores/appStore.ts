import { create } from 'zustand';

type AppState = {
  userId: string | null;
  setUserId: (id: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  setUserId: (id) => set({ userId: id }),
}));
