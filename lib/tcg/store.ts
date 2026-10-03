'use client'

import { useSyncExternalStore } from 'react'
import {
  CARDS,
  CARDS_BY_ID,
  DAILY_REWARDS,
  FREE_PACK_COOLDOWN_MS,
  FREE_PACK_MAX,
  PACK_PRICES,
  RARITY_META,
  type CardDef,
  type SeriesId,
} from './data'

const STORAGE_KEY = 'anime-tcg-sim:v1'

export interface GameState {
  coins: number
  dust: number
  tokens: number
  collection: Record<string, number>
  daily: { lastClaimDate: string | null; streak: number }
  /** @deprecated use freePacks + freeNextAt */
  freeReadyAt?: number
  freePacks: number
  freeNextAt: number
  coinStreak: number
  bestCoinStreak: number
  flipHistory: ('W' | 'L')[]
  stats: { packsOpened: number; godPacks: number; cardsPulled: number }
  muted: boolean
}

const DEFAULT_STATE: GameState = {
  coins: 500,
  dust: 0,
  tokens: 0,
  collection: {},
  daily: { lastClaimDate: null, streak: 0 },
  freePacks: 1,
  freeNextAt: 0,
  coinStreak: 0,
  bestCoinStreak: 0,
  flipHistory: [],
  stats: { packsOpened: 0, godPacks: 0, cardsPulled: 0 },
  muted: false,
}

let state: GameState = DEFAULT_STATE
let loaded = false
const listeners = new Set<() => void>()

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return
  loaded = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<GameState>
      let freePacks = parsed.freePacks ?? 1
      let freeNextAt = parsed.freeNextAt && parsed.freeNextAt > 0 ? parsed.freeNextAt : Date.now() + FREE_PACK_COOLDOWN_MS

      // Migrate old freeReadyAt: if old save had it ready (timestamp in past), give 1 pack
      if (parsed.freeReadyAt !== undefined && parsed.freePacks === undefined) {
        freePacks = parsed.freeReadyAt <= Date.now() ? 1 : 0
        freeNextAt = parsed.freeReadyAt <= Date.now() ? Date.now() + FREE_PACK_COOLDOWN_MS : parsed.freeReadyAt
      }

      // Accumulate packs that built up while the app was closed
      const now = Date.now()
      if (freePacks < FREE_PACK_MAX && freeNextAt <= now) {
        const elapsed = now - freeNextAt
        const gained = 1 + Math.floor(elapsed / FREE_PACK_COOLDOWN_MS)
        freePacks = Math.min(FREE_PACK_MAX, freePacks + gained)
        freeNextAt = freePacks >= FREE_PACK_MAX ? now : freeNextAt + gained * FREE_PACK_COOLDOWN_MS
      }

      state = {
        ...DEFAULT_STATE,
        ...parsed,
        daily: { ...DEFAULT_STATE.daily, ...parsed.daily },
        stats: { ...DEFAULT_STATE.stats, ...parsed.stats },
        collection: { ...parsed.collection },
        freePacks,
        freeNextAt,
      }
    }
  } catch {
    state = DEFAULT_STATE
  }
}

function emit() {
  listeners.forEach((l) => l())
}

function setState(updater: (prev: GameState) => GameState) {
  ensureLoaded()
  state = updater(state)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    loaded = false
    ensureLoaded()
    emit()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

export function getState() {
  ensureLoaded()
  return state
}

export function useGame() {
  return useSyncExternalStore(subscribe, getState, () => DEFAULT_STATE)
}

export function dateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function yesterdayKey() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}

export function getDailyStatus(s: GameState) {
  const today = dateKey()
  const claimedToday = s.daily.lastClaimDate === today
  const continuing = s.daily.lastClaimDate === yesterdayKey()
  if (claimedToday) {
    const stamped = ((s.daily.streak - 1) % 7) + 1
    return { claimedToday, stamped, nextDay: stamped, streak: s.daily.streak }
  }
  const stamped = continuing ? s.daily.streak % 7 : 0
  return { claimedToday, stamped, nextDay: stamped + 1, streak: continuing ? s.daily.streak : 0 }
}

export function claimDaily() {
  const s = getState()
  const status = getDailyStatus(s)
  if (status.claimedToday) return null
  const reward = DAILY_REWARDS[status.nextDay - 1]
  setState((prev) => ({
    ...prev,
    coins: prev.coins + reward.coins,
    dust: prev.dust + reward.dust,
    tokens: prev.tokens + (reward.token ?? 0),
    daily: { lastClaimDate: dateKey(), streak: status.streak + 1 },
  }))
  return { day: status.nextDay, reward }
}

export interface RedeemResult {
  success: boolean
  message: string
  coinsGained?: number
  tokensGained?: number
}

export function redeemCode(inputCode: string): RedeemResult {
  const code = inputCode.trim().toUpperCase()
  if (!code) {
    return { success: false, message: 'Please enter a redeem code.' }
  }

  if (code === 'DEV') {
    const coinsGained = 10000
    setState((prev) => ({
      ...prev,
      coins: prev.coins + coinsGained,
    }))
    return {
      success: true,
      message: 'Developer mode activated! +10,000 Coins added.',
      coinsGained,
    }
  }

  if (code === 'GODPACK' || code === 'ARCANA') {
    const coinsGained = 5000
    const tokensGained = 2
    setState((prev) => ({
      ...prev,
      coins: prev.coins + coinsGained,
      tokens: prev.tokens + tokensGained,
    }))
    return {
      success: true,
      message: 'Special code redeemed! +5,000 Coins & +2 Pack Tokens.',
      coinsGained,
      tokensGained,
    }
  }

  return { success: false, message: 'Invalid code. Try code "DEV"!' }
}

