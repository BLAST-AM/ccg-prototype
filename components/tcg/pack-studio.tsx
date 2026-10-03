'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ArrowLeft, Coins, Gift, KeyRound, Lock, Sparkles, Ticket, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { GOD_PACK_CHANCE, FREE_PACK_MAX, PACK_PRICES, RARITY_META, RARITY_ORDER, SERIES, SERIES_BY_ID, rarityIndex, type SeriesId } from '@/lib/tcg/data'
import { rollPack, type PackMode } from '@/lib/tcg/gacha'
import { canPurchase, grantCards, purchasePack, seriesProgress, useGame, type PullResult, type PurchaseKind } from '@/lib/tcg/store'
import { playSound } from '@/lib/tcg/audio'
import { useNow, formatCountdown } from '@/lib/tcg/use-now'
import { BoosterPack, PackArt } from './booster-pack'
import { CardFan } from './card-fan'
import { TiltCard } from './tilt-card'

interface Session {
  key: number
  seriesId: SeriesId
  label: string
  godPack: boolean
  results: PullResult[]
  stage: 'pack' | 'fan'
}

const LABELS: Record<PurchaseKind, string> = {
  standard: 'Standard',
  free: 'Free Pack',
  rateup: '2x Rate-Up',
  token: 'Exclusive',
}

