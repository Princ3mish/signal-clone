import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
import { useConversationStore } from "../stores/conversationStore";
import { useUiStore } from "../stores/uiStore";
import { CURRENT_USER_ID } from "../lib/mock-data";

export function GroupInfoModal() {
  const activeModal = useUiStore((s) => s.activeModal);
  const modalPayload = useUiStore((s) => s.modalPayload);
  const closeModal = useUiStore((s) => s.closeModal);
  const toast = useUiStore((s) => s.toast);
  const { conversations, users, removeMember, setActive, deleteConversation } = useConversationStore();
  const open = activeModal === "groupInfo";
  const conv = conversations.find((c) => c.id === modalPayload);
  if (!conv || conv.type !== "group") return null;

  const isAdmin = conv.adminIds?.includes(CURRENT_USER_ID);
  const members = conv.memberIds.map((id) => users.find((u) => u.id === id)!).filter(Boolean);

  return (
    <Modal open={open} onClose={closeModal}>
      <div className="flex flex-col items-center px-6 pb-2 pt-8">
        <Avatar name={conv.name || "Group"} id={conv.id} src={conv.avatar} isGroup size="xl" />
        <h2 className="mt-4 text-xl font-medium text-text-primary">{conv.name}</h2>
        <p className="text-sm text-text-secondary">{conv.memberIds.length} members</p>
        {conv.description && <p className="mt-2 text-center text-sm text-text-secondary">{conv.description}</p>}
      </div>

      <div className="flex items-center justify-between border-t px-6 py-3 text-sm">
        <span className="text-text-primary">Disappearing messages</span>
        <button onClick={() => toast("Disappearing messages coming soon")} className="h-5 w-9 rounded-full bg-border p-0.5">
          <span className="block h-4 w-4 rounded-full bg-white shadow" />
        </button>
      </div>

      <div className="border-t px-6 py-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium uppercase text-text-secondary">{members.length} members</span>
          {isAdmin && <button onClick={() => toast("Add members coming soon")} className="text-sm text-signal-blue">Add</button>}
        </div>
        <div className="max-h-52 overflow-y-auto">
          {members.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2">
              <Avatar name={u.displayName} id={u.id} online={u.online} />
              <div className="flex-1">
                <div className="font-medium text-text-primary">{u.id === CURRENT_USER_ID ? "You" : u.displayName}</div>
                <div className="text-xs text-text-secondary">{u.phone}</div>
              </div>
              {conv.adminIds?.includes(u.id) && <span className="text-xs text-signal-blue">Admin</span>}
              {isAdmin && u.id !== CURRENT_USER_ID && (
                <button onClick={() => removeMember(conv.id, u.id)} className="text-xs text-destructive">Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between border-t px-6 py-3 text-sm">
        <button onClick={() => toast("Media gallery coming soon")} className="text-signal-blue">Media & files</button>
        <button onClick={() => { deleteConversation(conv.id); setActive(null); closeModal(); toast("You left the group"); }} className="font-medium text-destructive">Exit group</button>
      </div>
    </Modal>
  );
}
