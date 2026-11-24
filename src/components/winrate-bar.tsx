import { cn } from "@/lib/utils";

/**
 * Barra de winrate segmentada (10 tramos), estilo op.gg.
 * Sin JS: es un server component puro.
 */
export function WinrateBar({
  value,
  className,
  size = "md",
}: {
  /** 0..1 */
  value: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const segments = 10;
  const filled = Math.round(Math.min(1, Math.max(0, value)) * segments);

  return (
    <span
      role="img"
      aria-label={`${Math.round(value * 100)}% de victorias`}
      className={cn("flex gap-0.5", className)}
    >
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          className={cn(
            "flex-1 rounded-[1px]",
            size === "sm" ? "h-1.5" : "h-2",
            index < filled ? "bg-win" : "bg-loss/45",
          )}
        />
      ))}
    </span>
  );
}
