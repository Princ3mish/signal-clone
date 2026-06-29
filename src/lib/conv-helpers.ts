import type { Conversation, User, Message } from "./types";

export function otherUser(conv: Conversation, users: User[], currentUserId: number): User | undefined {
  if (conv.type !== "direct") return undefined;
  const id = conv.memberIds.find((m) => m !== currentUserId);
  return users.find((u) => u.id === id);
}

export function convTitle(conv: Conversation, users: User[], currentUserId?: number): string {
  if (conv.type === "group") return conv.name || "Group";
  return otherUser(conv, users, currentUserId ?? 0)?.displayName || "Unknown";
}

export function convAvatarId(conv: Conversation, users: User[], currentUserId?: number): number {
  if (conv.type === "group") return conv.id;
  return otherUser(conv, users, currentUserId ?? 0)?.id ?? conv.id;
}

export function convOnline(conv: Conversation, users: User[], currentUserId?: number): boolean {
  if (conv.type === "group") return false;
  return !!otherUser(conv, users, currentUserId ?? 0)?.online;
}

export function lastMessage(msgs: Message[] | undefined): Message | undefined {
  if (!msgs || msgs.length === 0) return undefined;
  return msgs[msgs.length - 1];
}

export function previewText(
  msg: Message | undefined,
  users: User[],
  isGroup: boolean,
  currentUserId = 0,
): string {
  if (!msg) return "No messages yet";
  if (msg.system) return msg.content;
  const sender = users.find((u) => u.id === msg.senderId);
  const prefix =
    msg.senderId === currentUserId
      ? "You: "
      : isGroup
        ? `${sender?.displayName?.split(" ")[0]}: `
        : "";
  return prefix + msg.content;
}
