import { useEffect, useRef } from "react";

/** Living gold-ember + star-chart atmosphere. intensity 0=idle, 1=run-live. */
export function AtmosphereBackdrop({ intensity = 0 }: { intensity?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const intensityRef = useRef(intensity);
  intensityRef.current = intensity;

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const x = c.getContext("2d");
    if (!x) return;
    let W = 0, H = 0, DPR = 1, raf = 0;
    const embers = Array.from({ length: 80 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 1.6 + 0.4,
      s: Math.random() * 0.0006 + 0.0002, d: (Math.random() - 0.5) * 0.0003, a: Math.random() * 0.5 + 0.2,
    }));
    const stars = Array.from({ length: 24 }, () => ({
      x: Math.random(), y: Math.random() * 0.5, r: Math.random() * 1.2 + 0.3, a: Math.random() * 0.5 + 0.2,
    }));
    const size = () => {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      W = c.width = window.innerWidth * DPR; H = c.height = window.innerHeight * DPR;
      c.style.width = window.innerWidth + "px"; c.style.height = window.innerHeight + "px";
    };
    size();
    window.addEventListener("resize", size);
    const frame = () => {
      if (document.hidden) { raf = requestAnimationFrame(frame); return; }
      const k = 0.45 + 0.55 * intensityRef.current; // idle dim → live bright
      x.clearRect(0, 0, W, H);
      const g = x.createRadialGradient(W * 0.5, H * 1.15, 0, W * 0.5, H * 1.15, H * 1.1);
      g.addColorStop(0, `rgba(225,166,54,${0.15 * k})`); g.addColorStop(0.4, `rgba(150,95,20,${0.05 * k})`); g.addColorStop(1, "rgba(0,0,0,0)");
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (const s of stars) { x.beginPath(); x.arc(s.x * W, s.y * H, s.r * DPR, 0, 7); x.fillStyle = `rgba(225,200,150,${s.a * 0.45 * k})`; x.fill(); }
      x.strokeStyle = `rgba(225,166,54,${0.05 * k})`; x.lineWidth = DPR * 0.6;
      for (let i = 0; i < stars.length - 1; i += 2) { const a = stars[i], b = stars[i + 1]; x.beginPath(); x.moveTo(a.x * W, a.y * H); x.lineTo(b.x * W, b.y * H); x.stroke(); }
      for (const e of embers) {
        e.y -= e.s * (0.4 + 0.6 * intensityRef.current); e.x += e.d;
        if (e.y < -0.02) { e.y = 1.02; e.x = Math.random(); }
        const px = e.x * W, py = e.y * H, gr = x.createRadialGradient(px, py, 0, px, py, e.r * 6 * DPR);
        gr.addColorStop(0, `rgba(255,210,120,${e.a * k})`); gr.addColorStop(1, "rgba(225,166,54,0)");
        x.fillStyle = gr; x.beginPath(); x.arc(px, py, e.r * 6 * DPR, 0, 7); x.fill();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", size); };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}
