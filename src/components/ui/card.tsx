import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/** Tarjeta dpm: radius 6px, fondo #1b1d22, borde blanco 5%, sombra interna. */
export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("panel", className)} {...props} />;
}

export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-2 border-b border-line/70 px-4 py-2.5",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return <h2 className={cn("section-title", className)} {...props} />;
}

export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("p-3", className)} {...props} />;
}
