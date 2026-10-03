'use client'

import gsap from 'gsap'
import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export function TiltCard({
  children,
  enabled = true,
  max = 16,
  className,
}: {
  children: React.ReactNode
  enabled?: boolean
  max?: number
  className?: string
}) {
  const innerRef = useRef<HTMLDivElement>(null)
  const quick = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null)

  useEffect(() => {
    if (!enabled || !innerRef.current) return
    quick.current = {
      x: gsap.quickTo(innerRef.current, 'rotationX', { duration: 0.5, ease: 'power3.out' }),
      y: gsap.quickTo(innerRef.current, 'rotationY', { duration: 0.5, ease: 'power3.out' }),
    }
    return () => {
      quick.current = null
    }
  }, [enabled])

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = innerRef.current
    if (!enabled || !el || !quick.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const fx = (e.clientX - rect.left) / rect.width
    const fy = (e.clientY - rect.top) / rect.height
    const px = fx * 2 - 1
    const py = fy * 2 - 1
    quick.current.y(px * max)
    quick.current.x(-py * max)
    el.style.setProperty('--mx', `${fx * 100}%`)
    el.style.setProperty('--my', `${fy * 100}%`)
    el.style.setProperty('--px', px.toFixed(3))
    el.style.setProperty('--py', py.toFixed(3))
  }

  function handleLeave() {
    const el = innerRef.current
    if (!enabled || !el || !quick.current) return
    quick.current.x(0)
    quick.current.y(0)
    gsap.to(el, { '--mx': '50%', '--my': '50%', '--px': 0, '--py': 0, duration: 0.6, ease: 'power2.out' })
  }

  return (
    <div
      className={cn('[perspective:900px]', className)}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
    >
      <div ref={innerRef} className="card-vars preserve-3d will-change-transform">
        {children}
      </div>
    </div>
  )
}
