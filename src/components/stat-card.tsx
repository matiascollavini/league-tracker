import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  accent?: "gold" | "win" | "loss" | "neutral";
};

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  gold: "text-gold-300",
  win: "text-win",
  loss: "text-loss",
  neutral: "text-gold-200",
};

export function StatCard({ label, value, hint, accent = "neutral" }: Props) {
  return (
    <div className="rounded-xl border border-line bg-ink-900/80 p-4">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-2xl font-semibold tabular",
          ACCENT[accent],
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 truncate text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
