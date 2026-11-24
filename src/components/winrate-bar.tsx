import { cn } from "@/lib/utils";

/**
 * Barra de winrate fina, con el color de texto que usa dpm para el WR:
 * dorado arriba de 50%, naranja abajo. Sin JS: server component puro.
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
  const ratio = Math.min(1, Math.max(0, value));
  const good = ratio >= 0.5;

  return (
    <span
      role="img"
      aria-label={`${Math.round(ratio * 100)}% de victorias`}
      className={cn(
        "block w-full overflow-hidden rounded-full bg-soft",
        size === "sm" ? "h-1" : "h-1.5",
        className,
      )}
    >
      <span
        className={cn(
          "block h-full rounded-full",
          good ? "bg-gold" : "bg-orange",
        )}
        style={{ width: `${Math.max(2, Math.round(ratio * 100))}%` }}
      />
    </span>
  );
}
