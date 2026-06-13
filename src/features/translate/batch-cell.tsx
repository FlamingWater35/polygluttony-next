import { useEffect, useRef, useState } from "react"
import type { BatchState } from "./telemetry"

const META: Record<BatchState, { border: string; fill: string; label: string }> = {
  queued:      { border: "border-border", fill: "", label: "queued" },
  "in-flight": { border: "border-[color:color-mix(in_oklch,var(--color-gold)_38%,transparent)]", fill: "shimmer-gold", label: "awaiting model" },
  landing:     { border: "border-[color:color-mix(in_oklch,var(--color-gold)_38%,transparent)]", fill: "shimmer-gold", label: "checking markers…" },
  done:        { border: "border-[color:color-mix(in_oklch,var(--color-jade)_32%,transparent)]", fill: "fill-jade", label: "landed · markers ✓" },
  retrans:     { border: "border-[color:color-mix(in_oklch,var(--color-amber)_42%,transparent)]", fill: "shimmer-amber", label: "drift caught → retranslating" },
}

export function BatchCell({ index, range, state }: { index: number; range: string; state: BatchState }) {
  const [secs, setSecs] = useState(0)
  const prev = useRef(state)
  const [sweeping, setSweeping] = useState(false)

  useEffect(() => {
    if (state !== "in-flight") { setSecs(0); return }
    const t = setInterval(() => setSecs((s) => s + 0.1), 100)
    return () => clearInterval(t)
  }, [state])

  useEffect(() => {
    const wasInFlight = prev.current === "in-flight"
    prev.current = state
    if (wasInFlight && state === "done") {
      setSweeping(true)
      const t = setTimeout(() => setSweeping(false), 620)
      return () => clearTimeout(t)
    }
  }, [state])

  const m = META[state]
  const status = state === "in-flight" ? `awaiting model · ${secs.toFixed(1)}s` : m.label

  return (
    <div className={`relative grid grid-cols-[84px_1fr_150px] items-center gap-3.5 overflow-hidden rounded-lg border ${m.border} bg-[color:var(--color-raised)] px-3.5 py-2.5 ${state === "queued" ? "opacity-50" : ""}`}>
      <div className="text-[10.5px] font-bold tracking-[0.08em] text-muted-foreground">
        BATCH {index + 1}<span className="mt-0.5 block text-[9.5px] font-medium tracking-normal text-[color:var(--color-ink-dim)]">{range}</span>
      </div>
      <div className="relative h-[9px] overflow-hidden rounded-full bg-white/5">
        <Meter fill={m.fill} />
      </div>
      <div className="text-right text-[11px] tabular-nums text-muted-foreground">{status}</div>
      {sweeping && <div className="pointer-events-none absolute inset-0 [background:linear-gradient(90deg,transparent,rgba(255,255,255,.45),transparent)] [animation:sig-sweep_.62s_ease-out_1]" />}
    </div>
  )
}

function Meter({ fill }: { fill: string }) {
  if (fill === "fill-jade") return <i className="absolute inset-0 rounded-full [background:linear-gradient(90deg,#6fae74,var(--color-jade))] signal-bloom" />
  if (fill === "shimmer-gold") return <i className="absolute inset-0 rounded-full [background:linear-gradient(90deg,transparent,var(--color-gold-deep),var(--color-gold),var(--color-gold-deep),transparent)] [background-size:220%_100%] [animation:sig-shimmer_1.4s_linear_infinite]" />
  if (fill === "shimmer-amber") return <i className="absolute inset-0 rounded-full [background:linear-gradient(90deg,transparent,var(--color-amber),transparent)] [background-size:220%_100%] [animation:sig-shimmer_1s_linear_infinite]" />
  return null
}
