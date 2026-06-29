import { useState } from "react";
import type { Message } from "../lib/types";
import { StatusTick } from "./StatusTick";
import { clockTime, isEmojiOnly, colorForId } from "../lib/format";
import { useUiStore } from "../stores/uiStore";
import { useMessageStore } from "../stores/messageStore";

interface Props {
  message: Message;
  isSent: boolean;
  showSender: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isSent, showSender, senderName }: Props) {
  const [hover, setHover] = useState(false);
  const toast = useUiStore((s) => s.toast);
  const deleteMessage = useMessageStore((s) => s.deleteMessage);

  if (message.system) {
    return (
      <div className="my-2 flex justify-center">
        <span className="rounded-md bg-black/5 px-3 py-1 text-xs text-text-secondary">
          {message.content}
        </span>
      </div>
    );
  }

  const emoji = isEmojiOnly(message.content);

  const copy = () => {
    navigator.clipboard?.writeText(message.content);
    toast("Copied to clipboard");
  };

  return (
    <div
      className={`group flex animate-msg-in px-1 ${isSent ? "justify-end" : "justify-start"}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className={`relative flex max-w-[68%] items-center gap-1 ${isSent ? "flex-row" : "flex-row-reverse"}`}>
        {hover && (
          <div className="flex shrink-0 gap-1">
            <button onClick={() => toast("Reactions coming soon")} title="React" className="rounded-full p-1 text-text-secondary hover:bg-black/5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-3.5 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM12 17.5c-2.3 0-4.3-1.3-5.2-3.2h10.4c-.9 1.9-2.9 3.2-5.2 3.2z"/></svg>
            </button>
            <button onClick={() => toast("Reply coming soon")} title="Reply" className="rounded-full p-1 text-text-secondary hover:bg-black/5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></svg>
            </button>
            {isSent && (
              <button onClick={() => deleteMessage(message.conversationId, message.id)} title="Delete" className="rounded-full p-1 text-text-secondary hover:bg-black/5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
              </button>
            )}
            <button onClick={copy} title="Copy" className="rounded-full p-1 text-text-secondary hover:bg-black/5">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
            </button>
          </div>
        )}
        <div
          className={`relative rounded-2xl px-2.5 pb-1.5 pt-1.5 shadow-sm ${
            isSent
              ? "rounded-br-sm bg-sent-bubble"
              : "rounded-bl-sm bg-recv-bubble"
          } ${emoji ? "bg-transparent shadow-none" : ""}`}
        >
          {showSender && !isSent && (
            <div className="mb-0.5 text-xs font-semibold" style={{ color: colorForId(message.senderId) }}>
              {senderName}
            </div>
          )}
          <div className={`whitespace-pre-wrap break-words text-text-primary ${emoji ? "text-4xl leading-tight" : "text-[15px]"}`}>
            {message.content}
          </div>
          <div className={`mt-0.5 flex items-center justify-end gap-1 ${emoji ? "" : "-mb-0.5"}`}>
            <span className="text-[11px] text-text-secondary">{clockTime(message.createdAt)}</span>
            {isSent && <StatusTick status={message.status} />}
          </div>
        </div>
      </div>
    </div>
  );
}
