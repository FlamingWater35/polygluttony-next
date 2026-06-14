import { useEffect, useRef, type CSSProperties } from "react"

/**
 * Reactive imperial atmosphere. A deep aurora field that stays calm on idle
 * windows and *ignites* with gold energy sweeps while work runs — so the
 * spectacle is earned by the work, never uniform decoration.
 *
 * `intensity`: 0 = idle (dim, still), 1 = run-live (brighter, streaming).
 */
export function AtmosphereBackdrop({ intensity = 0 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const target = useRef(intensity)
  target.current = intensity

  useEffect(() => {
    const c = ref.current
    if (!c) return
    const x = c.getContext("2d")
    if (!x) return

    let W = 0,
      H = 0,
      DPR = 1,
      raf = 0,
      t = 0,
      m = 0
    const blobs = [
      { x: 0.22, y: 0.78, r: 0.5, h: "225,166,54", ph: 0, sp: 0.00018 },
      { x: 0.78, y: 0.32, r: 0.42, h: "240,181,62", ph: 2, sp: 0.00013 },
      { x: 0.5, y: 1.05, r: 0.7, h: "143,102,31", ph: 4, sp: 0.00009 },
    ]
    const sweeps: { y: number; p: number; v: number; a: number }[] = []

    const size = () => {
      DPR = Math.min(2, window.devicePixelRatio || 1)
      W = c.width = window.innerWidth * DPR
      H = c.height = window.innerHeight * DPR
      c.style.width = window.innerWidth + "px"
      c.style.height = window.innerHeight + "px"
    }
    size()
    window.addEventListener("resize", size)

    const frame = () => {
      if (document.hidden) {
        raf = requestAnimationFrame(frame)
        return
      }
      t++
      m += ((target.current ? 1 : 0) - m) * 0.04
      x.clearRect(0, 0, W, H)

      const base = x.createLinearGradient(0, 0, 0, H)
      base.addColorStop(0, "#0a0805")
      base.addColorStop(1, "#070502")
      x.fillStyle = base
      x.fillRect(0, 0, W, H)

      for (const b of blobs) {
        const drift = 0.03 * (0.3 + m)
        const wob = Math.sin(t * b.sp * 1000 + b.ph) * 0.04
        const cx = (b.x + Math.sin(t * b.sp * 600 + b.ph) * drift) * W
        const cy = (b.y + wob) * H
        const rr = b.r * Math.min(W, H) * (1 + 0.06 * Math.sin(t * 0.01 + b.ph))
        const op = 0.05 + 0.13 * m
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr)
        g.addColorStop(0, `rgba(${b.h},${op})`)
        g.addColorStop(1, `rgba(${b.h},0)`)
        x.fillStyle = g
        x.beginPath()
        x.arc(cx, cy, rr, 0, 7)
        x.fill()
      }

      if (target.current && t % 26 === 0) {
        sweeps.push({ y: Math.random(), p: -0.15, v: 0.006 + Math.random() * 0.004, a: 0.5 + Math.random() * 0.5 })
      }
      for (let i = sweeps.length - 1; i >= 0; i--) {
        const s = sweeps[i]
        s.p += s.v
        const px = s.p * W
        const py = s.y * H
        const g = x.createLinearGradient(px - 220 * DPR, 0, px + 40 * DPR, 0)
        g.addColorStop(0, "rgba(225,166,54,0)")
        g.addColorStop(1, `rgba(255,210,120,${0.5 * s.a * m})`)
        x.strokeStyle = g
        x.lineWidth = 1.4 * DPR
        x.beginPath()
        x.moveTo(px - 220 * DPR, py)
        x.lineTo(px, py)
        x.stroke()
        x.fillStyle = `rgba(255,225,150,${0.7 * s.a * m})`
        x.beginPath()
        x.arc(px, py, 1.7 * DPR, 0, 7)
        x.fill()
        if (s.p > 1.2) sweeps.splice(i, 1)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("resize", size)
    }
  }, [])

  const gridStyle: CSSProperties = {
    opacity: intensity ? 0.16 : 0,
    transition: "opacity 1.2s ease",
    backgroundImage:
      "linear-gradient(color-mix(in oklch, var(--color-gold) 13%, transparent) 1px, transparent 1px)," +
      "linear-gradient(90deg, color-mix(in oklch, var(--color-gold) 13%, transparent) 1px, transparent 1px)",
    backgroundSize: "64px 64px",
    maskImage: "radial-gradient(120% 90% at 50% 120%, #000, transparent 72%)",
    WebkitMaskImage: "radial-gradient(120% 90% at 50% 120%, #000, transparent 72%)",
  }

  return (
    <>
      <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />
      <div aria-hidden className="pointer-events-none fixed inset-0 z-[1]" style={gridStyle} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{ background: "radial-gradient(130% 100% at 50% -5%, transparent 45%, rgba(0,0,0,.6))" }}
      />
    </>
  )
}
