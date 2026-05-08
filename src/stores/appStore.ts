import { create } from 'zustand';
import { Events, trackEvent } from '../lib/analytics';

export type ToastKind = 'success' | 'info' | 'warning' | 'error';
export type Plan = 'free' | 'pro';
export type UpgradeReason =
  | 'image_limit'
  | 'password_room'
  | 'file_upload'
  | 'custom_slug'
  | 'expiry_7d'
  | 'history_30d'
  | 'third_device'
  | 'default';

export type Toast = {
  id: string;
  kind: ToastKind;
  title: string;
  body?: string;
};

type AppState = {
  userId: string | null;
  isAnonymous: boolean;
  plan: Plan;
  setSession: (userId: string | null, isAnonymous: boolean) => void;
  setPlan: (plan: Plan) => void;

  signInModalOpen: boolean;
  openSignIn: () => void;
  closeSignIn: () => void;

  upgradeModalOpen: boolean;
  upgradeReason: UpgradeReason;
  openUpgrade: (reason?: UpgradeReason) => void;
  closeUpgrade: () => void;

  createRoomModalOpen: boolean;
  openCreateRoom: () => void;
  closeCreateRoom: () => void;

  feedbackModalOpen: boolean;
  openFeedback: () => void;
  closeFeedback: () => void;

  toasts: Toast[];
  pushToast: (t: Omit<Toast, 'id'>) => string;
  dismissToast: (id: string) => void;
};

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  isAnonymous: true,
  plan: 'free',
  setSession: (userId, isAnonymous) => set({ userId, isAnonymous }),
  setPlan: (plan) => set({ plan }),

  signInModalOpen: false,
  openSignIn: () => set({ signInModalOpen: true }),
  closeSignIn: () => set({ signInModalOpen: false }),

  upgradeModalOpen: false,
  upgradeReason: 'default',
  openUpgrade: (reason = 'default') => {
    if (reason !== 'default') trackEvent(Events.proGateHit, { reason });
    set({ upgradeModalOpen: true, upgradeReason: reason });
  },
  closeUpgrade: () => set({ upgradeModalOpen: false }),

  createRoomModalOpen: false,
  openCreateRoom: () => set({ createRoomModalOpen: true }),
  closeCreateRoom: () => set({ createRoomModalOpen: false }),

  feedbackModalOpen: false,
  openFeedback: () => set({ feedbackModalOpen: true }),
  closeFeedback: () => set({ feedbackModalOpen: false }),

  toasts: [],
  pushToast: (t) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...t, id }] }));
    return id;
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((x) => x.id !== id) })),
}));
