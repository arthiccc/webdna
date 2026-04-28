import { tv, type VariantProps } from "tailwind-variants";

export const badgeVariants = tv({
  base: "inline-flex items-center cursor-default gap-1.5 font-medium rounded-none border transition-colors hover:text-[var(--whois-text)] ease-in-out",
  variants: {
    variant: {
      default:
        "bg-[var(--whois-surface-2)] text-[var(--whois-text)] border-[var(--whois-border)]",
      primary:
        "bg-[var(--whois-accent)] text-[var(--whois-accent-text)] border-[var(--whois-accent)]",
      secondary:
        "bg-[var(--whois-surface-2)] text-[var(--whois-text-muted)] border-[var(--whois-border)]",
      success:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100 dark:border-green-800",
      warning:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900 dark:text-amber-100 dark:border-amber-800",
      danger:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900 dark:text-red-100 dark:border-red-800",
      outline:
        "bg-transparent border border-[var(--whois-border)] text-[var(--whois-text-muted)]",
    },
    size: {
      sm: "text-[10px] px-2 py-0.5",
      md: "text-xs px-2.5 py-0.5",
      lg: "text-sm px-3 py-1",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
  },
});

export type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];
export type BadgeSize = VariantProps<typeof badgeVariants>["size"];