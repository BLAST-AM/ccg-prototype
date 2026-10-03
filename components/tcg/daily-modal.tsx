'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { CalendarCheck, Coins, Gem, Ticket, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DAILY_REWARDS } from '@/lib/tcg/data'
import { claimDaily, getDailyStatus, useGame } from '@/lib/tcg/store'
import { playSound } from '@/lib/tcg/audio'
import { centerOf, goldRain, rarityBurst } from '@/lib/tcg/fx'

export function DailyModal({ onClose }: { onClose: () => void }) {
  const game = useGame()
  const status = getDailyStatus(game)
  const panelRef = useRef<HTMLDivElement>(null)
  const stampRefs = useRef<(HTMLSpanElement | null)[]>([])
  const [justClaimed, setJustClaimed] = useState<number | null>(null)

  useEffect(() => {
    gsap.fromTo(
      panelRef.current,
      { y: 40, scale: 0.94, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.6)' },
    )
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    if (justClaimed === null) return
    const stamp = stampRefs.current[justClaimed - 1]
    if (!stamp) return
    gsap.fromTo(
      stamp,
      { scale: 3.2, opacity: 0, rotation: -40 },
      {
        scale: 1,
        opacity: 1,
        rotation: -14,
        duration: 0.45,
        ease: 'back.out(3)',
        onComplete: () => {
          playSound('stamp')
          const { x, y } = centerOf(stamp)
          rarityBurst(justClaimed === 7 ? 'UR' : 'SR', x, y)
          if (justClaimed === 7) goldRain()
        },
      },
    )
  }, [justClaimed])

  function claim() {
    const result = claimDaily()
    if (!result) return
    playSound('chimeSSR')
    setJustClaimed(result.day)
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={panelRef} className="glass relative w-full max-w-2xl rounded-3xl p-5 sm:p-7">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-3 right-3 rounded-full"
          aria-label="Close daily rewards"
        >
          <X className="size-5" />
        </Button>
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <CalendarCheck className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 id="daily-title" className="font-display text-2xl font-bold">
              Daily Sign-In
            </h2>
            <p className="text-sm text-white/60">
              Streak: {status.streak} day{status.streak === 1 ? '' : 's'} · Miss a day and it resets
            </p>
          </div>
        </div>

        <ol className="mt-6 grid grid-cols-4 gap-2 sm:grid-cols-7 sm:gap-3">
          {DAILY_REWARDS.map((reward, i) => {
            const day = i + 1
            const stamped = day <= status.stamped
            const isToday = !status.claimedToday && day === status.nextDay
            const isFinal = day === 7
            return (
              <li
                key={day}
                className={cn(
                  'relative flex flex-col items-center gap-1 overflow-hidden rounded-xl p-2 py-3 text-center ring-1',
                  isFinal ? 'col-span-4 bg-gradient-to-br from-accent/30 to-primary/20 sm:col-span-1' : 'bg-white/5',
                  isToday ? 'ring-2 ring-primary shadow-[0_0_24px_-4px_rgba(245,158,11,0.8)]' : 'ring-white/10',
                )}
              >
                <span className="text-[10px] font-semibold tracking-widest text-white/50 uppercase">Day {day}</span>
                {reward.token ? (
                  <Ticket className="size-6 text-primary" aria-hidden="true" />
                ) : (
                  <Coins className="size-6 text-primary" aria-hidden="true" />
                )}
                <span className="font-display text-sm font-bold">{reward.coins}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-accent">
                  <Gem className="size-3" aria-hidden="true" />
                  {reward.dust}
                </span>
                {reward.token && <span className="text-[10px] leading-tight text-primary">+ Choice Pack Token</span>}
                <span
                  ref={(el) => {
                    stampRefs.current[i] = el
                  }}
                  className={cn(
                    'pointer-events-none absolute inset-0 m-auto flex size-14 -rotate-[14deg] items-center justify-center rounded-full border-[3px] border-rose-500 bg-[#0b0f19]/60 font-display text-[10px] font-bold tracking-wider text-rose-400',
                    stamped ? 'opacity-100' : 'opacity-0',
                  )}
                  aria-hidden={!stamped}
                >
                  CLAIMED
                </span>
                <span className="sr-only">{stamped ? 'Claimed' : isToday ? 'Available today' : 'Upcoming'}</span>
              </li>
            )
          })}
        </ol>

        <div className="mt-6 flex flex-col items-center gap-2">
          {status.claimedToday ? (
            <>
              <p className="text-sm text-white/70" aria-live="polite">
                {justClaimed
                  ? `Day ${justClaimed} reward claimed!${justClaimed === 7 ? ' You earned a Choose-Your-Own Pack token.' : ''}`
                  : 'Come back tomorrow for your next reward.'}
              </p>
              <Button onClick={onClose} variant="secondary" className="font-display font-semibold">
                Continue
              </Button>
            </>
          ) : (
            <Button onClick={claim} size="lg" className="h-12 px-10 font-display text-base font-bold">
              Claim Day {status.nextDay}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
