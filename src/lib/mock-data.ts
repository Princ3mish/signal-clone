import type { User, Conversation, Message } from "./types";

const now = Date.now();
const min = 60 * 1000;
const hr = 60 * min;
const day = 24 * hr;
const iso = (ms: number) => new Date(now - ms).toISOString();

// id 1 = Alice = the logged-in demo user
export const SEED_USERS: User[] = [
  { id: 1, username: "alice", displayName: "Alice", phone: "+1 202 555 0101", online: true },
  { id: 2, username: "bob", displayName: "Bob", phone: "+1 202 555 0102", online: false, lastSeen: iso(5 * min) },
  { id: 3, username: "charlie", displayName: "Charlie", phone: "+1 202 555 0103", online: true },
  { id: 4, username: "diana", displayName: "Diana", phone: "+1 202 555 0104", online: false, lastSeen: iso(1 * hr) },
];

export const CURRENT_USER_ID = 1;

export const SEED_CONVERSATIONS: Conversation[] = [
  { id: 1, type: "direct", memberIds: [1, 2], unread: 2 },
  { id: 2, type: "direct", memberIds: [1, 3], unread: 0 },
  {
    id: 3,
    type: "group",
    name: "Team Chat",
    description: "Project coordination for the team.",
    memberIds: [1, 2, 3, 4],
    adminIds: [1],
    unread: 5,
  },
  { id: 4, type: "direct", memberIds: [1, 4], unread: 0 },
];

let mid = 0;
const m = (
  conversationId: number,
  senderId: number,
  content: string,
  ms: number,
  status: Message["status"] = "read",
  system = false,
): Message => ({
  id: ++mid,
  conversationId,
  senderId,
  content,
  createdAt: iso(ms),
  status,
  system,
});

export const SEED_MESSAGES: Message[] = [
  // Conv 1: Alice <-> Bob (12)
  m(1, 2, "Hey Alice! How's it going?", 2 * hr),
  m(1, 1, "Pretty good, just busy with work 😅", 2 * hr - 2 * min),
  m(1, 2, "Same here. Did you finish the report?", 2 * hr - 5 * min),
  m(1, 1, "Almost! Just polishing the last section.", 2 * hr - 6 * min),
  m(1, 2, "Nice. Lunch later?", 1 * hr),
  m(1, 1, "Yes please 🙌", 1 * hr - 1 * min),
  m(1, 2, "Cool, 1pm at the usual spot?", 50 * min),
  m(1, 1, "Perfect, see you then", 49 * min),
  m(1, 2, "👍", 30 * min),
  m(1, 1, "Running 5 min late btw", 10 * min, "read"),
  m(1, 2, "No worries, I just got here", 3 * min),
  m(1, 2, "Got us a table by the window 🪟", 2 * min),
  // Conv 2: Alice <-> Charlie (5)
  m(2, 3, "Are we still on for the demo?", 1 * day + 2 * hr),
  m(2, 1, "Yep, slides are ready", 1 * day + 1 * hr),
  m(2, 3, "Awesome, thanks!", 1 * day),
  m(2, 1, "Let me know if you need anything", 1 * day - 5 * min),
  m(2, 3, "Will do 🙂", 1 * day - 10 * min),
  // Conv 3: Team Chat group (18)
  m(3, 1, "You created this group", 3 * day, "read", true),
  m(3, 1, "Welcome to Team Chat everyone!", 3 * day - 1 * min),
  m(3, 2, "Thanks Alice 🎉", 3 * day - 2 * min),
  m(3, 3, "Excited to be here", 3 * day - 3 * min),
  m(3, 4, "Hi all 👋", 3 * day - 4 * min),
  m(3, 1, "Let's use this for the sprint", 2 * day),
  m(3, 2, "Sounds good. Standup at 10?", 2 * day - 1 * min),
  m(3, 3, "Works for me", 2 * day - 2 * min),
  m(3, 4, "Same", 2 * day - 3 * min),
  m(3, 1, "Great, added to the calendar", 2 * day - 5 * min),
  m(3, 2, "Pushed the new build", 1 * day),
  m(3, 3, "Testing now", 1 * day - 10 * min),
  m(3, 4, "Found a small bug in login", 1 * day - 20 * min),
  m(3, 2, "On it 🔧", 1 * day - 25 * min),
  m(3, 1, "Thanks team!", 5 * hr),
  m(3, 3, "Fix is up for review", 2 * hr),
  m(3, 4, "Approved ✅", 1 * hr),
  m(3, 2, "Merging now", 20 * min),
  // Conv 4: Alice <-> Diana (3)
  m(4, 4, "Happy birthday! 🎂", 7 * day),
  m(4, 1, "Aww thank you Diana! 💕", 7 * day - 30 * min),
  m(4, 4, "We should celebrate soon", 7 * day - 1 * hr),
];
