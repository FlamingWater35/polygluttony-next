import { useEffect, useRef, useState } from "react"
import { useGlossaryRun } from "@/stores/glossary-store"
import { useAppStore } from "@/stores/app-store"
import { ReactorBar } from "@/features/translate/reactor-bar"
import type { GlossaryPhase } from "@/types/generated/GlossaryPhase"

/** The six real glossary categories (engine: src-tauri/.../glossary/model.rs). */
const CATS: { key: string; label: string }[] = [
  { key: "characters", label: "Characters" },
  { key: "cultivation", label: "Cultivation" },
  { key: "skills", label: "Skills" },
  { key: "locations", label: "Locations" },
  { key: "items", label: "Items" },
  { key: "organizations", label: "Organizations" },
]

const PHASE_LABEL: Record<GlossaryPhase, string> = {
  loading: "Reading subtitles",
  reference: "Gathering reference terms",
  extracting: "Extracting terms",
  normalizing: "Standardizing",
  personalizing: "Looking up established names",
  saving: "Saving glossary",
}

/**
 * Live glossary-build console. Terms stream into their six category lanes as
 * extraction batches land (no fake per-lane bars, no unknown "total" — the count
 * is a running tally; the only progress bar tracks *batches scanned*, which is
 * knowable).
 */
export function ExtractionConsole() {
  const phase = useGlossaryRun((s) => s.phase)
  const done = useGlossaryRun((s) => s.done)
  const total = useGlossaryRun((s) => s.total)
  const terms = useGlossaryRun((s) => s.glossTerms)
  const count = useGlossaryRun((s) => s.glossTermCount)
  const worldType = useAppStore((s) => s.worldType)

  // Flash the lanes a batch just touched (compare per-category counts).
  const prev = useRef<Record<string, number>>({})
  const [flash, setFlash] = useState<Set<string>>(new Set())
  useEffect(() => {
    const grew = new Set<string>()
    for (const { key } of CATS) {
      const n = terms[key]?.length ?? 0
      if (n > (prev.current[key] ?? 0)) grew.add(key)
      prev.current[key] = n
    }
    if (grew.size === 0) return
    setFlash(grew)
    const t = setTimeout(() => setFlash(new Set()), 520)
    return () => clearTimeout(t)
  }, [count, terms])

  const status =
    phase === "extracting" && total > 0
      ? `Extracting · batch ${done}/${total}`
      : phase
        ? PHASE_LABEL[phase]
        : "Starting…"

  return (
    <div className="flex flex-col gap-5">
      {/* world type + running tally */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-dim)]">World type</span>
          {worldType ? (
            <span
              className="text-[22px] font-bold uppercase tracking-[0.04em] text-[color:var(--color-gold-hi)]"
              style={{ textShadow: "0 0 18px color-mix(in oklch, var(--color-gold) 55%, transparent)" }}
            >
              {worldType}
            </span>
          ) : (
            <span className="text-[13px] text-muted-foreground">detecting…</span>
          )}
        </div>
        <div className="text-right">
          <div className="text-[30px] font-bold leading-none text-[color:var(--color-ink-emphasis)] tabular-nums">
            {count}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--color-ink-dim)]">
            terms found so far
          </div>
        </div>
      </div>

      {/* category lanes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {CATS.map(({ key, label }) => {
          const list = terms[key] ?? []
          return (
            <div
              key={key}
              className={`min-h-[104px] rounded-xl border p-3 transition-[border-color,box-shadow] duration-300 ${
                flash.has(key)
                  ? "border-[color:color-mix(in_oklch,var(--color-gold)_40%,transparent)] [box-shadow:0_0_0_1px_color-mix(in_oklch,var(--color-gold)_18%,transparent)]"
                  : "border-border"
              } bg-black/15`}
            >
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold tracking-[0.04em] text-foreground">{label}</span>
                <span className="text-[13px] font-bold tabular-nums text-[color:var(--color-gold-hi)]">{list.length}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {list.map((t) => (
                  <span
                    key={t.source}
                    title={`${t.source} → ${t.target}`}
                    className="rounded-full border border-[color:var(--input)] bg-[color:color-mix(in_oklch,var(--color-gold)_5%,transparent)] px-2 py-0.5 text-[10.5px] text-foreground [animation:gloss-pop_.42s_cubic-bezier(.16,1.5,.4,1)]"
                  >
                    {t.target || t.source}
                  </span>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* batch reactor (honest: progress = batches scanned) */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-muted-foreground tabular-nums">
          <span>{status}</span>
          {phase === "extracting" && total > 0 ? <span>{Math.round((done / total) * 100)}%</span> : null}
        </div>
        <ReactorBar done={done} total={total} />
      </div>
    </div>
  )
}
