import type { MsgStatus } from "../lib/types";

export function StatusTick({ status }: { status: MsgStatus }) {
  if (status === "sending") {
    return (
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-text-secondary">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path d="M8 5v3l2 1" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    );
  }
  const blue = status === "read";
  const color = blue ? "var(--read-blue)" : "var(--text-secondary)";
  if (status === "sent") {
    return (
      <svg viewBox="0 0 18 12" className="h-3.5 w-4" style={{ color }}>
        <path d="M2 6.5l3 3L13 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 22 12" className="h-3.5 w-5" style={{ color }}>
      <path d="M1 6.5l3 3L12 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 9.5L8 8.5M9 6.5L17 -1.5" transform="translate(2,2)" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 6.5l3 3L17 1.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
