import { cn } from "@/lib/utils";

type Variant = "muted" | "alert" | "danger" | "success" | "accent";

const VARIANT: Record<Variant, string> = {
  muted: "text-muted-foreground border-border",
  alert: "text-[color:var(--color-alert)] border-[color:var(--color-alert)]/40",
  danger: "text-[color:var(--color-danger)] border-[color:var(--color-danger)]/40",
  success: "text-[color:var(--color-success)] border-[color:var(--color-success)]/40",
  accent: "text-primary border-primary/40",
};

export function StatusChip({
  variant = "muted",
  children,
  className,
  ...rest
}: { variant?: Variant; children: React.ReactNode } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[13px] border px-2.5 py-0.5 text-[11px] tabular-nums",
        VARIANT[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
