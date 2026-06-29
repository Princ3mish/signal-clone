const AVATAR_COLORS = [
  "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
  "#2196f3", "#009688", "#4caf50", "#ff9800", "#795548",
];

export function colorForId(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (diff < min) return "just now";
  if (diff < hr) return Math.floor(diff / min) + "m";
  if (diff < day) {
    return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return new Date(iso).toLocaleDateString([], { weekday: "short" });
  return new Date(iso).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function dateSeparatorLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date();
  yest.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "TODAY";
  if (sameDay(d, yest)) return "YESTERDAY";
  return d.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

export function lastSeenLabel(iso?: string): string {
  if (!iso) return "offline";
  const d = new Date(iso);
  const t = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return `last seen today at ${t}`;
  return `last seen ${d.toLocaleDateString([], { month: "short", day: "numeric" })} at ${t}`;
}

const EMOJI_RE = /^(\p{Emoji_Presentation}|\p{Extended_Pictographic}|\s)+$/u;
export function isEmojiOnly(text: string): boolean {
  const t = text.trim();
  if (!t) return false;
  return EMOJI_RE.test(t) && [...t.replace(/\s/g, "")].length <= 6;
}
