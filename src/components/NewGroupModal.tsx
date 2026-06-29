import { useState } from "react";
import { Modal } from "./Modal";
import { Avatar } from "./Avatar";
import { useConversationStore } from "../stores/conversationStore";
import { useUiStore } from "../stores/uiStore";

export function NewGroupModal() {
  const activeModal = useUiStore((s) => s.activeModal);
  const closeModal = useUiStore((s) => s.closeModal);
  const openModal = useUiStore((s) => s.openModal);
  const toast = useUiStore((s) => s.toast);
  const { users, createGroup } = useConversationStore();
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const open = activeModal === "newGroup";

  const reset = () => { setName(""); setQ(""); setSelected([]); };
  const list = users.filter((u) => u.id !== 1).filter((u) => u.displayName.toLowerCase().includes(q.toLowerCase()));

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const create = () => {
    if (!name.trim()) { toast("Enter a group name"); return; }
    if (selected.length === 0) { toast("Select at least one member"); return; }
    createGroup(name.trim(), selected);
    toast("Group created");
    reset();
    closeModal();
  };

  return (
    <Modal open={open} onClose={() => { reset(); closeModal(); }}>
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <button onClick={() => openModal("newChat")} className="rounded-full p-1 hover:bg-secondary">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-text-primary"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"/></svg>
        </button>
        <h2 className="text-lg font-medium text-text-primary">New group</h2>
      </div>
      <div className="p-4">
        <div className="mb-4 flex items-center gap-3">
          <button onClick={() => toast("Avatar upload coming soon")} className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-text-secondary">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current"><path d="M9 2L7.17 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10z"/></svg>
          </button>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name"
            className="flex-1 border-b border-border bg-transparent px-1 py-2 outline-none focus:border-signal-blue"
          />
        </div>

        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {selected.map((id) => {
              const u = users.find((x) => x.id === id)!;
              return (
                <span key={id} className="flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs">
                  {u.displayName}
                  <button onClick={() => toggle(id)} className="text-text-secondary">✕</button>
                </span>
              );
            })}
          </div>
        )}

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search members"
          className="mb-2 w-full rounded-lg bg-secondary px-3 py-2 text-sm outline-none"
        />
        <div className="max-h-56 overflow-y-auto">
          {list.map((u) => (
            <label key={u.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-secondary">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} className="h-4 w-4 accent-[#3a76f0]" />
              <Avatar name={u.displayName} id={u.id} online={u.online} />
              <span className="font-medium text-text-primary">{u.displayName}</span>
            </label>
          ))}
        </div>
        <button onClick={create} className="mt-4 w-full rounded-lg bg-signal-blue py-2.5 font-medium text-white">
          Create group
        </button>
      </div>
    </Modal>
  );
}
