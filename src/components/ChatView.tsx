import { useEffect, useRef, useState } from "react";
import { useConversationStore } from "../stores/conversationStore";
import { useMessageStore, disconnectWS } from "../stores/messageStore";
import { useUiStore } from "../stores/uiStore";
import { useAuthStore } from "../stores/authStore";
import { Avatar } from "./Avatar";
import { MessageBubble } from "./MessageBubble";
import { DateSeparator } from "./DateSeparator";
import { TypingIndicator } from "./TypingIndicator";
import { dateSeparatorLabel, dayKey, lastSeenLabel } from "../lib/format";
import { convTitle, convAvatarId, otherUser } from "../lib/conv-helpers";

export function ChatView({ onBack }: { onBack?: () => void }) {
  const { conversations, users, activeConversationId, openMenu } = useChatData();
  const conv = conversations.find((c) => c.id === activeConversationId);
  const messages = useMessageStore((s) => s.messages);
  const sendMessage = useMessageStore((s) => s.sendMessage);
  const sendTypingEvent = useMessageStore((s) => s.sendTyping);
  const toast = useUiStore((s) => s.toast);
  const openModal = useUiStore((s) => s.openModal);
  const showProfile = useUiStore((s) => s.showProfile);
  const typingUsers = useUiStore((s) => s.typingUsers);
  const setTyping = useUiStore((s) => s.setTyping);
  const currentUser = useAuthStore((s) => s.currentUser);
  const currentUserId = currentUser?.id ?? 0;
  const [text, setText] = useState("");
  const [menu, setMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const convMessages = activeConversationId ? messages[activeConversationId] || [] : [];

  // Fetch messages and connect WebSocket when conversation opens.
  // Use getState() so store actions are NOT reactive deps — prevents
  // the effect re-firing (and double-fetching) on every render.
  useEffect(() => {
    if (!activeConversationId || !currentUserId) return;
    const store = useMessageStore.getState();
    store.fetchMessages(activeConversationId);
    store.connectToConversation(activeConversationId, currentUserId);
    return () => disconnectWS();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, currentUserId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    inputRef.current?.focus();
  }, [activeConversationId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [convMessages.length, typingUsers]);

  const send = () => {
    const t = text.trim();
    if (!t || !activeConversationId || !currentUserId) return;
    sendMessage(activeConversationId, t, currentUserId);
    useConversationStore.getState().bumpToTop(activeConversationId);
    setText("");
    setTyping(activeConversationId, []);
    sendTypingEvent(activeConversationId, false);
  };

  const onType = (v: string) => {
    setText(v);
    if (activeConversationId) sendTypingEvent(activeConversationId, true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      if (activeConversationId) sendTypingEvent(activeConversationId, false);
    }, 3000);
  };

  if (!conv) {
    return (
      <div className="flex h-full flex-1 flex-col items-center justify-center chat-pattern text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-signal-blue/10">
          <svg viewBox="0 0 24 24" className="h-12 w-12 fill-signal-blue"><path d="M12 2C6.48 2 2 6.04 2 11c0 2.7 1.34 5.1 3.45 6.74-.13 1.2-.6 2.5-1.4 3.6-.2.27 0 .66.34.6 2-.36 3.7-1.1 4.9-2 .85.2 1.76.31 2.71.31 5.52 0 10-4.04 10-9S17.52 2 12 2z"/></svg>
        </div>
        <h2 className="mt-4 text-xl font-medium text-text-primary">Signal</h2>
        <p className="mt-1 text-sm text-text-secondary">Select a chat to start messaging</p>
      </div>
    );
  }

  const isGroup = conv.type === "group";
  const other = otherUser(conv, users, currentUserId);
  const statusLine = isGroup
    ? `${conv.memberIds.length} members`
    : other?.online
      ? "online"
      : lastSeenLabel(other?.lastSeen);

  const typingIds = (typingUsers[conv.id] || []).filter((id) => id !== currentUserId);

  const menuItems = [
    { label: "View contact", fn: () => isGroup ? openModal("groupInfo", conv.id) : other && showProfile(other.id) },
    { label: "Media", fn: () => toast("Media gallery coming soon") },
    { label: "Search", fn: () => toast("In-chat search coming soon") },
    { label: conv.muted ? "Unmute" : "Mute", fn: () => useConversationStore.getState().updateConversation(conv.id, { muted: !conv.muted }) },
    { label: "Archive", fn: () => { useConversationStore.getState().updateConversation(conv.id, { archived: true }); useConversationStore.getState().setActive(null); toast("Chat archived"); } },
    { label: "Delete chat", fn: () => { useConversationStore.getState().deleteConversation(conv.id); toast("Chat deleted"); }, danger: true },
  ];

  let lastDay = "";
  let lastSender = -1;

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b bg-header-bg px-4 py-2">
        {onBack && (
          <button onClick={onBack} className="md:hidden rounded-full p-1 hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-text-primary"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"/></svg>
          </button>
        )}
        <button
          className="flex min-w-0 flex-1 items-center gap-3"
          onClick={() => isGroup ? openModal("groupInfo", conv.id) : other && showProfile(other.id)}
        >
          <Avatar name={convTitle(conv, users, currentUserId)} id={convAvatarId(conv, users, currentUserId)} src={conv.avatar} isGroup={isGroup} online={!isGroup && other?.online} />
          <div className="min-w-0 text-left">
            <div className="truncate font-medium text-text-primary">{convTitle(conv, users, currentUserId)}</div>
            <div className="truncate text-xs text-text-secondary">{statusLine}</div>
          </div>
        </button>
        <div className="flex items-center gap-1 text-text-secondary">
          <button onClick={() => toast("Voice calls coming soon")} className="rounded-full p-2 hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          </button>
          <button onClick={() => toast("Video calls coming soon")} className="rounded-full p-2 hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          </button>
          <button onClick={() => toast("In-chat search coming soon")} className="rounded-full p-2 hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z"/></svg>
          </button>
          <div className="relative">
            <button onClick={() => setMenu((v) => !v)} className="rounded-full p-2 hover:bg-black/5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M12 8a2 2 0 100-4 2 2 0 000 4zm0 2a2 2 0 100 4 2 2 0 000-4zm0 6a2 2 0 100 4 2 2 0 000-4z"/></svg>
            </button>
            {menu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenu(false)} />
                <div className="absolute right-0 z-50 mt-1 w-44 overflow-hidden rounded-lg border bg-white py-1 shadow-xl">
                  {menuItems.map((it) => (
                    <button key={it.label} onClick={() => { it.fn(); setMenu(false); }} className={`block w-full px-4 py-2 text-left text-sm hover:bg-secondary ${it.danger ? "text-destructive" : "text-text-primary"}`}>
                      {it.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 space-y-0.5 overflow-y-auto chat-pattern px-4 py-3">
        {convMessages.map((msg) => {
          const day = dayKey(msg.createdAt);
          const showDate = day !== lastDay;
          lastDay = day;
          const showSender = isGroup && msg.senderId !== lastSender && msg.senderId !== currentUserId && !msg.system;
          if (!msg.system) lastSender = msg.senderId;
          const sender = users.find((u) => u.id === msg.senderId);
          return (
            <div key={msg.id}>
              {showDate && <DateSeparator label={dateSeparatorLabel(msg.createdAt)} />}
              <MessageBubble
                message={msg}
                isSent={msg.senderId === currentUserId}
                showSender={showSender}
                senderName={sender?.displayName}
              />
            </div>
          );
        })}
        {typingIds.map((id) => {
          const u = users.find((x) => x.id === id);
          return u ? <TypingIndicator key={id} name={u.displayName} id={id} /> : null;
        })}
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 bg-header-bg px-4 py-2.5">
        <button onClick={() => toast("Emoji picker coming soon")} className="rounded-full p-2 text-text-secondary hover:bg-black/5">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-3.5 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 17.5c-2.3 0-4.3-1.3-5.2-3.2h10.4c-.9 1.9-2.9 3.2-5.2 3.2z"/></svg>
        </button>
        <button onClick={() => toast("File sharing coming soon")} className="rounded-full p-2 text-text-secondary hover:bg-black/5">
          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M16.5 6v11.5a4 4 0 11-8 0V5a2.5 2.5 0 015 0v10.5a1 1 0 11-2 0V6H10v9.5a2.5 2.5 0 005 0V5a4 4 0 10-8 0v12.5a5.5 5.5 0 0011 0V6h-1.5z"/></svg>
        </button>
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => onType(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={1}
          placeholder="Message"
          className="max-h-32 flex-1 resize-none rounded-2xl bg-white px-4 py-2.5 text-[15px] text-text-primary outline-none"
          style={{ height: "auto" }}
        />
        {text.trim() ? (
          <button onClick={send} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-signal-blue text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        ) : (
          <button onClick={() => toast("Voice messages coming soon")} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3zm5-3a5 5 0 01-10 0H5a7 7 0 006 6.92V21h2v-3.08A7 7 0 0019 11h-2z"/></svg>
          </button>
        )}
      </div>
    </div>
  );
}

// small helper hook to keep selectors tidy
function useChatData() {
  const conversations = useConversationStore((s) => s.conversations);
  const users = useConversationStore((s) => s.users);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  return { conversations, users, activeConversationId, openMenu: false };
}
