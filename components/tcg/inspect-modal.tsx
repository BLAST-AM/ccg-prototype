'use client'

import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { Move3d, RotateCcw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RARITY_META, SERIES_BY_ID, type CardDef } from '@/lib/tcg/data'
import { CardBack, CardFace, ELEMENT_ICON } from './card-face'

export function InspectModal({ card, count, onClose }: { card: CardDef; count: number; onClose: () => void }) {
  const innerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const rot = useRef({ x: 0, y: 0 })
  const hover = useRef({ x: 0, y: 0 })
  const drag = useRef<{ active: boolean; lastX: number; lastY: number }>({ active: false, lastX: 0, lastY: 0 })
  const quick = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null)
  const meta = RARITY_META[card.rarity]
  const series = SERIES_BY_ID[card.series]
  const Icon = ELEMENT_ICON[card.element]

  useEffect(() => {
    const el = innerRef.current!
    quick.current = {
      x: gsap.quickTo(el, 'rotationX', { duration: 0.45, ease: 'power3.out' }),
      y: gsap.quickTo(el, 'rotationY', { duration: 0.45, ease: 'power3.out' }),
    }
    gsap.fromTo(
      el,
      { scale: 0.6, rotationY: -120, opacity: 0 },
      { scale: 1, rotationY: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.4)' },
    )
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') nudge(0, -20)
      if (e.key === 'ArrowRight') nudge(0, 20)
      if (e.key === 'ArrowUp') nudge(15, 0)
      if (e.key === 'ArrowDown') nudge(-15, 0)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function apply() {
    const el = innerRef.current
    if (!el || !quick.current) return
    const rx = rot.current.x + hover.current.x
    const ry = rot.current.y + hover.current.y
    quick.current.x(rx)
    quick.current.y(ry)
    const sy = Math.sin((ry * Math.PI) / 180)
    const sx = Math.sin((rx * Math.PI) / 180)
    el.style.setProperty('--mx', `${50 + sy * 50}%`)
    el.style.setProperty('--my', `${50 - sx * 50}%`)
    el.style.setProperty('--px', sy.toFixed(3))
    el.style.setProperty('--py', (-sx).toFixed(3))
  }

  function nudge(dx: number, dy: number) {
    rot.current.x = Math.max(-70, Math.min(70, rot.current.x + dx))
    rot.current.y += dy
    apply()
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { active: true, lastX: e.clientX, lastY: e.clientY }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    if (drag.current.active) {
      const dx = e.clientX - drag.current.lastX
      const dy = e.clientY - drag.current.lastY
      drag.current.lastX = e.clientX
      drag.current.lastY = e.clientY
      rot.current.y += dx * 0.55
      rot.current.x = Math.max(-70, Math.min(70, rot.current.x - dy * 0.4))
      hover.current = { x: 0, y: 0 }
    } else if (e.pointerType === 'mouse') {
      const px = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const py = ((e.clientY - rect.top) / rect.height) * 2 - 1
      hover.current = { x: -py * 14, y: px * 18 }
    }
    apply()
  }

  function onPointerUp() {
    drag.current.active = false
  }

  function reset() {
    rot.current = { x: 0, y: 0 }
    hover.current = { x: 0, y: 0 }
    apply()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#05070d]/85 p-4 backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={`Inspecting ${card.name}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(168,85,247,0.25),transparent_60%)]" />
      <Button
        ref={closeRef}
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-white/10 hover:bg-white/20"
        aria-label="Close inspection"
      >
        <X className="size-5" />
      </Button>

      <div className="relative flex w-full max-w-5xl flex-col items-center gap-6 lg:flex-row lg:justify-center lg:gap-14">
        <div
          className="flex cursor-grab touch-none items-center justify-center p-6 [perspective:1100px] active:cursor-grabbing"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => {
            if (!drag.current.active) {
              hover.current = { x: 0, y: 0 }
              apply()
            }
          }}
        >
          <div ref={innerRef} className="card-vars preserve-3d relative w-[min(72vw,340px)] will-change-transform">
            <div className="backface-hidden">
              <CardFace card={card} className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)]" />
            </div>
            <div className="backface-hidden absolute inset-0 [transform:rotateY(180deg)]">
              <CardBack />
            </div>
          </div>
        </div>

        <div className="glass w-full max-w-sm rounded-2xl p-5">
          <div className="flex items-center gap-2">
            <span
              className="rounded-md px-2 py-0.5 font-display text-xs font-bold text-[#0b0f19]"
              style={{ background: meta.color }}
            >
              {meta.label}
            </span>
            <span className="text-xs tracking-widest text-white/50 uppercase">{meta.name}</span>
            <span className="ml-auto text-xs text-white/40">{card.id}</span>
          </div>
          <h2 className="mt-3 font-display text-2xl font-bold text-balance">{card.name}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
            <Icon className="size-4" aria-hidden="true" /> {card.element} · {series.name}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/80 italic text-pretty">{card.lore}</p>
          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-xl bg-white/5 p-2">
              <dt className="text-[10px] tracking-widest text-rose-300 uppercase">ATK</dt>
              <dd className="font-display text-lg font-bold">{card.atk}</dd>
            </div>
            <div className="rounded-xl bg-white/5 p-2">
              <dt className="text-[10px] tracking-widest text-sky-300 uppercase">DEF</dt>
              <dd className="font-display text-lg font-bold">{card.def}</dd>
            </div>
            <div className="rounded-xl bg-white/5 p-2">
              <dt className="text-[10px] tracking-widest text-white/50 uppercase">Owned</dt>
              <dd className="font-display text-lg font-bold">x{count}</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-center justify-between gap-3">
            <p className="flex items-center gap-1.5 text-xs text-white/50">
              <Move3d className="size-4" aria-hidden="true" /> Drag to rotate 360°
            </p>
            <Button variant="outline" size="sm" onClick={reset} className="border-white/15 bg-white/5">
              <RotateCcw className="size-3.5" aria-hidden="true" /> Reset
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
