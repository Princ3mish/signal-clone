import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
import { useConversationStore } from "../stores/conversationStore";
import { useUiStore } from "../stores/uiStore";
import { lastSeenLabel } from "../lib/format";

export function ProfileModal() {
  const activeModal = useUiStore((s) => s.activeModal);
  const profileUserId = useUiStore((s) => s.profileUserId);
  const closeModal = useUiStore((s) => s.closeModal);
  const toast = useUiStore((s) => s.toast);
  const { users, createDirect } = useConversationStore();
  const open = activeModal === "profile";
  const user = users.find((u) => u.id === profileUserId);
  if (!user) return null;

  return (
    <Modal open={open} onClose={closeModal} width="max-w-sm">
      <div className="flex flex-col items-center px-6 pb-2 pt-8">
        <Avatar name={user.displayName} id={user.id} size="xl" online={user.online} />
        <h2 className="mt-4 text-xl font-medium text-text-primary">{user.displayName}</h2>
        <p className="text-sm text-text-secondary">{user.online ? "online" : lastSeenLabel(user.lastSeen)}</p>
      </div>
      <div className="px-6 py-3 text-sm">
        <div className="border-t py-3">
          <div className="text-xs text-text-secondary">Phone</div>
          <div className="text-text-primary">{user.phone}</div>
        </div>
        <div className="border-t py-3">
          <div className="text-xs text-text-secondary">Username</div>
          <div className="text-text-primary">@{user.username}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 px-6 pb-4">
        <button onClick={() => { createDirect(user.id); closeModal(); }} className="flex flex-col items-center gap-1 rounded-lg bg-secondary py-3 text-xs text-signal-blue">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>
          Message
        </button>
        <button onClick={() => toast("Voice calls coming soon")} className="flex flex-col items-center gap-1 rounded-lg bg-secondary py-3 text-xs text-signal-blue">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
          Voice
        </button>
        <button onClick={() => toast("Video calls coming soon")} className="flex flex-col items-center gap-1 rounded-lg bg-secondary py-3 text-xs text-signal-blue">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          Video
        </button>
      </div>
      <div className="border-t px-6 py-3">
        <button onClick={() => toast("User blocked")} className="text-sm font-medium text-destructive">Block user</button>
      </div>
    </Modal>
  );
}
