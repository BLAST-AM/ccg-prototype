'use client'

import { useEffect, useState } from 'react'
import { tickFreePacks } from './store'

export function useNow(interval = 1000): number | null {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    setNow(Date.now())
    const id = window.setInterval(() => setNow(Date.now()), interval)
    return () => window.clearInterval(id)
  }, [interval])
  return now
}

export function formatCountdown(ms: number) {
  const total = Math.ceil(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Call once near the app root. Accumulates free packs in real-time. */
export function useTickFreePacks() {
  useEffect(() => {
    // Check immediately on mount
    tickFreePacks()
    const id = window.setInterval(() => tickFreePacks(), 5000)
    return () => window.clearInterval(id)
  }, [])
}
