import { colorForId, initials } from "../lib/format";

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

const DOT = {
  sm: "h-2.5 w-2.5",
  md: "h-3 w-3",
  lg: "h-3.5 w-3.5",
  xl: "h-5 w-5",
} as const;

interface Props {
  name: string;
  id: number;
  src?: string;
  size?: keyof typeof SIZES;
  online?: boolean;
  isGroup?: boolean;
}

export function Avatar({ name, id, src, size = "md", online, isGroup }: Props) {
  return (
    <div className="relative shrink-0">
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${SIZES[size]} rounded-full object-cover`}
        />
      ) : (
        <div
          className={`${SIZES[size]} flex items-center justify-center rounded-full font-medium text-white`}
          style={{ backgroundColor: isGroup ? "#6b7280" : colorForId(id) }}
        >
          {isGroup ? (
            <svg viewBox="0 0 24 24" className="h-1/2 w-1/2 fill-white">
              <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
            </svg>
          ) : (
            initials(name)
          )}
        </div>
      )}
      {online && (
        <span
          className={`${DOT[size]} absolute bottom-0 right-0 rounded-full border-2 border-white`}
          style={{ backgroundColor: "var(--online)" }}
        />
      )}
    </div>
  );
}
