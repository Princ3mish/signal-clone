import { useState } from "react";
import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
import { useConversationStore } from "../stores/conversationStore";
import { useUiStore } from "../stores/uiStore";

export function NewChatModal() {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const openModal = useUiStore((s) => s.openModal);
  const { users, createDirect } = useConversationStore();
  const [q, setQ] = useState("");
  const open = activeModal === "newChat";

  const list = users
    .filter((u) => u.id !== 1)
    .filter((u) => u.displayName.toLowerCase().includes(q.toLowerCase()) || u.username.includes(q.toLowerCase()));

  return (
    <Modal open={open} onClose={closeModal}>
      <div className="border-b px-5 py-4">
        <h2 className="text-lg font-medium text-text-primary">New chat</h2>
      </div>
      <div className="p-4">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or username"
          className="mb-2 w-full rounded-lg bg-secondary px-3 py-2 text-sm outline-none"
        />
        <button
          onClick={() => openModal("newGroup")}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-secondary"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-signal-blue text-white">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
          <span className="font-medium text-text-primary">New group</span>
        </button>
        <div className="mt-2 max-h-72 overflow-y-auto">
          {list.map((u) => (
            <button
              key={u.id}
              onClick={() => { createDirect(u.id); closeModal(); }}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-secondary"
            >
              <Avatar name={u.displayName} id={u.id} online={u.online} />
              <div>
                <div className="font-medium text-text-primary">{u.displayName}</div>
                <div className="text-xs text-text-secondary">{u.phone}</div>
              </div>
            </button>
          ))}
          {list.length === 0 && <p className="py-4 text-center text-sm text-text-secondary">No users found</p>}
        </div>
      </div>
    </Modal>
  );
}
