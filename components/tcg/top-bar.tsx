'use client'

import { BookOpen, CalendarDays, Coins, Gem, KeyRound, Package, Sparkles, Ticket, Volume2, VolumeX, CircleDollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FREE_PACK_COOLDOWN_MS, FREE_PACK_MAX } from '@/lib/tcg/data'
import { getDailyStatus, setMuted, useGame } from '@/lib/tcg/store'
import { formatCountdown, useNow, useTickFreePacks } from '@/lib/tcg/use-now'

export type Tab = 'packs' | 'binder' | 'coin'

const TABS: { id: Tab; label: string; icon: typeof Package }[] = [
  { id: 'packs', label: 'Open Packs', icon: Package },
  { id: 'binder', label: 'Binder', icon: BookOpen },
  { id: 'coin', label: 'Coin Toss', icon: CircleDollarSign },
]

function Stat({ icon: Icon, value, label, className }: { icon: typeof Coins; value: number; label: string; className?: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/5 py-1 pr-3 pl-1.5 ring-1 ring-white/10" title={label}>
      <span className={cn('flex size-6 items-center justify-center rounded-full', className)}>
        <Icon className="size-3.5" aria-hidden="true" />
      </span>
      <span className="font-display text-sm font-bold tabular-nums">{value.toLocaleString()}</span>
      <span className="sr-only">{label}</span>
    </div>
  )
}

function FreePackTimer({ onClick }: { onClick: () => void }) {
  const game = useGame()
  const now = useNow()
  useTickFreePacks()

  const { freePacks, freeNextAt } = game
  const atCap = freePacks >= FREE_PACK_MAX
  const hasAny = freePacks > 0
  const isMounted = now !== null

  // Progress toward next pack (0→1). Frozen at 1 when at cap.
  const remaining = !isMounted || atCap || !freeNextAt ? 0 : Math.max(0, freeNextAt - now)
  const progress = !isMounted ? 0 : atCap ? 1 : 1 - remaining / FREE_PACK_COOLDOWN_MS

  const r = 15
  const circumference = 2 * Math.PI * r

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-2 rounded-full bg-white/5 py-1 pr-3 pl-1 ring-1 ring-white/10 transition hover:bg-white/10"
      aria-label={
        atCap
          ? `Free packs full (${FREE_PACK_MAX}/${FREE_PACK_MAX})`
          : hasAny
            ? `${freePacks}/${FREE_PACK_MAX} free packs${isMounted && remaining > 0 ? ` — next in ${formatCountdown(remaining)}` : ''}`
            : `Next free pack${isMounted && remaining > 0 ? ` in ${formatCountdown(remaining)}` : ''}`
      }
    >
      <span className="relative flex size-9 items-center justify-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden="true">
          <circle cx="18" cy="18" r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            stroke={atCap ? '#f59e0b' : hasAny ? '#a855f7' : '#6b7280'}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <Package className={cn('size-4', hasAny ? (atCap ? 'animate-pulse text-amber-400' : 'text-primary') : 'text-white/40')} aria-hidden="true" />
      </span>
      <span className="flex flex-col items-start leading-none">
        <span className="text-[9px] font-semibold tracking-widest text-white/50 uppercase">Free packs</span>
        <span className={cn('font-display text-sm font-bold tabular-nums', atCap && 'text-amber-400')}>
          {freePacks}/{FREE_PACK_MAX}
          {!atCap && isMounted && remaining > 0 && (
            <span className="ml-1.5 text-[10px] font-normal text-white/40">+{formatCountdown(remaining)}</span>
          )}
        </span>
      </span>
    </button>
  )
}


export function TopBar({
  tab,
  onTab,
  onOpenDaily,
  onOpenRedeem,
}: {
  tab: Tab
  onTab: (t: Tab) => void
  onOpenDaily: () => void
  onOpenRedeem: () => void
}) {
  const game = useGame()
  const daily = getDailyStatus(game)

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0b0f19]/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[0_0_20px_rgba(168,85,247,0.5)]">
            <Sparkles className="size-5 text-white" aria-hidden="true" />
          </span>
          <div className="leading-none">
            <p className="font-display text-lg font-bold tracking-wide">ARCANA PULLS</p>
            <p className="text-[10px] tracking-[0.25em] text-white/40 uppercase">Anime TCG Simulator</p>
          </div>
        </div>

        <nav aria-label="Main" className="order-last flex w-full gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10 md:order-none md:ml-6 md:w-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={cn(
                'flex flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition md:flex-none',
                tab === id ? 'bg-primary text-primary-foreground shadow' : 'text-white/70 hover:text-white',
              )}
            >
              <Icon className="size-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <FreePackTimer onClick={() => onTab('packs')} />
          <Stat icon={Coins} value={game.coins} label="Gacha Coins" className="bg-primary/20 text-primary" />
          <Stat icon={Gem} value={game.dust} label="Star Dust" className="bg-accent/20 text-accent" />
          {game.tokens > 0 && <Stat icon={Ticket} value={game.tokens} label="Pack tokens" className="bg-primary/20 text-primary" />}
          <button
            type="button"
            onClick={onOpenRedeem}
            className="flex size-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10 text-primary hover:text-amber-400"
            aria-label="Redeem code"
            title="Redeem Code (e.g. DEV)"
          >
            <KeyRound className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onOpenDaily}
            className="relative flex size-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
            aria-label={daily.claimedToday ? 'Daily rewards' : 'Daily reward available'}
            title="Daily Rewards"
          >
            <CalendarDays className="size-4" aria-hidden="true" />
            {!daily.claimedToday && <span className="absolute top-1 right-1 size-2 rounded-full bg-rose-500 ring-2 ring-[#0b0f19]" />}
          </button>
          <button
            type="button"
            onClick={() => setMuted(!game.muted)}
            className="flex size-9 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10 transition hover:bg-white/10"
            aria-label={game.muted ? 'Unmute sound' : 'Mute sound'}
            aria-pressed={game.muted}
          >
            {game.muted ? <VolumeX className="size-4" aria-hidden="true" /> : <Volume2 className="size-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  )
}
