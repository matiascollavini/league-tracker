import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Inputs dpm: fondo #0d0f10, borde blanco 15%, texto 13px semibold. */
export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-md border border-white/10 bg-shade px-3 text-[13px] font-medium text-fg",
        "placeholder:font-normal placeholder:text-dim",
        "transition-colors hover:border-white/20 focus-visible:border-primary/60 focus-visible:outline-none",
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
        "h-10 w-full appearance-none rounded-md border border-white/10 bg-shade px-2.5 text-[13px] font-semibold text-fg",
        "transition-colors hover:border-white/20 focus-visible:border-primary/60 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
