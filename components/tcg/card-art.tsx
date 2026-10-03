import { memo } from 'react'
import { hashString, rarityIndex, seededRandom, SERIES_BY_ID, type CardDef, type Element } from '@/lib/tcg/data'

const ELEMENT_GLOW: Record<Element, string> = {
  Fire: '#fb923c',
  Water: '#38bdf8',
  Lightning: '#facc15',
  Shadow: '#c084fc',
  Light: '#fef3c7',
  Wind: '#6ee7b7',
}

const HAIR = ['#e5e7eb', '#1f2937', '#7c2d12', '#facc15', '#f472b6', '#38bdf8', '#a78bfa', '#dc2626', '#0f172a', '#fde68a']
const ARMOR = ['#334155', '#1e293b', '#4c1d95', '#7f1d1d', '#0c4a6e', '#3f3f46', '#713f12']

function spikes(rand: () => number, cx: number, cy: number, count: number, inner: number, outer: number, from: number, to: number) {
  const pts: string[] = []
  for (let i = 0; i <= count; i++) {
    const a = from + ((to - from) * i) / count
    const r1 = inner
    const r2 = outer * (0.75 + rand() * 0.45)
    const rad = (a * Math.PI) / 180
    const mid = ((a + (to - from) / count / 2) * Math.PI) / 180
    pts.push(`${cx + Math.cos(rad) * r1},${cy + Math.sin(rad) * r1}`)
    if (i < count) pts.push(`${cx + Math.cos(mid) * r2},${cy + Math.sin(mid) * r2}`)
  }
  return pts.join(' ')
}

