'use client'

import gsap from 'gsap'
import { useRef, useState } from 'react'
import { Gem, Hammer, Recycle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CARDS, RARITY_META, SERIES, type CardDef, type SeriesId } from '@/lib/tcg/data'
import { craftCard, getDuplicateSummary, recycleDuplicates, seriesProgress, useGame } from '@/lib/tcg/store'
import { playSound, RARITY_CHIME } from '@/lib/tcg/audio'
import { centerOf, dustPuff, rarityBurst } from '@/lib/tcg/fx'
import { CardArt } from './card-art'
import { CardBack, CardFace } from './card-face'
import { URCutscene } from './ur-cutscene'

export function Binder({ onInspect }: { onInspect: (card: CardDef) => void }) {
  const game = useGame()
  const [filter, setFilter] = useState<'all' | SeriesId>('all')
  const [message, setMessage] = useState('')
  const [recycling, setRecycling] = useState(false)
  const [activeUR, setActiveUR] = useState<CardDef | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const dupes = getDuplicateSummary(game)
  const ownedTotal = CARDS.filter((c) => (game.collection[c.id] ?? 0) > 0).length
  const visibleSeries = SERIES.filter((s) => filter === 'all' || s.id === filter)

  function handleRecycle() {
    if (!rootRef.current || dupes.copies === 0 || recycling) return
    setRecycling(true)
    playSound('dust')
    const ghosts = Array.from(rootRef.current.querySelectorAll<HTMLElement>('[data-ghost]'))
    ghosts.forEach((g, i) => {
      window.setTimeout(() => {
        const { x, y } = centerOf(g)
        dustPuff(x, y)
      }, i * 70)
    })
    gsap.to(ghosts, {
      opacity: 0,
      scale: 1.15,
      y: -30,
      filter: 'blur(10px) brightness(2)',
      duration: 0.8,
      stagger: 0.07,
      ease: 'power2.in',
      onComplete: () => {
        const gained = recycleDuplicates()
        setMessage(`Recycled ${dupes.copies} duplicate${dupes.copies === 1 ? '' : 's'} into ${gained} Star Dust.`)
        setRecycling(false)
        playSound('chimeSR')
      },
    })
  }

  function handleCraft(card: CardDef, el: HTMLElement) {
    if (!craftCard(card.id)) return
    if (card.rarity === 'UR') {
      setActiveUR(card)
    } else {
      const chime = RARITY_CHIME[card.rarity]
      playSound('thud')
      if (chime) playSound(chime)
      const { x, y } = centerOf(el)
      rarityBurst(card.rarity === 'C' ? 'R' : card.rarity, x, y)
    }
    setMessage(`Crafted ${card.name}!`)
  }

  return (
    <section ref={rootRef} aria-label="Collection binder" className="flex flex-col gap-6">
      {activeUR && <URCutscene card={activeUR} onClose={() => setActiveUR(null)} />}
      <div className="glass flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold">Collection Binder</h2>
          <p className="text-sm text-white/60">
            {ownedTotal}/{CARDS.length} cards collected · {game.stats.packsOpened} packs opened · {game.stats.godPacks} God Packs
          </p>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <Button
            onClick={handleRecycle}
            disabled={dupes.copies === 0 || recycling}
            className="bg-accent font-display font-semibold text-accent-foreground hover:bg-accent/90"
          >
            <Recycle className="size-4" aria-hidden="true" />
            Mass-Recycle Duplicates
          </Button>
          <p className="text-xs text-white/50">
            {dupes.copies > 0 ? `${dupes.copies} extra copies → +${dupes.dust} Star Dust` : 'No duplicates to recycle'}
          </p>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {message}
      </p>
      {message && (
        <p className="-mt-3 text-center text-sm text-primary" aria-hidden="true">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by series">
        {(['all', ...SERIES.map((s) => s.id)] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium ring-1 transition',
              filter === id ? 'bg-primary text-primary-foreground ring-primary' : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10',
            )}
          >
            {id === 'all' ? 'All series' : SERIES.find((s) => s.id === id)!.name}
          </button>
        ))}
      </div>

      {visibleSeries.map((series) => {
        const progress = seriesProgress(game, series.id)
        const cards = CARDS.filter((c) => c.series === series.id)
        return (
          <div key={series.id} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-lg font-bold">{series.name}</h3>
                <p className="text-sm text-white/60">
                  {series.name}: {progress.owned}/{progress.total} Cards - {progress.percent}% Complete
                </p>
              </div>
              <div
                className="h-2 overflow-hidden rounded-full bg-white/10"
                role="progressbar"
                aria-valuenow={progress.percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${series.name} completion`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-primary transition-[width] duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>

            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8">
              {cards.map((card) => {
                const count = game.collection[card.id] ?? 0
                return (
                  <li key={card.id}>
                    {count > 0 ? (
                      <button
                        type="button"
                        onClick={() => onInspect(card)}
                        className="group relative block w-full rounded-[5%] text-left focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                        aria-label={`Inspect ${card.name}, owned ${count}`}
                      >
                        {count > 1 && (
                          <div data-ghost className="absolute inset-0 translate-x-[5px] translate-y-[5px] rotate-[3deg] opacity-80">
                            <CardBack />
                          </div>
                        )}
                        <div className="card-vars relative transition duration-300 group-hover:-translate-y-1.5 group-hover:drop-shadow-[0_12px_20px_rgba(168,85,247,0.4)]">
                          <CardFace card={card} />
                        </div>
                        {count > 1 && (
                          <span className="absolute -top-2 -right-2 z-10 rounded-full bg-primary px-2 py-0.5 font-display text-xs font-bold text-primary-foreground shadow">
                            x{count}
                          </span>
                        )}
                      </button>
                    ) : (
                      <LockedCard card={card} canCraft={game.dust >= RARITY_META[card.rarity].craft} onCraft={handleCraft} />
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </section>
  )
}

function LockedCard({
  card,
  canCraft,
  onCraft,
}: {
  card: CardDef
  canCraft: boolean
  onCraft: (card: CardDef, el: HTMLElement) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const meta = RARITY_META[card.rarity]
  const series = SERIES.find((s) => s.id === card.series)!
  return (
    <div ref={ref} className="@container flex flex-col gap-1.5">
      <div className="relative aspect-[63/88] w-full overflow-hidden rounded-[5cqw] bg-[#0a0d16] ring-1 ring-white/10">
        <div className="absolute inset-[3.6cqw] overflow-hidden rounded-[3.4cqw]">
          <CardArt card={card} silhouette />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d16] via-[#0a0d16]/60 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-[1.5cqw] p-[5cqw] text-center">
          <span className="font-display text-[12cqw] leading-none font-bold text-white/30">???</span>
          <span className="text-[6cqw] leading-tight text-white/50 text-balance">Obtainable in {series.name} Pack</span>
          <span className="font-display text-[6cqw] font-bold" style={{ color: meta.color }}>
            {meta.label}
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={!canCraft}
        onClick={() => ref.current && onCraft(card, ref.current)}
        className="flex items-center justify-center gap-1 rounded-lg bg-white/5 py-1 text-[11px] font-medium text-white/70 ring-1 ring-white/10 transition enabled:hover:bg-accent/20 enabled:hover:text-white disabled:opacity-50"
        aria-label={`Craft ${card.id} for ${meta.craft} Star Dust`}
      >
        <Hammer className="size-3" aria-hidden="true" /> {meta.craft}
        <Gem className="size-3 text-accent" aria-hidden="true" />
      </button>
    </div>
  )
}
