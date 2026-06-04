import { useState } from "react";
import { CaretRight } from "@phosphor-icons/react";

/** A collapsible section (used by "Advanced settings"). */
export function SectionHelp({
  title,
  hint,
  children,
  defaultOpen = false,
}: { title: string; hint?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mt-2 border-t border-border pt-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 text-[11.5px] text-muted-foreground hover:text-foreground"
      >
        <CaretRight className={cnRotate(open)} />
        <span className="font-medium">{title}</span>
        {hint ? <span className="text-muted-foreground/70">{hint}</span> : null}
      </button>
      {open ? <div className="mt-2">{children}</div> : null}
    </div>
  );
}

function cnRotate(open: boolean) {
  return open ? "size-3.5 rotate-90 transition-transform" : "size-3.5 transition-transform";
}
