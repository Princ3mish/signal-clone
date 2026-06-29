import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "../components/Avatar";
import { Toaster } from "../components/Toaster";
import { useAuthStore } from "../stores/authStore";
import { useUiStore } from "../stores/uiStore";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Signal" }] }),
  component: Settings,
});

const SECTIONS = ["Profile", "Account", "Privacy", "Notifications", "Chats", "Storage", "Help"] as const;

function Settings() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const logout = useAuthStore((s) => s.logout);
  const toast = useUiStore((s) => s.toast);
  const [section, setSection] = useState<(typeof SECTIONS)[number]>("Profile");
  const [name, setName] = useState(currentUser?.displayName || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");

  useEffect(() => {
    if (!currentUser) navigate({ to: "/login" });
  }, [currentUser, navigate]);
  if (!currentUser) return null;

  return (
    <div className="flex h-screen w-full bg-white">
      <div className="flex w-full flex-col border-r md:w-[360px] md:shrink-0">
        <div className="flex items-center gap-3 bg-header-bg px-4 py-3">
          <Link to="/" className="rounded-full p-1 hover:bg-black/5">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-text-primary"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"/></svg>
          </Link>
          <h1 className="text-lg font-bold text-text-primary">Settings</h1>
        </div>
        <div className="flex items-center gap-3 border-b px-4 py-4">
          <Avatar name={currentUser.displayName} id={currentUser.id} size="lg" online />
          <div>
            <div className="font-medium text-text-primary">{currentUser.displayName}</div>
            <div className="text-sm text-text-secondary">{currentUser.phone}</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`block w-full px-5 py-3 text-left text-sm hover:bg-secondary ${section === s ? "bg-secondary font-medium text-signal-blue" : "text-text-primary"}`}
            >
              {s}
            </button>
          ))}
          <button onClick={() => { logout(); navigate({ to: "/login" }); }} className="block w-full px-5 py-3 text-left text-sm text-destructive hover:bg-secondary">
            Log out
          </button>
        </nav>
      </div>

      <div className="hidden flex-1 flex-col bg-secondary md:flex">
        <div className="flex items-center bg-header-bg px-6 py-3">
          <h2 className="text-lg font-medium text-text-primary">{section}</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-8">
          {section === "Profile" ? (
            <div className="max-w-md space-y-4 rounded-xl bg-white p-6 shadow-sm">
              <div className="flex justify-center">
                <Avatar name={name || currentUser.displayName} id={currentUser.id} size="xl" />
              </div>
              <label className="block text-sm">
                <span className="text-text-secondary">Display name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-signal-blue" />
              </label>
              <label className="block text-sm">
                <span className="text-text-secondary">Phone</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 outline-none focus:border-signal-blue" />
              </label>
              <button
                onClick={() => { updateProfile({ displayName: name, phone }); toast("Profile updated"); }}
                className="w-full rounded-lg bg-signal-blue py-2.5 font-medium text-white"
              >
                Save changes
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-white p-10 text-center shadow-sm">
              <p className="text-text-secondary">{section} settings — Coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
