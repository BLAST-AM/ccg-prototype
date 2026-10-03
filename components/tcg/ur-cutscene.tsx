'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { Sparkles, Shield, Zap, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CardDef } from '@/lib/tcg/data'
import { RARITY_META, SERIES_BY_ID } from '@/lib/tcg/data'
import { playSound } from '@/lib/tcg/audio'
import { centerOf, goldRain, rarityBurst, screenShake } from '@/lib/tcg/fx'
import { CardFace } from './card-face'
import { TiltCard } from './tilt-card'

export function URCutscene({
  card,
  onClose,
}: {
  card: CardDef
  onClose: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const [stage, setStage] = useState<'lore' | 'card'>('lore')
  const series = SERIES_BY_ID[card.series]
  const meta = RARITY_META[card.rarity]

  useEffect(() => {
    playSound('chimeUR')
    screenShake(14)
    gsap.fromTo(
      containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.6, ease: 'power2.out' },
    )
    gsap.fromTo(
      textRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, delay: 0.3, ease: 'back.out(1.4)' },
    )
  }, [])

  function revealCard() {
    if (stage === 'card') return
    setStage('card')
    playSound('god')
    screenShake(16)
    const { x, y } = centerOf(cardRef.current)
    rarityBurst('UR', x, y)
    goldRain()

    gsap.fromTo(
      cardRef.current,
      { scale: 0.2, rotation: -15, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 0.9, ease: 'back.out(1.7)' },
    )
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#020307]/95 p-4 backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={`Ultra Rare Reveal: ${card.name}`}
    >
      <div className="god-aura pointer-events-none opacity-40" aria-hidden="true" />

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-5 right-5 z-30 rounded-full text-white/60 hover:text-white"
        aria-label="Skip cutscene"
      >
        <X className="size-6" />
      </Button>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        {stage === 'lore' ? (
          <div ref={textRef} className="flex flex-col items-center gap-6 px-4">
            <span className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-4 py-1 font-display text-xs font-bold tracking-[0.25em] text-amber-300 uppercase shadow-[0_0_20px_rgba(245,158,11,0.4)]">
              <Sparkles className="size-4 animate-pulse" aria-hidden="true" /> ULTRA RARE UNLOCKED
            </span>

            <div className="space-y-2">
              <h2 className="font-display text-3xl font-extrabold tracking-wide text-amber-200 drop-shadow-[0_0_20px_rgba(245,158,11,0.8)] sm:text-5xl">
                {card.name}
              </h2>
              <p className="text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">
                {series.name} · {card.element} Class
              </p>
            </div>

            <blockquote className="glass relative rounded-2xl p-6 text-base italic leading-relaxed text-amber-100/90 shadow-2xl border-amber-500/20">
              <span className="absolute -top-3 left-6 bg-[#04060d] px-2 font-display text-xs font-bold tracking-widest text-amber-400/80 uppercase">
                Ancient Lore
              </span>
              “{card.lore}”
            </blockquote>

            <Button
              onClick={revealCard}
              size="lg"
              className="h-14 px-10 font-display text-lg font-bold shadow-[0_0_35px_rgba(245,158,11,0.7)] animate-bounce"
            >
              <Sparkles className="size-5" aria-hidden="true" /> Reveal Ultra Rare
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <div ref={cardRef} className="w-[260px] sm:w-[320px]">
              <TiltCard enabled max={20}>
                <CardFace card={card} className="shadow-[0_0_60px_rgba(245,158,11,0.7)]" />
              </TiltCard>
            </div>

            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-4 text-sm font-semibold">
                <span className="flex items-center gap-1.5 text-rose-300">
                  <Zap className="size-4 text-rose-400" /> ATK {card.atk}
                </span>
                <span className="text-white/30">|</span>
                <span className="flex items-center gap-1.5 text-sky-300">
                  <Shield className="size-4 text-sky-400" /> DEF {card.def}
                </span>
              </div>

              <Button
                onClick={onClose}
                size="lg"
                className="h-12 px-8 font-display text-base font-bold shadow-[0_0_25px_rgba(245,158,11,0.5)]"
              >
                Claim Card
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
