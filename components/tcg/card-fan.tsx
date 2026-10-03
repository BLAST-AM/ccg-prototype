'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Gem, Sparkles, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { RARITY_META, rarityIndex } from '@/lib/tcg/data'
import type { PullResult } from '@/lib/tcg/store'
import { playSound, RARITY_CHIME } from '@/lib/tcg/audio'
import { centerOf, rarityBurst, screenShake } from '@/lib/tcg/fx'
import { CardBack, CardFace } from './card-face'
import { TiltCard } from './tilt-card'
import { URCutscene } from './ur-cutscene'

export function CardFan({
  results,
  godPack,
  onDone,
  onViewBinder,
}: {
  results: PullResult[]
  godPack: boolean
  onDone: () => void
  onViewBinder: () => void
}) {
  // Index of current card on top of the stack (0 to 4). Index 5 = all cards revealed.
  const [currentIndex, setCurrentIndex] = useState(0)
  const [revealed, setRevealed] = useState<boolean[]>(() => results.map(() => false))
  const [activeUR, setActiveUR] = useState<PullResult | null>(null)
  
  const stackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const summaryRef = useRef<HTMLDivElement>(null)

  const allRevealed = currentIndex >= results.length

  useEffect(() => {
    if (allRevealed && summaryRef.current) {
      gsap.fromTo(summaryRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' })
    }
  }, [allRevealed])

  function triggerRevealEffects(index: number) {
    const res = results[index]
    if (!res) return
    const card = res.card
    const chime = RARITY_CHIME[card.rarity]
    if (chime) playSound(chime)
    else playSound('thud')

    const el = cardRefs.current[index]
    const { x, y } = centerOf(el)
    rarityBurst(card.rarity, x, y)
    if (card.rarity === 'UR') screenShake(16)
    else if (card.rarity === 'SSR') screenShake(8)
  }

  function nextCard() {
    if (currentIndex >= results.length) return

    const currentRes = results[currentIndex]
    
    // Check if the current top card is a UR card and cutscene hasn't triggered yet
    if (currentRes.card.rarity === 'UR' && !revealed[currentIndex]) {
      setActiveUR(currentRes)
      return
    }

    advanceCard(currentIndex)
  }

  function advanceCard(index: number) {
    const el = cardRefs.current[index]
    if (el) {
      playSound('slide')
      gsap.to(el, {
        y: -420,
        x: (index % 2 === 0 ? 1 : -1) * 80,
        rotation: (index % 2 === 0 ? 1 : -1) * 18,
        opacity: 0,
        duration: 0.55,
        ease: 'power3.in',
        onComplete: () => {
          setRevealed((prev) => prev.map((v, i) => (i === index ? true : v)))
          const next = index + 1
          setCurrentIndex(next)
          if (next < results.length) {
            triggerRevealEffects(next)
          }
        },
      })
    } else {
      setRevealed((prev) => prev.map((v, i) => (i === index ? true : v)))
      const next = index + 1
      setCurrentIndex(next)
      if (next < results.length) {
        triggerRevealEffects(next)
      }
    }
  }

  function revealAll() {
    if (currentIndex >= results.length) return
    
    // If any unrevealed card is a UR, show the UR cutscene first
    const firstUR = results.find((r, i) => i >= currentIndex && r.card.rarity === 'UR' && !revealed[i])
    if (firstUR) {
      setActiveUR(firstUR)
      return
    }

    setRevealed(results.map(() => true))
    setCurrentIndex(results.length)
    playSound('chimeSSR')
  }

  function handleURCutsceneClose() {
    if (!activeUR) return
    const urIndex = results.indexOf(activeUR)
    setActiveUR(null)
    if (urIndex >= 0) {
      advanceCard(urIndex)
    }
  }

  const newCount = results.filter((r) => r.isNew).length
  const dust = results.reduce((s, r) => s + r.dust, 0)
  const best = results.reduce((a, b) => (rarityIndex(b.card.rarity) > rarityIndex(a.card.rarity) ? b : a))

  return (
    <div className="mat relative flex w-full max-w-2xl flex-col items-center gap-8 rounded-3xl px-4 py-8 sm:py-12">
      {godPack && (
        <p className="rainbow-text font-display text-2xl font-bold tracking-[0.2em] uppercase sm:text-3xl">
          ✨ God Pack! ✨
        </p>
      )}

      {activeUR && (
        <URCutscene card={activeUR.card} onClose={handleURCutsceneClose} />
      )}

      {!allRevealed && (
        <div className="flex items-center gap-2 font-display text-xs font-bold tracking-widest text-white/60 uppercase">
          <Layers className="size-4 text-primary" /> Card {currentIndex + 1} of {results.length}
        </div>
      )}

      {/* Pokémon TCG Style Card Stack */}
      <div className="relative flex h-[380px] w-[260px] items-center justify-center sm:h-[440px] sm:w-[300px]">
        {results.map((res, i) => {
          const isCurrent = i === currentIndex
          const isPast = i < currentIndex
          const stackOffset = Math.max(0, i - currentIndex)
          
          if (isPast) return null

          return (
            <div
              key={`${res.card.id}-${i}`}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              onClick={() => isCurrent && nextCard()}
              className={cn(
                'absolute inset-0 transition-transform duration-300 select-none cursor-pointer',
                isCurrent && 'z-30 hover:scale-[1.02]',
              )}
              style={{
                transform: `translateY(${stackOffset * -6}px) scale(${1 - stackOffset * 0.025})`,
                zIndex: 20 - stackOffset,
              }}
            >
              <TiltCard enabled={isCurrent && (res.card.rarity === 'SSR' || res.card.rarity === 'UR')} max={16}>
                <div className="relative">
                  <CardFace card={res.card} className="shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)]" />
                  
                  {res.isNew ? (
                    <span className="absolute -top-3 left-1/2 z-40 -translate-x-1/2 flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 font-display text-xs font-bold tracking-wider text-primary-foreground shadow-lg">
                      <Sparkles className="size-3.5" aria-hidden="true" /> NEW
                    </span>
                  ) : res.dust > 0 ? (
                    <span className="absolute -top-3 left-1/2 z-40 -translate-x-1/2 flex items-center gap-1 rounded-full bg-accent px-3 py-0.5 font-display text-xs font-bold tracking-wider text-accent-foreground shadow-lg">
                      <Gem className="size-3.5" aria-hidden="true" /> +{res.dust}
                    </span>
                  ) : null}
                </div>
              </TiltCard>
            </div>
          )
        })}
      </div>

      {!allRevealed ? (
        <div className="flex flex-col items-center gap-3">
          <Button
            onClick={nextCard}
            size="lg"
            className="h-12 px-8 font-display text-base font-bold shadow-[0_0_25px_rgba(245,158,11,0.5)]"
          >
            Slide Next Card <ChevronRight className="size-5" />
          </Button>
          <Button variant="ghost" onClick={revealAll} className="text-xs text-white/50 hover:text-white">
            Reveal All Cards
          </Button>
        </div>
      ) : (
        <div ref={summaryRef} className="glass flex w-full max-w-lg flex-col items-center gap-5 rounded-2xl p-6 text-center">
          <h3 className="font-display text-lg font-bold text-amber-200">Pack Opening Complete!</h3>
          <div className="grid w-full grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-display text-2xl font-bold text-primary">{newCount}</p>
              <p className="text-xs text-white/60">New cards</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-display text-2xl font-bold text-accent">+{dust}</p>
              <p className="text-xs text-white/60">Star Dust</p>
            </div>
            <div className="rounded-xl bg-white/5 p-3">
              <p className="font-display text-2xl font-bold" style={{ color: RARITY_META[best.card.rarity].color }}>
                {best.card.rarity}
              </p>
              <p className="text-xs text-white/60">Best pull</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={onDone} size="lg" className="font-display font-semibold shadow-lg">
              Open Another Pack
            </Button>
            <Button variant="secondary" onClick={onViewBinder} size="lg" className="font-display font-semibold">
              View Binder
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
