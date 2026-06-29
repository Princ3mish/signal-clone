export interface User {
  id: number;
  username: string;
  displayName: string;
  phone: string;
  avatar?: string;
  online: boolean;
  lastSeen?: string; // ISO
}

export type MsgStatus = "sending" | "sent" | "delivered" | "read";

export interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  createdAt: string; // ISO
  status: MsgStatus;
  system?: boolean;
}

export interface Conversation {
  id: number;
  type: "direct" | "group";
  name?: string; // group name
  avatar?: string;
  memberIds: number[];
  adminIds?: number[];
  description?: string;
  muted?: boolean;
  archived?: boolean;
  unread: number;
}
