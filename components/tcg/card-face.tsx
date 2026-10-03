import { Droplets, Flame, Moon, Sparkles, Sun, Wind, Zap, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { RARITY_META, SERIES_BY_ID, type CardDef, type Element } from '@/lib/tcg/data'
import { CardArt } from './card-art'

export const ELEMENT_ICON: Record<Element, LucideIcon> = {
  Fire: Flame,
  Water: Droplets,
  Lightning: Zap,
  Shadow: Moon,
  Light: Sun,
  Wind: Wind,
}

const AURA_PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  x: `${(i * 37) % 100}%`,
  s: `${2 + ((i * 7) % 4)}cqw`,
  d: `${3 + ((i * 13) % 30) / 10}s`,
  delay: `${(i * 0.43) % 3}s`,
}))

function Aura({ gold = false }: { gold?: boolean }) {
  return (
    <div className={cn('aura', gold && 'gold')} aria-hidden="true">
      {AURA_PARTICLES.map((p, i) => (
        <span
          key={i}
          style={{ '--x': p.x, '--s': p.s, '--d': p.d, '--delay': p.delay } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export function CardFace({ card, className }: { card: CardDef; className?: string }) {
  const meta = RARITY_META[card.rarity]
  const series = SERIES_BY_ID[card.series]
  const Icon = ELEMENT_ICON[card.element]
  const isHolo = card.rarity === 'SSR' || card.rarity === 'UR'
  const isUR = card.rarity === 'UR'

  return (
    <div
      className={cn(
        '@container relative aspect-[63/88] w-full select-none overflow-hidden rounded-[2px]',
        `frame-${card.rarity}`,
        card.rarity === 'C' && 'paper',
        className,
      )}
      role="img"
      aria-label={`${card.name}, ${meta.name} ${card.element} card from ${series.name}. ATK ${card.atk}, DEF ${card.def}.`}
    >
      <div
        className={cn(
          'absolute inset-[3.6cqw] flex flex-col overflow-hidden bg-[#0c1120] text-white rounded-[1px]',
          isUR && 'emboss',
        )}
      >
        <div className="flex items-center justify-between gap-[2cqw] px-[3.5cqw] pt-[3cqw] pb-[2cqw]">
          <span
            className={cn(
              'truncate font-display text-[6.6cqw] leading-none font-bold tracking-wide',
              isUR && 'text-amber-200',
            )}
          >
            {card.name}
          </span>
          <span
            className="flex size-[8cqw] shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25"
            title={card.element}
          >
            <Icon className="size-[5cqw]" />
          </span>
        </div>

        <div className="relative mx-[3cqw] aspect-[5/4] overflow-hidden ring-1 ring-white/20 rounded-[1px]">
          <CardArt card={card} />
        </div>

        <div className="flex items-center justify-between px-[3.5cqw] pt-[2.4cqw]">
          <span className="truncate text-[4.2cqw] font-medium tracking-wider text-white/60 uppercase">
            {series.name} · {card.element}
          </span>
          <span
            className="rounded-[1cqw] px-[2cqw] py-[0.6cqw] font-display text-[4.6cqw] leading-none font-bold"
            style={{ color: '#0b0f19', background: meta.color }}
          >
            {meta.label}
          </span>
        </div>

        <div className="relative flex-1 flex flex-col justify-center">
          <p className="line-clamp-3 px-[3.5cqw] pt-[1.8cqw] text-[4.1cqw] leading-snug text-white/75 italic text-pretty">
            {card.lore}
          </p>

          {isUR && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center -rotate-6">
              <span className="font-signature text-[9.5cqw] leading-none text-transparent bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-400 bg-clip-text drop-shadow-[0_2px_10px_rgba(245,158,11,1)]">
                {card.name}
              </span>
              <div className="mt-0.5 h-[1.8px] w-[70%] rounded-full bg-gradient-to-r from-transparent via-amber-300 to-transparent shadow-[0_0_8px_rgba(245,158,11,1)]" />
            </div>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-white/10 px-[3.5cqw] py-[2.4cqw] font-display">
          <span className="text-[4.8cqw]">
            <span className="text-rose-300">ATK</span> {card.atk}
          </span>
          <span className="text-[3.6cqw] text-white/40">{card.id}</span>
          <span className="text-[4.8cqw]">
            <span className="text-sky-300">DEF</span> {card.def}
          </span>
        </div>
      </div>

      {card.rarity === 'R' && <div className="sweep" aria-hidden="true" />}
      {card.rarity === 'SR' && (
        <>
          <div className="sweep" aria-hidden="true" />
          <Aura />
        </>
      )}
      {isHolo && <div className="holo" aria-hidden="true" />}
      {isHolo && <div className="glare" aria-hidden="true" />}
      {isUR && <Aura gold />}
    </div>
  )
}

export function CardBack({ className }: { className?: string }) {
  return (
    <div
      className={cn('@container card-back-frame relative aspect-[63/88] w-full overflow-hidden p-[3cqw] rounded-[2px]', className)}
      aria-hidden="true"
    >
      <div className="card-back relative flex h-full w-full flex-col items-center justify-center gap-[3cqw] rounded-[1px]">
        <div className="flex size-[34cqw] items-center justify-center rounded-full border-[1.2cqw] border-amber-400/70 bg-[#0b0f19]/70 shadow-[0_0_30px_rgba(168,85,247,0.6)]">
          <Sparkles className="size-[16cqw] text-amber-300" />
        </div>
        <span className="font-display text-[7cqw] font-bold tracking-[0.3em] text-amber-200/90">ARCANA</span>
      </div>
    </div>
  )
}
