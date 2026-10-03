export type Rarity = 'C' | 'R' | 'SR' | 'SSR' | 'UR'
export type SeriesId = 'aether' | 'cyber' | 'demon' | 'celestial'
export type Element = 'Fire' | 'Water' | 'Lightning' | 'Shadow' | 'Light' | 'Wind'

export interface Series {
  id: SeriesId
  name: string
  tagline: string
  image: string
  colors: { sky: [string, string]; glow: string; accent: string }
}

export interface CardDef {
  id: string
  name: string
  series: SeriesId
  rarity: Rarity
  element: Element
  atk: number
  def: number
  lore: string
}

export const RARITY_ORDER: Rarity[] = ['C', 'R', 'SR', 'SSR', 'UR']

export const RARITY_META: Record<
  Rarity,
  {
    label: string
    name: string
    rate: number
    dupDust: number
    recycleDust: number
    craft: number
    color: string
  }
> = {
  C: { label: 'C', name: 'Common', rate: 50, dupDust: 5, recycleDust: 10, craft: 60, color: '#9ca3af' },
  R: { label: 'R', name: 'Rare', rate: 30, dupDust: 15, recycleDust: 25, craft: 150, color: '#e5e7eb' },
  SR: { label: 'SR', name: 'Epic', rate: 14, dupDust: 40, recycleDust: 60, craft: 400, color: '#c084fc' },
  SSR: { label: 'SSR', name: 'Legendary', rate: 5, dupDust: 100, recycleDust: 150, craft: 1000, color: '#f472b6' },
  UR: { label: 'UR', name: 'Ultra Rare', rate: 1, dupDust: 250, recycleDust: 400, craft: 2500, color: '#f59e0b' },
}

export const SERIES: Series[] = [
  {
    id: 'aether',
    name: 'Aether Knights',
    tagline: 'Sworn guardians of the floating bastions',
    image: './packs/aether-knights.png',
    colors: { sky: ['#1e3a8a', '#7dd3fc'], glow: '#e0f2fe', accent: '#38bdf8' },
  },
  {
    id: 'cyber',
    name: 'Cyber Void',
    tagline: 'Ghosts in the neon static',
    image: './packs/cyber-void.png',
    colors: { sky: ['#0f0a2e', '#db2777'], glow: '#22d3ee', accent: '#22d3ee' },
  },
  {
    id: 'demon',
    name: 'Demon Blade',
    tagline: 'Steel forged in the abyssal flame',
    image: './packs/demon-blade.png',
    colors: { sky: ['#1a0505', '#b91c1c'], glow: '#f87171', accent: '#ef4444' },
  },
  {
    id: 'celestial',
    name: 'Celestial Academy',
    tagline: 'Where the stars attend class',
    image: './packs/celestial-academy.png',
    colors: { sky: ['#1e1b4b', '#a855f7'], glow: '#fde68a', accent: '#f59e0b' },
  },
]

export const SERIES_BY_ID = Object.fromEntries(SERIES.map((s) => [s.id, s])) as Record<SeriesId, Series>

type RawCard = [string, Rarity, Element, string]

