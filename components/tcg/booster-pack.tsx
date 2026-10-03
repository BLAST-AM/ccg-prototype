'use client'

import gsap from 'gsap'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ChevronsRight, Scissors } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Rarity, Series } from '@/lib/tcg/data'
import { playSound } from '@/lib/tcg/audio'
import { sparks } from '@/lib/tcg/fx'
import { CardBack } from './card-face'

const STRIP = 0.13
const TEAR_THRESHOLD = 0.82

type Stage = 'sealed' | 'tearing' | 'torn' | 'pulling'

export function PackArt({ series, label, className }: { series: Series; label: string; className?: string }) {
  return (
    <div className={cn('pack-foil relative h-full w-full overflow-hidden', className)}>
      <Image src={series.image} alt="" fill sizes="300px" className="object-cover" priority />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/85" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 p-4 text-center">
        <span className="rounded-full border border-amber-300/50 bg-black/50 px-3 py-0.5 text-[10px] font-semibold tracking-[0.25em] text-amber-200 uppercase">
          {label}
        </span>
        <span className="font-display text-2xl leading-none font-bold text-balance text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {series.name}
        </span>
        <span className="text-[10px] tracking-[0.3em] text-white/70 uppercase">Booster · 5 Cards</span>
      </div>
    </div>
  )
}