function CardArtBase({ card, silhouette = false }: { card: CardDef; silhouette?: boolean }) {
  const rand = seededRandom(hashString(card.id + card.name))
  const series = SERIES_BY_ID[card.series]
  const glow = ELEMENT_GLOW[card.element]
  const hair = HAIR[Math.floor(rand() * HAIR.length)]
  const armor = ARMOR[Math.floor(rand() * ARMOR.length)]
  const tier = rarityIndex(card.rarity)
  const uid = card.id.replace(/[^a-z0-9]/gi, '')
  const sigilPoints = 5 + Math.floor(rand() * 4)
  const headTilt = (rand() - 0.5) * 8
  const longHair = rand() > 0.45
  const eyeColor = card.series === 'demon' ? '#f87171' : glow

  const bokeh = Array.from({ length: 10 }, () => ({
    x: rand() * 200,
    y: rand() * 160,
    r: 1 + rand() * (3 + tier),
    o: 0.2 + rand() * 0.5,
  }))

  return (
    <div
      className="absolute inset-0"
      style={silhouette ? { filter: 'brightness(0) saturate(0)', opacity: 0.55 } : undefined}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 200 160"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-[-6%] h-[112%] w-[112%]"
        style={{ transform: 'translate(calc(var(--px, 0) * -3%), calc(var(--py, 0) * -3%))' }}
      >
        <defs>
          <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={series.colors.sky[0]} />
            <stop offset="1" stopColor={series.colors.sky[1]} />
          </linearGradient>
          <radialGradient id={`burst-${uid}`} cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor={glow} stopOpacity="0.7" />
            <stop offset="1" stopColor={glow} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="200" height="160" fill={`url(#sky-${uid})`} />
        {card.series === 'cyber' &&
          Array.from({ length: 9 }, (_, i) => (
            <line key={i} x1={i * 25} y1="160" x2={100 + (i - 4) * 60} y2="90" stroke="#22d3ee" strokeOpacity="0.25" strokeWidth="0.6" />
          ))}
        {card.series === 'cyber' &&
          Array.from({ length: 5 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={110 + i * 12} x2="200" y2={110 + i * 12} stroke="#f472b6" strokeOpacity="0.2" strokeWidth="0.6" />
          ))}
        {card.series === 'demon' && <circle cx={150} cy={40} r={30} fill="#ef4444" opacity="0.55" />}
        {card.series === 'aether' &&
          [0, 1, 2].map((i) => (
            <ellipse key={i} cx={30 + i * 70 + rand() * 20} cy={130 - i * 6} rx={50} ry={14} fill="#ffffff" opacity={0.18 + i * 0.05} />
          ))}
        {(card.series === 'celestial' || card.series === 'aether') &&
          Array.from({ length: 20 }, (_, i) => <circle key={`s${i}`} cx={rand() * 200} cy={rand() * 90} r={rand() * 1.1 + 0.2} fill="#ffffff" opacity={0.7} />)}
        <circle cx="100" cy="72" r="70" fill={`url(#burst-${uid})`} />
        <polygon
          points={spikes(rand, 100, 72, sigilPoints * 2, 40, 62, 0, 360)}
          fill="none"
          stroke={glow}
          strokeOpacity="0.35"
          strokeWidth="1"
        />
        <circle cx="100" cy="72" r="48" fill="none" stroke={glow} strokeOpacity="0.4" strokeWidth="0.8" strokeDasharray="2 3" />
        {bokeh.map((b, i) => (
          <circle key={`b${i}`} cx={b.x} cy={b.y} r={b.r} fill={glow} opacity={b.o * 0.5} />
        ))}
        {card.series === 'demon' &&
          [0, 1].map((i) => (
            <line key={`sl${i}`} x1={20 + i * 30} y1={10} x2={180 - i * 20} y2={150} stroke="#fecaca" strokeOpacity="0.35" strokeWidth={1.4 - i * 0.6} />
          ))}
      </svg>

      <svg
        viewBox="0 0 200 160"
        preserveAspectRatio="xMidYMax slice"
        className="absolute inset-0 h-full w-full"
        style={{ transform: 'translate(calc(var(--px, 0) * 4%), calc(var(--py, 0) * 3%))' }}
      >
        <defs>
          <linearGradient id={`skin-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#3b3550" />
            <stop offset="1" stopColor="#14111f" />
          </linearGradient>
          <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={1.2 + tier * 0.4} result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {tier >= 3 && <ellipse cx="100" cy="95" rx="70" ry="60" fill={glow} opacity="0.18" filter={`url(#glow-${uid})`} />}

        <g transform={`rotate(${headTilt} 100 90)`}>
          {longHair && <path d="M66 70 Q60 120 70 150 L130 150 Q140 120 134 70 Z" fill={hair} opacity="0.95" />}
          <path d="M28 165 Q34 118 100 112 Q166 118 172 165 Z" fill={armor} stroke={glow} strokeOpacity="0.55" strokeWidth="1" />
          <path d="M62 140 L100 120 L138 140" fill="none" stroke={glow} strokeOpacity="0.5" strokeWidth="1.2" />
          <rect x="90" y="96" width="20" height="20" rx="4" fill="#1a1626" />
          <polygon points={spikes(rand, 100, 72, 9 + Math.floor(rand() * 4), 30, 46, 170, 370)} fill={hair} />
          <ellipse cx="100" cy="80" rx="25" ry="29" fill={`url(#skin-${uid})`} stroke={glow} strokeOpacity="0.6" strokeWidth="0.8" />
          <path
            d={`M74 70 L82 ${86 + rand() * 4} L88 68 L95 ${88 + rand() * 4} L100 66 L106 ${88 + rand() * 4} L112 68 L118 ${86 + rand() * 4} L126 70 Q118 50 100 50 Q82 50 74 70 Z`}
            fill={hair}
          />
          {card.series === 'cyber' ? (
            <rect x="80" y="82" width="40" height="7" rx="3.5" fill={eyeColor} filter={`url(#glow-${uid})`} opacity="0.95" />
          ) : (
            <g filter={`url(#glow-${uid})`}>
              <path d="M84 87 Q90 81 96 87 Q90 90 84 87 Z" fill={eyeColor} />
              <path d="M104 87 Q110 81 116 87 Q110 90 104 87 Z" fill={eyeColor} />
              <circle cx="91" cy="86" r="0.9" fill="#fff" />
              <circle cx="111" cy="86" r="0.9" fill="#fff" />
            </g>
          )}
          {card.series === 'demon' && (
            <g fill="#1c1917" stroke="#ef4444" strokeOpacity="0.7" strokeWidth="0.8">
              <path d="M80 58 Q70 40 74 28 Q80 44 88 54 Z" />
              <path d="M120 58 Q130 40 126 28 Q120 44 112 54 Z" />
            </g>
          )}
          {card.series === 'celestial' && (
            <ellipse cx="100" cy="40" rx="22" ry="5" fill="none" stroke="#fde68a" strokeWidth="2" filter={`url(#glow-${uid})`} />
          )}
          {card.series === 'aether' && (
            <g fill="#e0f2fe" opacity="0.85">
              <path d="M74 72 Q56 60 50 44 Q64 54 76 62 Z" />
              <path d="M126 72 Q144 60 150 44 Q136 54 124 62 Z" />
            </g>
          )}
        </g>
      </svg>
    </div>
  )
}

export const CardArt = memo(CardArtBase)
