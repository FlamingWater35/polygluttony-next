const STATE_COLOR: Record<string, string> = {
  idle: "var(--muted-foreground)",
  pending: "var(--muted-foreground)",
  translating: "var(--primary)",
  retranslating: "var(--color-alert)",
  cleanup: "var(--color-state-cleanup)",
  verifying: "var(--color-state-verify)",
  done: "var(--color-success)",
  warning: "var(--color-alert)",
  failed: "var(--color-danger)",
};

export function StateChip({ state = "idle", label }: { state?: string; label?: string }) {
  const color = STATE_COLOR[state] ?? STATE_COLOR.idle;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[13px] border border-border px-2.5 py-0.5 text-[11px]">
      <span className="size-2 rounded-full" style={{ background: color }} />
      {label ?? state[0].toUpperCase() + state.slice(1)}
    </span>
  );
}
