import { Info } from "@phosphor-icons/react";

/** One-line muted helper under an input. */
export function HelpText({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1 flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
      <Info weight="fill" className="mt-px size-3 shrink-0 text-primary" />
      <span>{children}</span>
    </p>
  );
}
