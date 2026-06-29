import { useState } from "react";
import { useConversationStore } from "../stores/conversationStore";
import { useMessageStore } from "../stores/messageStore";
import { useUiStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";
import { Avatar } from "./Avatar";
import { relativeTime } from "../lib/format";
import {
  convTitle,
  convAvatarId,
  convOnline,
  lastMessage,
  previewText,
} from "../lib/conv-helpers";

export function ConversationList({ filter }: { filter: string }) {
  const { conversations, users, activeConversationId, setActive, updateConversation, markRead, deleteConversation } =
    useConversationStore();
  const messages = useMessageStore((s) => s.messages);
  const toast = useUiStore((s) => s.toast);
  const currentUserId = useAuthStore((s) => s.currentUser?.id ?? 0);
  const [menu, setMenu] = useState<{ id: number; x: number; y: number } | null>(null);

  const visible = conversations.filter((c) => {
    if (c.archived) return false;
    if (!filter) return true;
    return convTitle(c, users, currentUserId).toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="flex-1 overflow-y-auto" onClick={() => setMenu(null)}>
      {visible.length === 0 && (
        <p className="p-6 text-center text-sm text-text-secondary">No chats found</p>
      )}
      {visible.map((conv) => {
        const last = lastMessage(messages[conv.id]);
        const active = conv.id === activeConversationId;
        return (
          <button
            key={conv.id}
            onClick={() => setActive(conv.id)}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({ id: conv.id, x: e.clientX, y: e.clientY });
            }}
            className={`flex w-full items-center gap-3 border-l-[3px] px-3 py-2.5 text-left transition-colors hover:bg-secondary ${
              active ? "border-signal-blue bg-secondary" : "border-transparent"
            }`}
          >
            <Avatar
              name={convTitle(conv, users, currentUserId)}
              id={convAvatarId(conv, users, currentUserId)}
              src={conv.avatar}
              isGroup={conv.type === "group"}
              online={convOnline(conv, users, currentUserId)}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate font-medium text-text-primary">{convTitle(conv, users, currentUserId)}</span>
                <span className={`shrink-0 text-xs ${conv.unread ? "text-signal-blue" : "text-text-secondary"}`}>
                  {last ? relativeTime(last.createdAt) : ""}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm text-text-secondary">
                  {previewText(last, users, conv.type === "group", currentUserId)}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  {conv.muted && (
                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-text-secondary"><path d="M16.5 12c0-1.77-1-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.42.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.8 8.8 0 0021 12a9 9 0 00-7-8.77v2.06A7 7 0 0119 12zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a9 9 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
                  )}
                  {conv.unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-signal-blue px-1.5 text-xs font-medium text-white">
                      {conv.unread}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </button>
        );
      })}

      {menu && (
        <div
          className="fixed z-50 w-44 overflow-hidden rounded-lg border bg-white py-1 shadow-xl"
          style={{ top: menu.y, left: menu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          {[
            { label: "Mark as read", fn: () => markRead(menu.id) },
            {
              label: conversations.find((c) => c.id === menu.id)?.muted ? "Unmute" : "Mute",
              fn: () => {
                const c = conversations.find((c) => c.id === menu.id);
                updateConversation(menu.id, { muted: !c?.muted });
              },
            },
            { label: "Archive", fn: () => { updateConversation(menu.id, { archived: true }); toast("Chat archived"); } },
            { label: "Delete", fn: () => { deleteConversation(menu.id); toast("Chat deleted"); }, danger: true },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => { item.fn(); setMenu(null); }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-secondary ${item.danger ? "text-destructive" : "text-text-primary"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
