let ws: WebSocket | null = null;
const listeners: Map<string, Set<(data: unknown) => void>> = new Map();

export function connectWS(convId: number, userId: number) {
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000";
  // Close any existing connection first
  if (ws) {
    ws.onmessage = null;
    ws.close();
  }
  ws = new WebSocket(`${WS_URL}/ws/${convId}/${userId}`);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      listeners.get(data.type)?.forEach((fn) => fn(data));
    } catch {
      // ignore malformed messages
    }
  };
}

export function disconnectWS() {
  ws?.close();
  ws = null;
}

export function sendWSEvent(type: string, payload: object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type, ...payload }));
  }
}

export function onWSEvent(type: string, fn: (data: unknown) => void) {
  if (!listeners.has(type)) listeners.set(type, new Set());
  listeners.get(type)!.add(fn);
  return () => listeners.get(type)?.delete(fn);
}

export function clearWSListeners() {
  listeners.clear();
}
