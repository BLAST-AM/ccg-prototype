'use client'

import confetti from 'canvas-confetti'
import gsap from 'gsap'
import type { Rarity } from './data'

const Z = 200

function origin(x: number, y: number) {
  return { x: x / window.innerWidth, y: y / window.innerHeight }
}

export function centerOf(el: Element | null) {
  if (!el) return { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  const r = el.getBoundingClientRect()
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 }
}

export function sparks(x: number, y: number, count = 8) {
  confetti({
    particleCount: count,
    spread: 70,
    startVelocity: 14,
    gravity: 0.9,
    ticks: 55,
    scalar: 0.45,
    shapes: ['circle'],
    colors: ['#fde68a', '#f59e0b', '#ffffff', '#fbbf24'],
    origin: origin(x, y),
    zIndex: Z,
    disableForReducedMotion: true,
  })
}

const RAINBOW = ['#ff0080', '#ffd000', '#00ffa6', '#00c8ff', '#a855f7']
const GOLD = ['#f59e0b', '#fde68a', '#fbbf24', '#ffffff', '#b45309']

export function rarityBurst(rarity: Rarity, x: number, y: number) {
  if (rarity === 'C') return
  const o = origin(x, y)
  if (rarity === 'R') {
    confetti({ particleCount: 18, spread: 50, startVelocity: 18, scalar: 0.6, ticks: 70, colors: ['#e5e7eb', '#ffffff', '#9ca3af'], origin: o, zIndex: Z, disableForReducedMotion: true })
    return
  }
  if (rarity === 'SR') {
    confetti({ particleCount: 40, spread: 80, startVelocity: 26, scalar: 0.7, ticks: 90, colors: ['#a855f7', '#c084fc', '#e9d5ff', '#ffffff'], origin: o, zIndex: Z, disableForReducedMotion: true })
    return
  }
  const colors = rarity === 'UR' ? GOLD : RAINBOW
  const count = rarity === 'UR' ? 180 : 110
  confetti({ particleCount: count, spread: 100, startVelocity: 42, scalar: 0.9, ticks: 160, colors, origin: o, zIndex: Z, disableForReducedMotion: true })
  confetti({ particleCount: count / 2, angle: 60, spread: 70, startVelocity: 55, colors, origin: { x: 0, y: 0.8 }, zIndex: Z, disableForReducedMotion: true })
  confetti({ particleCount: count / 2, angle: 120, spread: 70, startVelocity: 55, colors, origin: { x: 1, y: 0.8 }, zIndex: Z, disableForReducedMotion: true })
}

export function goldRain() {
  const end = Date.now() + 900
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: GOLD, zIndex: Z, disableForReducedMotion: true })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: GOLD, zIndex: Z, disableForReducedMotion: true })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}

export function dustPuff(x: number, y: number) {
  confetti({
    particleCount: 26,
    spread: 360,
    startVelocity: 10,
    gravity: -0.25,
    drift: 0.4,
    ticks: 90,
    scalar: 0.5,
    shapes: ['circle'],
    colors: ['#a855f7', '#c4b5fd', '#67e8f9', '#ffffff'],
    origin: origin(x, y),
    zIndex: Z,
    disableForReducedMotion: true,
  })
}

export function screenShake(intensity = 12) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const target = document.getElementById('tcg-shake-root')
  if (!target) return
  gsap
    .timeline()
    .to(target, { x: intensity, y: -intensity * 0.6, duration: 0.05 })
    .to(target, { x: -intensity, y: intensity * 0.5, duration: 0.05 })
    .to(target, { x: intensity * 0.6, y: intensity * 0.4, duration: 0.05 })
    .to(target, { x: -intensity * 0.4, y: -intensity * 0.3, duration: 0.05 })
    .to(target, { x: 0, y: 0, duration: 0.2, ease: 'elastic.out(1, 0.4)', clearProps: 'transform' })
}
