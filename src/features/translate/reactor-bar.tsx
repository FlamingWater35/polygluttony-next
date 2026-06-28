export function ReactorBar({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? (done / total) * 100 : 0
  return (
    <div className="relative h-2.5 overflow-hidden rounded-full bg-white/5 [box-shadow:inset_0_0_0_1px_rgba(225,166,54,.12)]">
      <div
        className="absolute inset-y-0 left-0 rounded-full signal-bloom [background:linear-gradient(90deg,var(--color-gold-deep)_0%,var(--color-gold)_55%,var(--color-gold-hi)_100%)] transition-[width] duration-500 [transition-timing-function:cubic-bezier(.16,1,.3,1)]"
        style={{ width: `${pct}%` }}
      >
        <div className="absolute inset-0 [background:repeating-linear-gradient(115deg,transparent_0_10px,rgba(255,255,255,.18)_10px_12px)] [animation:sig-flow_1.1s_linear_infinite]" />
      </div>
      <div className="pointer-events-none absolute inset-0 flex">
        {Array.from({ length: Math.max(total, 1) }, (_, i) => (
          <span key={i} className="flex-1 border-r border-black/50 last:border-0" />
        ))}
      </div>
    </div>
  )
}
