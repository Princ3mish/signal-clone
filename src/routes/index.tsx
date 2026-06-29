import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatView } from "../components/ChatView";
import { ModalHost } from "../components/ModalHost";
import { Toaster } from "../components/Toaster";
import { useAuthStore } from "../stores/authStore";
import { useConversationStore } from "../stores/conversationStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Signal — Private Messenger" },
      { name: "description", content: "A fast, simple and secure messenger. Real-time chats, groups and contacts." },
      { property: "og:title", content: "Signal — Private Messenger" },
      { property: "og:description", content: "A fast, simple and secure messenger." },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.currentUser);
  const activeConversationId = useConversationStore((s) => s.activeConversationId);
  const setActive = useConversationStore((s) => s.setActive);
  const fetchConversations = useConversationStore((s) => s.fetchConversations);
  const fetchUsers = useConversationStore((s) => s.fetchUsers);

  useEffect(() => {
    if (!currentUser) {
      navigate({ to: "/login" });
    } else {
      fetchConversations();
      fetchUsers();
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      {/* Sidebar: hidden on mobile when a chat is open */}
      <div className={`${activeConversationId ? "hidden md:flex" : "flex"} h-full`}>
        <Sidebar />
      </div>
      {/* Chat pane: hidden on mobile when no chat open */}
      <div className={`${activeConversationId ? "flex" : "hidden md:flex"} h-full flex-1`}>
        <ChatView onBack={() => setActive(null)} />
      </div>
      <ModalHost />
      <Toaster />
    </div>
  );
}
