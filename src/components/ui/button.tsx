import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Botones dpm: radius 6px, 8px de alto base (h-8), semibold, borde blanco 10%,
 * tinte de primary al 4–12%. El "primary" sólido es el CTA (color de marca).
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-semibold transition-colors outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "border border-primary/20 bg-primary/12 text-primary hover:border-primary/40 hover:bg-primary/20",
        solid:
          "bg-primary text-bg shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] hover:bg-primary/90",
        secondary:
          "border border-white/10 bg-soft/60 text-fg hover:border-white/20 hover:bg-soft",
        ghost: "text-muted hover:bg-soft/70 hover:text-fg",
        destructive:
          "border border-loss/25 bg-loss/12 text-loss hover:border-loss/45 hover:bg-loss/20",
      },
      size: {
        xs: "h-7 px-2 text-[11px]",
        sm: "h-8 px-3",
        md: "h-9 px-3.5",
        lg: "h-11 px-5 text-sm",
      },
    },
    defaultVariants: { variant: "solid", size: "md" },
  },
);

export type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
