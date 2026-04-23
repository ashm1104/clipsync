import { create } from 'zustand';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
};

type AppState = {
  userId: string | null;
  isAnonymous: boolean;
  setSession: (userId: string | null, isAnonymous: boolean) => void;

  signInModalOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;

  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  isAnonymous: true,
  setSession: (userId, isAnonymous) => set({ userId, isAnonymous }),

  signInModalOpen: false,
  openSignIn: () => set({ signInModalOpen: true }),
  closeSignIn: () => set({ signInModalOpen: false }),

  toasts: [],
  pushToast: (t) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...t, id }] }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) })),
}));