export type PurchaseKind = 'standard' | 'rateup' | 'free' | 'token'

export function canPurchase(s: GameState, kind: PurchaseKind, _now = Date.now()) {
  if (kind === 'standard') return s.coins >= PACK_PRICES.standard
  if (kind === 'rateup') return s.coins >= PACK_PRICES.rateup
  if (kind === 'free') return s.freePacks > 0
  return s.tokens > 0
}

/** Call every tick to accumulate free packs while app is open. Returns true if state changed. */
export function tickFreePacks(now = Date.now()): boolean {
  const s = getState()
  if (s.freePacks >= FREE_PACK_MAX) return false
  if (!s.freeNextAt || s.freeNextAt === 0) {
    setState((prev) => ({ ...prev, freeNextAt: now + FREE_PACK_COOLDOWN_MS }))
    return true
  }
  if (now < s.freeNextAt) return false
  // How many packs accumulated?
  const elapsed = now - s.freeNextAt
  const gained = 1 + Math.floor(elapsed / FREE_PACK_COOLDOWN_MS)
  const newPacks = Math.min(FREE_PACK_MAX, s.freePacks + gained)
  const delta = newPacks - s.freePacks
  const newNextAt = newPacks >= FREE_PACK_MAX ? s.freeNextAt : s.freeNextAt + delta * FREE_PACK_COOLDOWN_MS
  setState((prev) => ({ ...prev, freePacks: newPacks, freeNextAt: newNextAt }))
  return true
}

export function purchasePack(kind: PurchaseKind) {
  const s = getState()
  const now = Date.now()
  if (!canPurchase(s, kind, now)) return false
  setState((prev) => ({
    ...prev,
    coins: prev.coins - (kind === 'standard' ? PACK_PRICES.standard : kind === 'rateup' ? PACK_PRICES.rateup : 0),
    tokens: prev.tokens - (kind === 'token' ? 1 : 0),
    freePacks: kind === 'free' ? prev.freePacks - 1 : prev.freePacks,
    // Start the timer for the next pack if we were at cap (timer was paused)
    freeNextAt: kind === 'free' && prev.freePacks >= FREE_PACK_MAX ? now + FREE_PACK_COOLDOWN_MS : prev.freeNextAt,
  }))
  return true
}

export interface PullResult {
  card: CardDef
  isNew: boolean
  dust: number
}

export function grantCards(cards: CardDef[], godPack: boolean): PullResult[] {
  const counts = { ...getState().collection }
  let dustGained = 0
  const results = cards.map((card) => {
    const isNew = !counts[card.id]
    counts[card.id] = (counts[card.id] ?? 0) + 1
    const dust = isNew ? 0 : RARITY_META[card.rarity].dupDust
    dustGained += dust
    return { card, isNew, dust }
  })
  setState((prev) => ({
    ...prev,
    collection: counts,
    dust: prev.dust + dustGained,
    stats: {
      packsOpened: prev.stats.packsOpened + 1,
      godPacks: prev.stats.godPacks + (godPack ? 1 : 0),
      cardsPulled: prev.stats.cardsPulled + cards.length,
    },
  }))
  return results
}

export function craftCard(id: string) {
  const card = CARDS_BY_ID[id]
  const cost = RARITY_META[card.rarity].craft
  if (getState().dust < cost) return false
  setState((prev) => ({
    ...prev,
    dust: prev.dust - cost,
    collection: { ...prev.collection, [id]: (prev.collection[id] ?? 0) + 1 },
  }))
  return true
}

export function getDuplicateSummary(s: GameState) {
  let copies = 0
  let dust = 0
  for (const card of CARDS) {
    const extra = Math.max(0, (s.collection[card.id] ?? 0) - 1)
    copies += extra
    dust += extra * RARITY_META[card.rarity].recycleDust
  }
  return { copies, dust }
}

export function recycleDuplicates() {
  const { dust } = getDuplicateSummary(getState())
  if (dust === 0) return 0
  setState((prev) => ({
    ...prev,
    dust: prev.dust + dust,
    collection: Object.fromEntries(Object.entries(prev.collection).map(([id, n]) => [id, Math.min(n, 1)])),
  }))
  return dust
}

export function placeWager(amount: number) {
  if (getState().coins < amount) return false
  setState((prev) => ({ ...prev, coins: prev.coins - amount }))
  return true
}

export function streakMultiplier(streak: number) {
  return Math.min(1 + streak * 0.25, 2)
}

export function settleWager(amount: number, won: boolean) {
  const multiplier = streakMultiplier(getState().coinStreak)
  const payout = won ? amount + Math.round(amount * multiplier) : 0
  setState((prev) => {
    const coinStreak = won ? prev.coinStreak + 1 : 0
    return {
      ...prev,
      coins: prev.coins + payout,
      coinStreak,
      bestCoinStreak: Math.max(prev.bestCoinStreak, coinStreak),
      flipHistory: [...prev.flipHistory, won ? ('W' as const) : ('L' as const)].slice(-12),
    }
  })
  return { payout, multiplier }
}

export function setMuted(muted: boolean) {
  setState((prev) => ({ ...prev, muted }))
}

export function seriesProgress(s: GameState, series: SeriesId) {
  const cards = CARDS.filter((c) => c.series === series)
  const owned = cards.filter((c) => (s.collection[c.id] ?? 0) > 0).length
  return { owned, total: cards.length, percent: Math.round((owned / cards.length) * 100) }
}
