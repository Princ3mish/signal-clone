import { create } from "zustand";
import type { Message, MsgStatus } from "../lib/types";
import api from "../lib/api";
import { connectWS, disconnectWS, sendWSEvent, onWSEvent, clearWSListeners } from "../lib/socket";

/** Map API message (snake_case) → frontend Message type */
function mapMsg(m: Record<string, unknown>): Message {
  return {
    id: m.id as number,
    conversationId: (m.conversation_id as number) ?? (m.conversationId as number),
    senderId: (m.sender_id as number) ?? (m.senderId as number),
    content: m.content as string,
    createdAt: (m.created_at as string) ?? (m.createdAt as string),
    status: (m.status as MsgStatus) ?? "sent",
    // Carry through extra display fields
    senderName: m.sender_name as string | undefined,
    senderAvatar: m.sender_avatar as string | undefined,
  } as Message & { senderName?: string; senderAvatar?: string };
}

interface MsgState {
  messages: Record<number, Message[]>;
  fetchMessages: (convId: number) => Promise<void>;
  sendMessage: (convId: number, content: string, senderId: number) => Promise<void>;
  addMessage: (msg: Message) => void;
  updateMessageStatus: (msgId: number, status: MsgStatus) => void;
  deleteMessage: (conversationId: number, msgId: number) => void;
  connectToConversation: (convId: number, userId: number) => void;
  sendTyping: (convId: number, isTyping: boolean) => void;
}

export const useMessageStore = create<MsgState>((set, get) => ({
  messages: {},

  fetchMessages: async (convId) => {
    try {
      const { data } = await api.get(`/api/conversations/${convId}/messages`);
      set((s) => ({ messages: { ...s.messages, [convId]: data.map(mapMsg) } }));
    } catch {
      // ignore — keep previous messages
    }
  },

  sendMessage: async (convId, content, senderId) => {
    // Optimistic update
    const tempId = Date.now() * -1; // negative to avoid collisions with real IDs
    const tempMsg: Message = {
      id: tempId,
      conversationId: convId,
      senderId,
      content,
      createdAt: new Date().toISOString(),
      status: "sending",
    };
    set((s) => ({
      messages: {
        ...s.messages,
        [convId]: [...(s.messages[convId] || []), tempMsg],
      },
    }));

    try {
      const { data } = await api.post(`/api/conversations/${convId}/messages`, { content });
      const realMsg = mapMsg(data);
      // Replace temp with real message
      set((s) => ({
        messages: {
          ...s.messages,
          [convId]: (s.messages[convId] || []).map((m) => (m.id === tempId ? realMsg : m)),
        },
      }));
    } catch {
      // Mark as failed
      get().updateMessageStatus(tempId, "sending");
    }
  },

  addMessage: (msg) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [msg.conversationId]: [...(s.messages[msg.conversationId] || []), msg],
      },
    })),

  updateMessageStatus: (msgId, status) =>
    set((s) => {
      const next: Record<number, Message[]> = {};
      for (const [k, list] of Object.entries(s.messages)) {
        next[+k] = list.map((m) => (m.id === msgId ? { ...m, status } : m));
      }
      return { messages: next };
    }),

  deleteMessage: (conversationId, msgId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: (s.messages[conversationId] || []).filter((m) => m.id !== msgId),
      },
    })),

  connectToConversation: (convId, userId) => {
    // Clear previous listeners to avoid duplicate handlers
    clearWSListeners();
    connectWS(convId, userId);

    onWSEvent("new_message", (data: unknown) => {
      const d = data as { message: Record<string, unknown>; sender_id?: number };
      const msg = mapMsg(d.message);
      // Skip self-echoes: sender already has the message from the API response
      if (d.sender_id === userId) return;
      if (msg.conversationId === convId) {
        set((s) => {
          const existing = s.messages[convId] || [];
          if (existing.some((m) => m.id === msg.id)) return {};
          return { messages: { ...s.messages, [convId]: [...existing, msg] } };
        });
      }
    });

    onWSEvent("message_status", (data: unknown) => {
      const d = data as { message_id: number; status: MsgStatus };
      get().updateMessageStatus(d.message_id, d.status);
    });
  },

  sendTyping: (convId, isTyping) => {
    sendWSEvent(isTyping ? "typing_start" : "typing_stop", { conversation_id: convId });
  },
}));

export { disconnectWS };
