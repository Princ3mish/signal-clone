import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "../lib/types";
import api from "../lib/api";

interface AuthState {
  currentUser: User | null;
  token: string | null;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    phone_number: string;
    display_name: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      login: async (credentials) => {
        const { data } = await api.post("/api/auth/login", credentials);
        set({ currentUser: mapUser(data.user), token: data.token });
      },
      register: async (data) => {
        const { data: res } = await api.post("/api/auth/register", data);
        set({ currentUser: mapUser(res.user), token: res.token });
      },
      logout: () => set({ currentUser: null, token: null }),
      updateProfile: (data) =>
        set((s) => ({
          currentUser: s.currentUser ? { ...s.currentUser, ...data } : null,
        })),
    }),
    { name: "signal-auth" },
  ),
);

/** Map snake_case API response to camelCase User type */
function mapUser(u: Record<string, unknown>): User {
  return {
    id: u.id as number,
    username: u.username as string,
    displayName: (u.display_name as string) ?? (u.displayName as string),
    phone: (u.phone_number as string) ?? (u.phone as string) ?? "",
    avatar: (u.avatar_url as string) ?? undefined,
    online: Boolean(u.online_status),
    lastSeen: (u.last_seen as string) ?? undefined,
  };
}
