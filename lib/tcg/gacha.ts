import { CARDS, GOD_PACK_CHANCE, RARITY_META, RARITY_ORDER, rarityIndex, type CardDef, type Rarity, type SeriesId } from './data'

export type PackMode =
  | { kind: 'standard' }
  | { kind: 'rateup'; series: SeriesId }
  | { kind: 'exclusive'; series: SeriesId }

const GOD_WEIGHTS: [Rarity, number][] = [
  ['SR', 60],
  ['SSR', 30],
  ['UR', 10],
]

function random() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1)
    crypto.getRandomValues(buf)
    return buf[0] / 4294967296
  }
  return Math.random()
}

function weightedPick<T>(entries: [T, number][]): T {
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = random() * total
  for (const [value, weight] of entries) {
    roll -= weight
    if (roll < 0) return value
  }
  return entries[entries.length - 1][0]
}

function cardWeight(card: CardDef, mode: PackMode) {
  if (mode.kind === 'rateup') return card.series === mode.series ? 2 : 1
  if (mode.kind === 'exclusive') return card.series === mode.series ? 1 : 0
  return 1
}

function pickCard(rarity: Rarity, mode: PackMode) {
  const pool = CARDS.filter((c) => c.rarity === rarity)
    .map((c) => [c, cardWeight(c, mode)] as [CardDef, number])
    .filter(([, w]) => w > 0)
  return weightedPick(pool)
}

export function rollPack(mode: PackMode): { cards: CardDef[]; godPack: boolean } {
  const godPack = random() < GOD_PACK_CHANCE
  const rarityTable: [Rarity, number][] = godPack ? GOD_WEIGHTS : RARITY_ORDER.map((r) => [r, RARITY_META[r].rate])
  const cards = Array.from({ length: 5 }, () => pickCard(weightedPick(rarityTable), mode))
  cards.sort((a, b) => rarityIndex(a.rarity) - rarityIndex(b.rarity))
  return { cards, godPack }
}

export function coinFlip(): 'heads' | 'tails' {
  return random() < 0.5 ? 'heads' : 'tails'
}
