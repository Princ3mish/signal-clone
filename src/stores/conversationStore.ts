import { create } from "zustand";
import type { Conversation, User } from "../lib/types";
import api from "../lib/api";

interface ConvState {
  conversations: Conversation[];
  users: User[];
  activeConversationId: number | null;
  loading: boolean;
  fetchConversations: () => Promise<void>;
  fetchUsers: () => Promise<void>;
  setActive: (id: number | null) => void;
  markRead: (id: number) => void;
  bumpToTop: (id: number) => void;
  createDirect: (userId: number) => Promise<number>;
  createGroup: (name: string, memberIds: number[], avatar?: string) => Promise<number>;
  updateConversation: (id: number, data: Partial<Conversation>) => void;
  removeMember: (convId: number, userId: number) => void;
  addMember: (convId: number, userId: number) => void;
  deleteConversation: (id: number) => void;
}

/** Map API conversation (snake_case, members array) → frontend Conversation type */
function mapConv(c: Record<string, unknown>): Conversation {
  const members = (c.members as Array<Record<string, unknown>>) ?? [];
  return {
    id: c.id as number,
    type: c.type as "direct" | "group",
    name: (c.group_name as string) ?? undefined,
    avatar: (c.group_avatar as string) ?? undefined,
    memberIds: members.map((m) => m.id as number),
    adminIds: members.filter((m) => m.is_admin).map((m) => m.id as number),
    unread: (c.unread_count as number) ?? 0,
    // carry through API fields for display helpers
    _members: members,
    _lastMessage: c.last_message as string | undefined,
    _lastMessageAt: c.last_message_at as string | undefined,
  } as Conversation & { _members: unknown[]; _lastMessage?: string; _lastMessageAt?: string };
}

/** Map API user (snake_case) → frontend User type */
function mapUser(u: Record<string, unknown>): User {
  return {
    id: u.id as number,
    username: u.username as string,
    displayName: (u.display_name as string) ?? "",
    phone: (u.phone_number as string) ?? "",
    avatar: (u.avatar_url as string) ?? undefined,
    online: Boolean(u.online_status),
    lastSeen: (u.last_seen as string) ?? undefined,
  };
}

export const useConversationStore = create<ConvState>((set, get) => ({
  conversations: [],
  users: [],
  activeConversationId: null,
  loading: false,

  fetchConversations: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get("/api/conversations");
      set({ conversations: data.map(mapConv), loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUsers: async () => {
    try {
      const { data } = await api.get("/api/users");
      set({ users: data.map(mapUser) });
    } catch {
      // ignore
    }
  },

  setActive: (id) => {
    set({ activeConversationId: id });
    if (id != null) get().markRead(id);
  },

  markRead: (id) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, unread: 0 } : c)),
    })),

  bumpToTop: (id) =>
    set((s) => {
      const idx = s.conversations.findIndex((c) => c.id === id);
      if (idx <= 0) return {};
      const next = [...s.conversations];
      const [c] = next.splice(idx, 1);
      next.unshift(c);
      return { conversations: next };
    }),

  createDirect: async (userId) => {
    const { data } = await api.post("/api/conversations", { type: "direct", user_id: userId });
    await get().fetchConversations();
    get().setActive(data.id);
    return data.id;
  },

  createGroup: async (name, memberIds, _avatar) => {
    const { data } = await api.post("/api/conversations", {
      type: "group",
      name,
      member_ids: memberIds,
    });
    await get().fetchConversations();
    get().setActive(data.id);
    return data.id;
  },

  updateConversation: (id, data) =>
    set((s) => ({
      conversations: s.conversations.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),

  removeMember: (convId, userId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId ? { ...c, memberIds: c.memberIds.filter((m) => m !== userId) } : c,
      ),
    })),

  addMember: (convId, userId) =>
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === convId && !c.memberIds.includes(userId)
          ? { ...c, memberIds: [...c.memberIds, userId] }
          : c,
      ),
    })),

  deleteConversation: (id) =>
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
    })),
}));
