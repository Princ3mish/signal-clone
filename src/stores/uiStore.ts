import { create } from "zustand";

export type ModalType =
  | "newChat"
  | "newGroup"
  | "profile"
  | "groupInfo"
  | null;

interface Toast {
  id: number;
  message: string;
}

interface UiState {
  activeModal: ModalType;
  modalPayload: unknown;
  profileUserId: number | null;
  typingUsers: Record<number, number[]>; // convId -> userIds
  toasts: Toast[];
  openModal: (m: ModalType, payload?: unknown) => void;
  closeModal: () => void;
  showProfile: (userId: number) => void;
  setTyping: (convId: number, userIds: number[]) => void;
  toast: (message: string) => void;
  dismissToast: (id: number) => void;
}

let toastId = 0;

export const useUiStore = create<UiState>((set) => ({
  activeModal: null,
  modalPayload: null,
  profileUserId: null,
  typingUsers: {},
  toasts: [],
  openModal: (m, payload) => set({ activeModal: m, modalPayload: payload }),
  closeModal: () => set({ activeModal: null, modalPayload: null }),
  showProfile: (userId) => set({ activeModal: "profile", profileUserId: userId }),
  setTyping: (convId, userIds) =>
    set((s) => ({ typingUsers: { ...s.typingUsers, [convId]: userIds } })),
  toast: (message) => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, message }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
