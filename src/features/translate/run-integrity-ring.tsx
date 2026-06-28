export function RunIntegrityRing({ done, total, retranslated }: { done: number; total: number; retranslated: number }) {
  const offset = total > 0 ? 100 - Math.round((done / total) * 100) : 100
  return (
    <div className="flex flex-col items-center justify-center gap-0.5 rounded-xl border border-border p-3">
      <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#2c2316" strokeWidth="9" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-gold)" strokeWidth="9" strokeLinecap="round"
          pathLength={100} strokeDasharray={100} strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 5px color-mix(in oklch, var(--color-gold) 55%, transparent))", transition: "stroke-dashoffset .5s" }} />
      </svg>
      <div className="-mt-[66px] mb-[30px] text-center">
        <span className="text-[21px] font-semibold leading-none text-[color:var(--color-gold-hi)] tabular-nums">{done}</span>
        <span className="text-[10px] text-muted-foreground">/{total}</span>
      </div>
      <div className="text-[9px] uppercase tracking-[0.16em] text-[color:var(--color-ink-dim)]">batches done</div>
      {retranslated > 0 && <div className="text-[10.5px] text-[color:var(--color-amber)] tabular-nums">{retranslated} retranslated</div>}
    </div>
  )
}
