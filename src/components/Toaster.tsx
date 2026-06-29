import { useUiStore } from "../stores/uiStore";

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);
  return (
    <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-toast-in rounded-lg bg-text-primary px-4 py-2.5 text-sm text-white shadow-lg"
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
