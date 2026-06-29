import { Avatar } from "./Avatar";

export function TypingIndicator({ name, id }: { name: string; id: number }) {
  return (
    <div className="flex items-end gap-2 px-2 py-1 animate-msg-in">
      <Avatar name={name} id={id} size="sm" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md bg-recv-bubble px-3 py-3 shadow-sm">
        <span className="h-2 w-2 rounded-full bg-text-secondary animate-bounce-dot" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-text-secondary animate-bounce-dot" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 rounded-full bg-text-secondary animate-bounce-dot" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