export function BoosterPack({
  series,
  label,
  godPack,
  highestRarity = 'SR',
  onPulled,
}: {
  series: Series
  label: string
  godPack: boolean
  highestRarity?: Rarity
  onPulled: () => void
}) {
  const [stage, setStage] = useState<Stage>('sealed')
  const floatRef = useRef<HTMLDivElement>(null)
  const packRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const drag = useRef({ active: false, start: 0, min: 0, max: 0, lastSparkX: 0, lastSoundSpan: 0, dir: 1 })

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
      packRef.current,
      { y: 120, opacity: 0, rotationY: -35, scale: 0.85 },
      { y: 0, opacity: 1, rotationY: 0, scale: 1, duration: 0.9, ease: 'back.out(1.5)' },
    )
      gsap.to(floatRef.current, { y: -10, duration: 1.8, repeat: -1, yoyo: true, ease: 'sine.inOut' })
      gsap.fromTo(
        hintRef.current,
        { left: '6%', opacity: 0 },
        { left: '86%', opacity: 1, duration: 1.4, repeat: -1, ease: 'power1.inOut', repeatDelay: 0.4 },
      )
    })
    playSound(godPack ? 'god' : 'slide')
    return () => ctx.revert()
  }, [godPack])

  function relX(clientX: number) {
    const rect = packRef.current!.getBoundingClientRect()
    return (clientX - rect.left) / rect.width
  }

  function lineY() {
    const rect = packRef.current!.getBoundingClientRect()
    return rect.top + rect.height * STRIP
  }

  function drawLine(min: number, max: number) {
    if (!lineRef.current) return
    lineRef.current.style.left = `${min * 100}%`
    lineRef.current.style.width = `${(max - min) * 100}%`
    lineRef.current.style.opacity = '1'
  }

  function completeTear(dir: number) {
    drag.current.active = false
    setStage('tearing')
    playSound('rip')
    const rect = packRef.current!.getBoundingClientRect()
    for (let i = 0; i <= 5; i++) sparks(rect.left + (rect.width * i) / 5, lineY(), 10)
    gsap
      .timeline({ onComplete: () => setStage('torn') })
      .to(lineRef.current, { opacity: 0, duration: 0.3 }, 0)
      .to(
        stripRef.current,
        {
          x: dir * 460,
          y: -300,
          rotation: dir * 80,
          opacity: 0,
          duration: 0.95,
          ease: 'power2.in',
        },
        0,
      )
      .to(cardsRef.current, { yPercent: -13, duration: 0.6, ease: 'back.out(2)' }, 0.3)
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (stage !== 'sealed') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const x = Math.min(1, Math.max(0, relX(e.clientX)))
    drag.current = { active: true, start: x, min: x, max: x, lastSparkX: e.clientX, lastSoundSpan: 0, dir: 1 }
    gsap.to(hintRef.current, { opacity: 0, duration: 0.2, overwrite: true })
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const d = drag.current
    if (!d.active) return
    const x = Math.min(1, Math.max(0, relX(e.clientX)))
    d.min = Math.min(d.min, x)
    d.max = Math.max(d.max, x)
    d.dir = x >= d.start ? 1 : -1
    const span = d.max - d.min
    drawLine(d.min, d.max)
    gsap.set(stripRef.current, {
      rotation: -d.dir * span * 5,
      y: -span * 7,
      transformOrigin: d.dir > 0 ? '100% 100%' : '0% 100%',
    })
    if (Math.abs(e.clientX - d.lastSparkX) > 18) {
      d.lastSparkX = e.clientX
      sparks(e.clientX, lineY(), 6)
    }
    if (span - d.lastSoundSpan > 0.11) {
      d.lastSoundSpan = span
      playSound('tear', { rate: 0.85 + Math.random() * 0.4 })
    }
    if (span >= TEAR_THRESHOLD) completeTear(d.dir)
  }

  function handlePointerUp() {
    const d = drag.current
    if (!d.active) return
    d.active = false
    gsap.to(stripRef.current, { rotation: 0, y: 0, duration: 0.4, ease: 'elastic.out(1, 0.5)' })
    gsap.to(lineRef.current, { opacity: 0, duration: 0.3 })
    gsap.to(hintRef.current, { opacity: 1, duration: 0.3, delay: 0.4 })
  }

  function autoTear() {
    if (stage !== 'sealed') return
    const progress = { v: 0 }
    gsap.to(hintRef.current, { opacity: 0, duration: 0.2, overwrite: true })
    gsap.to(progress, {
      v: 1,
      duration: 0.55,
      ease: 'power1.in',
      onUpdate: () => {
        drawLine(0, progress.v)
        const rect = packRef.current!.getBoundingClientRect()
        if (Math.random() > 0.5) sparks(rect.left + rect.width * progress.v, lineY(), 5)
      },
      onComplete: () => completeTear(1),
    })
    playSound('tear')
  }

  function pull() {
    if (stage !== 'torn') return
    setStage('pulling')
    playSound('slide')
    gsap
      .timeline({ onComplete: onPulled })
      .to(cardsRef.current, { yPercent: -150, duration: 0.55, ease: 'power3.in' }, 0)
      .to(cardsRef.current, { opacity: 0, duration: 0.2 }, 0.4)
      .to([bodyRef.current, backRef.current], { y: 320, opacity: 0, rotation: 6, duration: 0.6, ease: 'power2.in' }, 0.15)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="font-display text-sm tracking-[0.25em] text-white/70 uppercase" aria-live="polite">
        {stage === 'sealed' && 'Swipe across the seam to tear'}
        {stage === 'tearing' && 'Ripping…'}
        {stage === 'torn' && 'Tap the pack to pull your cards'}
        {stage === 'pulling' && 'Here they come…'}
      </p>

      <div ref={floatRef} className="relative [perspective:1200px]">
        {godPack && <div className="god-aura" aria-hidden="true" />}
        <div
          ref={packRef}
          className={cn('relative h-[400px] w-[250px] sm:h-[440px] sm:w-[275px]', stage === 'torn' && 'cursor-pointer')}
          onClick={pull}
          role={stage === 'torn' ? 'button' : undefined}
          tabIndex={stage === 'torn' ? 0 : -1}
          aria-label={stage === 'torn' ? 'Pull cards from the pack' : undefined}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') pull()
          }}
        >
          <div
            ref={backRef}
            className="absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl"
            style={{ top: `${STRIP * 100}%` }}
          />

          {(stage === 'tearing' || stage === 'torn') && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 z-15 h-36 -translate-y-full bg-gradient-to-t animate-pulse transition-opacity duration-500',
                godPack
                  ? 'from-amber-300 via-purple-400 to-transparent shadow-[0_0_100px_rgba(245,158,11,1)]'
                  : highestRarity === 'UR'
                    ? 'from-amber-400/90 via-amber-300/40 to-transparent shadow-[0_0_80px_rgba(245,158,11,1)]'
                    : highestRarity === 'SSR'
                      ? 'from-pink-500/80 via-purple-400/40 to-transparent shadow-[0_0_60px_rgba(244,114,182,0.9)]'
                      : highestRarity === 'SR'
                        ? 'from-purple-500/80 via-purple-400/30 to-transparent shadow-[0_0_50px_rgba(168,85,247,0.8)]'
                        : 'from-blue-400/50 via-cyan-300/20 to-transparent shadow-[0_0_40px_rgba(59,130,246,0.7)]',
              )}
              style={{ top: `${STRIP * 100}%` }}
              aria-hidden="true"
            />
          )}

          <div ref={cardsRef} className="absolute inset-x-[9%] top-[5%] z-10">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(i === 0 ? 'relative' : 'absolute inset-0')}
                style={{ transform: `translate(${(i - 2) * 2}px, ${i * -1.5}px) rotate(${(i - 2) * 0.8}deg)` }}
              >
                <CardBack className="shadow-lg" />
              </div>
            ))}
          </div>

          <div
            ref={bodyRef}
            className="absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-b-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] ring-1 ring-white/20"
            style={{ top: `${STRIP * 100}%` }}
          >
            <div className="absolute inset-x-0 bottom-0" style={{ height: `${100 / (1 - STRIP)}%` }}>
              <PackArt series={series} label={label} />
            </div>
          </div>

          <div
            ref={stripRef}
            className="absolute inset-x-0 top-0 z-20 overflow-hidden rounded-t-2xl ring-1 ring-white/20"
            style={{ height: `${STRIP * 100}%` }}
          >
            <div className="absolute inset-x-0 top-0" style={{ height: `${100 / STRIP}%` }}>
              <PackArt series={series} label={label} />
            </div>
            <div className="crimp absolute inset-x-0 top-0 h-1/2 opacity-70" />
            <span className="absolute right-3 bottom-1.5 flex items-center gap-1 text-[9px] font-semibold tracking-[0.25em] text-white/85 uppercase drop-shadow">
              <Scissors className="size-3" aria-hidden="true" /> Tear here
            </span>
          </div>

          {stage === 'sealed' || stage === 'tearing' ? (
            <>
              <div
                className="pointer-events-none absolute inset-x-1 z-20 border-t-2 border-dashed border-white/60"
                style={{ top: `${STRIP * 100}%` }}
              />
              <div
                ref={lineRef}
                className="pointer-events-none absolute z-30 h-[3px] -translate-y-1/2 rounded-full bg-amber-200 opacity-0 shadow-[0_0_12px_4px_rgba(245,158,11,0.9)]"
                style={{ top: `${STRIP * 100}%`, left: 0, width: 0 }}
              />
              <div
                ref={hintRef}
                className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
                style={{ top: `${STRIP * 100}%` }}
                aria-hidden="true"
              >
                <ChevronsRight className="size-6 text-amber-300 drop-shadow-[0_0_6px_rgba(245,158,11,1)]" />
              </div>
              <div
                className="absolute inset-x-[-14%] z-40 cursor-grab touch-none active:cursor-grabbing"
                style={{ top: '-8%', height: `${STRIP * 100 + 14}%` }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                aria-hidden="true"
              />
            </>
          ) : null}
        </div>
      </div>

      {stage === 'sealed' && (
        <button
          type="button"
          onClick={autoTear}
          className="text-xs tracking-widest text-white/50 uppercase underline-offset-4 transition hover:text-amber-200 hover:underline"
        >
          Or tap here to tear it open
        </button>
      )}
      {godPack && stage === 'sealed' && (
        <p className="rainbow-text font-display text-lg font-bold tracking-widest uppercase">
          A radiant aura surrounds this pack…
        </p>
      )}
    </div>
  )
}