export function PackStudio({ onViewBinder, onOpenRedeem }: { onViewBinder: () => void; onOpenRedeem?: () => void }) {
  const game = useGame()
  const now = useNow()
  const [selected, setSelected] = useState<SeriesId>('aether')
  const [session, setSession] = useState<Session | null>(null)

  function open(kind: PurchaseKind) {
    if (!purchasePack(kind)) return
    playSound('click')
    const mode: PackMode =
      kind === 'rateup'
        ? { kind: 'rateup', series: selected }
        : kind === 'token'
          ? { kind: 'exclusive', series: selected }
          : { kind: 'standard' }
    const { cards, godPack } = rollPack(mode)
    const results = grantCards(cards, godPack)
    const seriesId = mode.kind === 'standard' ? SERIES[Math.floor(Math.random() * SERIES.length)].id : mode.series
    setSession({ key: Date.now(), seriesId, label: LABELS[kind], godPack, results, stage: 'pack' })
  }

  if (session) {
    const highestRarity = session.results.reduce((a, b) =>
      rarityIndex(b.card.rarity) > rarityIndex(a.card.rarity) ? b : a,
    ).card.rarity

    return (
      <section aria-label="Pack opening" className="flex flex-col items-center gap-4">
        <div className="flex w-full justify-start">
          {session.stage === 'pack' && (
            <Button variant="ghost" size="sm" onClick={() => setSession(null)} className="text-white/60">
              <ArrowLeft className="size-4" aria-hidden="true" /> Back to shop
            </Button>
          )}
        </div>
        {session.stage === 'pack' ? (
          <div className="flex min-h-[560px] items-center justify-center py-6">
            <BoosterPack
              key={session.key}
              series={SERIES_BY_ID[session.seriesId]}
              label={session.label}
              godPack={session.godPack}
              highestRarity={highestRarity}
              onPulled={() => setSession((s) => (s ? { ...s, stage: 'fan' } : s))}
            />
          </div>
        ) : (
          <CardFan
            key={session.key}
            results={session.results}
            godPack={session.godPack}
            onDone={() => setSession(null)}
            onViewBinder={() => {
              setSession(null)
              onViewBinder()
            }}
          />
        )}
        {session.stage === 'pack' && (
          <p className="sr-only">Your pulled cards are already saved to your binder.</p>
        )}
      </section>
    )
  }

  const series = SERIES_BY_ID[selected]
  const isMounted = now !== null
  const freeReady = canPurchase(game, 'free')
  const { freePacks, freeNextAt } = game
  const atCap = freePacks >= FREE_PACK_MAX
  const freeRemaining = !isMounted || atCap || !freeNextAt ? 0 : Math.max(0, freeNextAt - now)

  return (
    <section aria-label="Pack shop" className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-10">
      <div className="flex flex-col items-center gap-5">
        <TiltCard max={14} className="w-[230px] sm:w-[260px]">
          <div className="relative aspect-[5/8] overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(168,85,247,0.6)] ring-1 ring-white/20">
            <PackArt series={series} label="Featured Series" />
            <div className="glare" aria-hidden="true" />
          </div>
        </TiltCard>
        <p className="max-w-xs text-center text-sm text-white/60 text-pretty">{series.tagline}</p>
      </div>

      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">Choose a series</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {SERIES.map((s) => {
              const progress = seriesProgress(game, s.id)
              const active = s.id === selected
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSelected(s.id)
                    playSound('click')
                  }}
                  aria-pressed={active}
                  className={cn(
                    'group relative overflow-hidden rounded-xl text-left ring-1 transition',
                    active ? 'ring-2 ring-primary shadow-[0_0_30px_-6px_rgba(245,158,11,0.7)]' : 'ring-white/10 hover:ring-white/30',
                  )}
                >
                  <div className="relative aspect-[4/3]">
                    <Image src={s.image} alt="" fill sizes="200px" className="object-cover object-top transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-2.5">
                    <p className="font-display text-sm leading-tight font-bold">{s.name}</p>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/15">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-white/60">
                      {progress.owned}/{progress.total} collected
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <ShopOption
            icon={Gift}
            title="Free Standard Pack"
            description={
              atCap
                ? `Packs full! (${FREE_PACK_MAX}/${FREE_PACK_MAX}) Open some to keep earning.`
                : isMounted && freeRemaining > 0
                  ? `${freePacks}/${FREE_PACK_MAX} stored · next in ${formatCountdown(freeRemaining)} · max ${FREE_PACK_MAX}`
                  : `${freePacks}/${FREE_PACK_MAX} stored · max ${FREE_PACK_MAX}`
            }
            highlight={freeReady}
            action={
              <Button onClick={() => open('free')} disabled={!freeReady} className="w-full font-display font-semibold">
                {freeReady
                  ? `Open free pack (${freePacks} left)`
                  : isMounted && freeRemaining > 0
                    ? `Ready in ${formatCountdown(freeRemaining)}`
                    : 'Free pack cooldown'}
              </Button>
            }
          />
          <ShopOption
            icon={Sparkles}
            title="Standard Booster"
            description="All four series at standard drop rates."
            action={
              <Button
                onClick={() => open('standard')}
                disabled={!canPurchase(game, 'standard')}
                variant="secondary"
                className="w-full font-display font-semibold"
              >
                <Coins className="size-4 text-primary" aria-hidden="true" /> {PACK_PRICES.standard} Coins
              </Button>
            }
          />
          <ShopOption
            icon={TrendingUp}
            title={`${series.name} Rate-Up`}
            description={`2x boosted drop rate for ${series.name} cards.`}
            accent
            action={
              <Button
                onClick={() => open('rateup')}
                disabled={!canPurchase(game, 'rateup')}
                className="w-full bg-accent font-display font-semibold text-accent-foreground hover:bg-accent/90"
              >
                <Coins className="size-4" aria-hidden="true" /> {PACK_PRICES.rateup} Coins
              </Button>
            }
          />
          <ShopOption
            icon={game.tokens > 0 ? Ticket : Lock}
            title="Choose-Your-Own Pack"
            description={
              game.tokens > 0
                ? `Spend a token on a ${series.name}-exclusive pack.`
                : 'Earn a token on Day 7 of your login streak.'
            }
            highlight={game.tokens > 0}
            action={
              <Button
                onClick={() => open('token')}
                disabled={game.tokens < 1}
                variant="secondary"
                className="w-full font-display font-semibold"
              >
                <Ticket className="size-4 text-primary" aria-hidden="true" /> Use token ({game.tokens})
              </Button>
            }
          />
        </div>

        {onOpenRedeem && (
          <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-2xl p-4 ring-1 ring-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-transparent">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <KeyRound className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-display text-sm font-bold">Have a Promo Code?</p>
                <p className="text-xs text-white/60">
                  Use code <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-amber-300">DEV</code> for +10,000 free coins to test pulls!
                </p>
              </div>
            </div>
            <Button onClick={onOpenRedeem} variant="secondary" className="font-display font-semibold">
              Redeem Code
            </Button>
          </div>
        )}

        <div className="glass rounded-2xl p-4">
          <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">Drop rates per card</h2>
          <ul className="mt-3 grid grid-cols-5 gap-2 text-center">
            {RARITY_ORDER.map((r) => (
              <li key={r} className="rounded-lg bg-white/5 px-1 py-2">
                <p className="font-display text-sm font-bold" style={{ color: RARITY_META[r].color }}>
                  {r}
                </p>
                <p className="text-xs text-white/60">{RARITY_META[r].rate}%</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-white/50">
            <span className="rainbow-text font-semibold">God Pack</span> chance: {GOD_PACK_CHANCE * 100}% — all five cards SR or
            higher.
          </p>
        </div>
      </div>
    </section>
  )
}

function ShopOption({
  icon: Icon,
  title,
  description,
  action,
  highlight,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action: React.ReactNode
  highlight?: boolean
  accent?: boolean
}) {
  return (
    <div
      className={cn(
        'glass flex flex-col gap-3 rounded-2xl p-4 transition',
        highlight && 'ring-1 ring-primary/60 shadow-[0_0_40px_-12px_rgba(245,158,11,0.7)]',
        accent && 'ring-1 ring-accent/50 shadow-[0_0_40px_-14px_rgba(168,85,247,0.8)]',
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            accent ? 'bg-accent/20 text-accent' : 'bg-primary/15 text-primary',
          )}
        >
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-display font-bold leading-tight">{title}</h3>
          <p className="mt-0.5 text-sm text-white/60 text-pretty">{description}</p>
        </div>
      </div>
      <div className="mt-auto">{action}</div>
    </div>
  )
}
