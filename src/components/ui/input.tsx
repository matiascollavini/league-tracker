import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-12 w-full rounded-lg border border-line bg-ink-900 px-4 text-base text-gold-200",
        "placeholder:text-muted/70 focus-visible:border-gold-600 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-gold-500/25",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-12 w-full appearance-none rounded-lg border border-line bg-ink-900 px-3 text-sm text-gold-200",
        "focus-visible:border-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/25",
        className,
      )}
      {...props}
    />
  );
}
