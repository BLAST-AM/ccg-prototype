'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Coins, KeyRound, Sparkles, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { redeemCode } from '@/lib/tcg/store'
import { playSound } from '@/lib/tcg/audio'
import { centerOf, goldRain, rarityBurst, screenShake } from '@/lib/tcg/fx'

const PRESET_CODES = [
  { code: 'DEV', reward: '+10,000 Coins', badge: 'Dev Test' },
  { code: 'GODPACK', reward: '+5,000 Coins + 2 Tokens', badge: 'Bonus' },
  { code: 'ARCANA', reward: '+5,000 Coins + 2 Tokens', badge: 'Bonus' },
]

export function RedeemModal({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [code, setCode] = useState('')
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    gsap.fromTo(
      panelRef.current,
      { y: 40, scale: 0.94, opacity: 0 },
      { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' },
    )
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleRedeem(codeToRedeem?: string) {
    const targetCode = codeToRedeem ?? code
    if (!targetCode.trim()) return

    const res = redeemCode(targetCode)
    setStatus(res)

    if (res.success) {
      playSound('chimeSSR')
      screenShake(6)
      const { x, y } = centerOf(buttonRef.current)
      rarityBurst('UR', x, y)
      goldRain()
      setCode('')
    } else {
      playSound('lose')
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#05070d]/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="redeem-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div ref={panelRef} className="glass relative w-full max-w-md rounded-3xl p-6 sm:p-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full text-white/60 hover:text-white"
          aria-label="Close modal"
        >
          <X className="size-5" />
        </Button>

        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-[0_0_20px_rgba(245,158,11,0.3)] ring-1 ring-primary/40">
            <KeyRound className="size-6" aria-hidden="true" />
          </span>
          <div>
            <h2 id="redeem-title" className="font-display text-2xl font-bold">
              Redeem Code
            </h2>
            <p className="text-xs text-white/60">Enter a code below to receive instant rewards.</p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleRedeem()
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="relative">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ENTER CODE (e.g. DEV)"
              className="w-full rounded-xl bg-white/5 py-3 pr-4 pl-4 font-mono text-base font-bold tracking-wider text-white uppercase placeholder:text-white/30 ring-1 ring-white/15 transition focus:bg-white/10 focus:ring-2 focus:ring-primary focus:outline-none"
              autoFocus
            />
          </div>

          <Button
            ref={buttonRef}
            type="submit"
            size="lg"
            className="h-12 font-display text-base font-bold shadow-[0_0_25px_rgba(245,158,11,0.5)]"
          >
            <Sparkles className="size-4" aria-hidden="true" /> Redeem Code
          </Button>
        </form>

        {status && (
          <div
            className={cn(
              'mt-4 flex items-center gap-2.5 rounded-xl p-3.5 text-sm font-semibold border',
              status.success
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/15 text-rose-300 border-rose-500/30',
            )}
            aria-live="polite"
          >
            {status.success ? (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400" aria-hidden="true" />
            ) : (
              <AlertCircle className="size-5 shrink-0 text-rose-400" aria-hidden="true" />
            )}
            <span>{status.message}</span>
          </div>
        )}

        <div className="mt-6 border-t border-white/10 pt-4">
          <p className="text-[11px] font-semibold tracking-wider text-white/40 uppercase">Quick Test Codes</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {PRESET_CODES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setCode(item.code)
                  handleRedeem(item.code)
                }}
                className="group flex items-center justify-between rounded-xl bg-white/5 px-3.5 py-2.5 ring-1 ring-white/10 transition hover:bg-primary/20 hover:ring-primary/40 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold tracking-wider text-primary group-hover:text-amber-300">
                    {item.code}
                  </span>
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-medium text-white/60">
                    {item.badge}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <Coins className="size-3.5" aria-hidden="true" />
                  <span>{item.reward}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
