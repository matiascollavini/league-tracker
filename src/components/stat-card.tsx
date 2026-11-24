import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string;
  hint?: string;
  accent?: "gold" | "win" | "loss" | "neutral" | "blue";
};

const ACCENT: Record<NonNullable<Props["accent"]>, string> = {
  gold: "text-gold",
  win: "text-win",
  loss: "text-loss",
  blue: "text-blue",
  neutral: "text-fg",
};

/** KPI con la tipografía de dpm: label de 10px, número grande, hint muted. */
export function StatCard({ label, value, hint, accent = "neutral" }: Props) {
  return (
    <div className="min-w-0 bg-card px-4 py-3">
      <p className="label truncate">{label}</p>
      <p
        className={cn(
          "tabular mt-1 truncate text-[20px] font-extrabold leading-tight tracking-tight",
          ACCENT[accent],
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[11px] font-medium text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
