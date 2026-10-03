'use client'

import gsap from 'gsap'
import { useRef, useState } from 'react'
import { Coins, Flame, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { coinFlip } from '@/lib/tcg/gacha'
import { placeWager, settleWager, streakMultiplier, useGame } from '@/lib/tcg/store'
import { playSound } from '@/lib/tcg/audio'
import { goldRain, screenShake } from '@/lib/tcg/fx'

const WAGERS = [50, 100, 500]
type Side = 'heads' | 'tails'

export function CoinToss() {
  const game = useGame()
  const [wager, setWager] = useState(100)
  const [call, setCall] = useState<Side>('heads')
  const [flipping, setFlipping] = useState(false)
  const [outcome, setOutcome] = useState<{ side: Side; won: boolean; payout: number; multiplier: number } | null>(null)
  const coinRef = useRef<HTMLDivElement>(null)
  const liftRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const rotation = useRef(0)
  const multiplier = streakMultiplier(game.coinStreak)

  function flip() {
    if (flipping || !placeWager(wager)) return
    setFlipping(true)
    setOutcome(null)
    const side = coinFlip()
    const won = side === call
    const base = Math.ceil(rotation.current / 360) * 360
    const target = base + 360 * 7 + (side === 'heads' ? 0 : 180)
    rotation.current = target
    playSound('coinFlip')

    const ticks = { v: 0 }
    let lastTick = 0
    gsap
      .timeline({
        onComplete: () => {
          playSound('coinLand')
          const result = settleWager(wager, won)
          setOutcome({ side, won, payout: result.payout, multiplier: result.multiplier })
          setFlipping(false)
          if (won) {
            playSound('win')
            goldRain()
          } else {
            playSound('lose')
            screenShake(6)
          }
        },
      })
      .to(coinRef.current, { rotationX: target, duration: 2.4, ease: 'power4.out' }, 0)
      .to(
        ticks,
        {
          v: 14,
          duration: 2.2,
          ease: 'power3.out',
          onUpdate: () => {
            const v = Math.floor(ticks.v)
            if (v > lastTick) {
              lastTick = v
              playSound('coinFlip', { volume: 0.25, rate: 1 + Math.random() * 0.2 })
            }
          },
        },
        0,
      )
      .to(liftRef.current, { y: -170, duration: 0.9, ease: 'power2.out' }, 0)
      .to(liftRef.current, { y: 0, duration: 0.9, ease: 'bounce.out' }, 0.9)
      .to(shadowRef.current, { scale: 0.4, opacity: 0.2, duration: 0.9, ease: 'power2.out' }, 0)
      .to(shadowRef.current, { scale: 1, opacity: 0.6, duration: 0.9, ease: 'bounce.out' }, 0.9)
  }

  const potential = wager + Math.round(wager * multiplier)

  return (
    <section aria-label="Coin toss minigame" className="grid gap-6 lg:grid-cols-[1fr_minmax(0,380px)]">
      <div className="glass mat relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl p-6">
        <p className="absolute top-5 font-display text-xs tracking-[0.35em] text-white/50 uppercase">Double or Nothing</p>
        <div className="flex flex-col items-center [perspective:900px]">
          <div ref={liftRef}>
            <div ref={coinRef} className="preserve-3d relative size-40 sm:size-48">
              <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#fff7d6,#fbbf24_35%,#b45309_80%)] shadow-[inset_0_0_0_6px_rgba(120,60,0,0.5),inset_0_0_0_10px_rgba(255,240,200,0.6),0_0_40px_rgba(245,158,11,0.6)]">
                <Sun className="size-20 text-amber-900/80" aria-hidden="true" />
              </div>
              <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#f5e9ff,#a855f7_35%,#4c1d95_80%)] shadow-[inset_0_0_0_6px_rgba(40,0,80,0.5),inset_0_0_0_10px_rgba(233,213,255,0.6),0_0_40px_rgba(168,85,247,0.6)] [transform:rotateX(180deg)]">
                <Moon className="size-20 text-violet-950/80" aria-hidden="true" />
              </div>
            </div>
          </div>
          <div ref={shadowRef} className="mt-6 h-4 w-32 rounded-[50%] bg-black/70 opacity-60 blur-md" aria-hidden="true" />
        </div>

        <div className="mt-6 h-16 text-center" aria-live="polite">
          {outcome && (
            <>
              <p className={cn('font-display text-3xl font-bold', outcome.won ? 'text-primary' : 'text-rose-400')}>
                {outcome.side === 'heads' ? 'Heads' : 'Tails'} — {outcome.won ? 'You win!' : 'You lose'}
              </p>
              <p className="text-sm text-white/60">
                {outcome.won ? `+${outcome.payout} Coins (x${outcome.multiplier.toFixed(2)} streak bonus)` : `-${wager} Coins`}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="glass rounded-2xl p-5">
          <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">Your call</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(['heads', 'tails'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => setCall(side)}
                disabled={flipping}
                aria-pressed={call === side}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl py-3 font-display font-bold ring-1 transition disabled:opacity-60',
                  call === side
                    ? side === 'heads'
                      ? 'bg-primary/20 text-primary ring-primary'
                      : 'bg-accent/20 text-accent ring-accent'
                    : 'bg-white/5 text-white/70 ring-white/10 hover:bg-white/10',
                )}
              >
                {side === 'heads' ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
                {side === 'heads' ? 'Heads' : 'Tails'}
              </button>
            ))}
          </div>

          <h2 className="mt-5 font-display text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">Wager</h2>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {WAGERS.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setWager(w)}
                disabled={flipping}
                aria-pressed={wager === w}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-xl py-2.5 font-display font-bold ring-1 transition disabled:opacity-60',
                  wager === w ? 'bg-primary text-primary-foreground ring-primary' : 'bg-white/5 text-white/80 ring-white/10 hover:bg-white/10',
                )}
              >
                <Coins className="size-4" aria-hidden="true" /> {w}
              </button>
            ))}
          </div>

          <Button
            onClick={flip}
            disabled={flipping || game.coins < wager}
            size="lg"
            className="mt-5 h-12 w-full font-display text-base font-bold"
          >
            {flipping ? 'Flipping…' : game.coins < wager ? 'Not enough coins' : `Flip for ${potential} Coins`}
          </Button>
        </div>

        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xs font-semibold tracking-[0.3em] text-white/50 uppercase">Win streak</h2>
            <span className="flex items-center gap-1 font-display text-sm font-bold text-primary">
              <Flame className="size-4" aria-hidden="true" /> {game.coinStreak} · x{multiplier.toFixed(2)}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">Each consecutive win adds +0.25x to your payout, up to 2x. Best: {game.bestCoinStreak}</p>
          <ol className="mt-3 flex flex-wrap gap-1.5" aria-label="Recent flips">
            {game.flipHistory.length === 0 && <li className="text-xs text-white/40">No flips yet</li>}
            {game.flipHistory.map((r, i) => (
              <li
                key={i}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full font-display text-xs font-bold',
                  r === 'W' ? 'bg-primary/20 text-primary' : 'bg-rose-500/15 text-rose-400',
                )}
              >
                {r}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