const RAW: Record<SeriesId, RawCard[]> = {
  aether: [
    ['Rowan Galeheart', 'C', 'Wind', 'Squire of the Ninth Bastion, still learning to ride the thermals without screaming.'],
    ['Lysa Cloudmere', 'C', 'Water', 'Weaves rain-veils to hide the sky fortresses from prying eyes below.'],
    ['Bram Ironwing', 'C', 'Wind', 'His mechanical wings creak, but they have never once failed him.'],
    ['Seraphine Vale', 'R', 'Light', 'A healer whose prayers turn sunlight into stitched armor.'],
    ['Kael Stormbrand', 'R', 'Lightning', 'He caught lightning in a bottle, then forged it into a blade.'],
    ['Orin Skyforge', 'SR', 'Fire', 'Master smith of the Aether Order. His anvil floats above the clouds.'],
    ['Aurelia, Zenith Lance', 'SSR', 'Light', 'Her lance pierced the eclipse itself. The sun still owes her a favor.'],
    ['Emperor Valerius', 'UR', 'Wind', 'Sovereign of all skies. When he breathes, the jet streams change course.'],
  ],
  cyber: [
    ['Glitch', 'C', 'Lightning', 'A rogue subroutine who learned to love. Mostly loves crashing servers.'],
    ['Nyx-07', 'C', 'Shadow', 'Courier of encrypted secrets through the rain-slick undercity.'],
    ['Kenji "Patch" Mori', 'R', 'Water', 'Fixes anything with liquid-cooled nanites and questionable firmware.'],
    ['Rei Hologram', 'R', 'Light', 'An idol who exists only as light. Her fans number in the billions.'],
    ['Vanta Protocol', 'SR', 'Shadow', 'A stealth AI that deletes itself from every camera it passes.'],
    ['Zero Kirin', 'SSR', 'Lightning', 'Netrunner legend. She once overclocked an entire city grid for fun.'],
    ['Null Empress Ayame', 'UR', 'Shadow', 'She rules the space between ones and zeroes, and the void obeys.'],
  ],
  demon: [
    ['Tetsuo Ashfang', 'C', 'Fire', 'A ronin whose blade smolders with embers that never cool.'],
    ['Mika Hollowstep', 'C', 'Shadow', 'Moves between footfalls. You only hear her after she is gone.'],
    ['Genji Redthorn', 'C', 'Fire', 'Trains beneath the burning maple, one thousand cuts per dawn.'],
    ['Suzume Kagerou', 'R', 'Wind', 'Her twin fans scatter crimson petals sharp enough to split stone.'],
    ['Raiden Onigiri', 'R', 'Lightning', 'Half-oni swordsman. Thunder follows his drawn steel.'],
    ['Akane Bloodlotus', 'SR', 'Fire', 'Heir to the Lotus Blade school. Her flames bloom like flowers.'],
    ['Shura, Thousand Cuts', 'SSR', 'Shadow', 'He sheathed his sword once. The mountain behind him fell an hour later.'],
    ['Kurogane, Abyss Blade', 'UR', 'Fire', 'The demon king reborn as steel. Whoever wields it is wielded in turn.'],
  ],
  celestial: [
    ['Pip Starling', 'C', 'Light', 'First-year student. Accidentally summoned a comet during roll call.'],
    ['Mira Moonquill', 'C', 'Water', 'Writes spells in tidal ink that only glows under the full moon.'],
    ['Elio Comet', 'R', 'Fire', 'Fastest flier in the academy, with the detention record to prove it.'],
    ['Luna Astraea', 'R', 'Water', 'Student council president. Her moonlight can freeze time for a heartbeat.'],
    ['Professor Orion', 'SR', 'Light', 'Teaches constellation combat. Has never once been late, or early.'],
    ['Stella Novaheart', 'SSR', 'Light', 'Valedictorian with a supernova heart. Handle with protective lenses.'],
    ['Celesse, Archon of Dawn', 'UR', 'Light', 'The academy headmistress. Every sunrise is her signature.'],
  ],
}

const PREFIX: Record<SeriesId, string> = { aether: 'AK', cyber: 'CV', demon: 'DB', celestial: 'CA' }

const STAT_RANGE: Record<Rarity, [number, number]> = {
  C: [800, 1500],
  R: [1400, 2100],
  SR: [2000, 2700],
  SSR: [2600, 3300],
  UR: [3200, 4000],
}

export function hashString(input: string) {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function seededRandom(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const CARDS: CardDef[] = SERIES.flatMap((series) =>
  RAW[series.id].map(([name, rarity, element, lore], index) => {
    const id = `${PREFIX[series.id]}-${String(index + 1).padStart(3, '0')}`
    const rand = seededRandom(hashString(id))
    const [min, max] = STAT_RANGE[rarity]
    const roll = () => Math.round((min + rand() * (max - min)) / 50) * 50
    return { id, name, series: series.id, rarity, element, atk: roll(), def: roll(), lore }
  }),
)

export const CARDS_BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c])) as Record<string, CardDef>

export const rarityIndex = (r: Rarity) => RARITY_ORDER.indexOf(r)

export const PACK_PRICES = { standard: 100, rateup: 250 } as const
export const FREE_PACK_COOLDOWN_MS = 10 * 60 * 1000
export const FREE_PACK_MAX = 10
export const GOD_PACK_CHANCE = 0.005

export const DAILY_REWARDS: { coins: number; dust: number; token?: number }[] = [
  { coins: 100, dust: 10 },
  { coins: 150, dust: 20 },
  { coins: 200, dust: 30 },
  { coins: 250, dust: 40 },
  { coins: 300, dust: 60 },
  { coins: 400, dust: 80 },
  { coins: 500, dust: 100, token: 1 },
]
