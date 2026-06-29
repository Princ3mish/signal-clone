import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Avatar } from "./Avatar";
import { ConversationList } from "./ConversationList";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";

export function Sidebar() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const openModal = useUiStore((s) => s.openModal);
  const showProfile = useUiStore((s) => s.showProfile);
  const toast = useUiStore((s) => s.toast);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"chats" | "calls" | "stories">("chats");

  return (
    <div className="flex h-full w-full flex-col border-r bg-sidebar-bg md:w-[360px] md:shrink-0">
      {/* Top bar */}
      <div className="flex items-center justify-between bg-header-bg px-4 py-2.5">
        <button onClick={() => currentUser && showProfile(currentUser.id)} className="flex items-center gap-3">
          {currentUser && <Avatar name={currentUser.displayName} id={currentUser.id} size="md" />}
          <span className="text-lg font-bold text-text-primary">Signal</span>
        </button>
        <div className="flex items-center gap-1 text-text-secondary">
          <button onClick={() => openModal("newChat")} className="rounded-full p-2 hover:bg-black/5" title="New chat">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
          </button>
          <Link to="/settings" className="rounded-full p-2 hover:bg-black/5" title="Settings">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 00-.48-.41h-3.84a.48.48 0 00-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 00-.59.22L2.74 8.87a.48.48 0 00.12.61l2.03 1.58c-.05.3-.07.62-.07.94 0 .32.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.13.22.39.3.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.04.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.03-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z"/></svg>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-1.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-text-secondary"><path d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 10-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0A4.5 4.5 0 1114 9.5 4.5 4.5 0 019.5 14z"/></svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && setSearch("")}
            placeholder="Search"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b text-sm">
        {(["chats", "calls", "stories"] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t !== "chats") toast(`${t[0].toUpperCase() + t.slice(1)} coming soon`); }}
            className={`flex-1 border-b-2 py-2 capitalize transition-colors ${
              tab === t ? "border-signal-blue font-medium text-signal-blue" : "border-transparent text-text-secondary"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "chats" ? (
        <ConversationList filter={search} />
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center text-sm text-text-secondary">
          {tab === "calls" ? "Calls coming soon" : "Stories coming soon"}
        </div>
      )}
    </div>
  );
}
