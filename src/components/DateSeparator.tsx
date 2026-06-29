export function DateSeparator({ label }: { label: string }) {
  return (
    <div className="my-3 flex justify-center">
      <span className="rounded-md bg-white/80 px-3 py-1 text-xs font-medium uppercase text-text-secondary shadow-sm">
        {label}
      </span>
    </div>
  );
}
