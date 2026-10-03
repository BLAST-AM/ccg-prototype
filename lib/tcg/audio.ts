'use client'

import { Howl, Howler } from 'howler'

const SAMPLE_RATE = 22050

type SoundName =
  | 'tear'
  | 'rip'
  | 'slide'
  | 'thud'
  | 'chimeR'
  | 'chimeSR'
  | 'chimeSSR'
  | 'chimeUR'
  | 'god'
  | 'coinFlip'
  | 'coinLand'
  | 'win'
  | 'lose'
  | 'stamp'
  | 'click'
  | 'dust'

function render(duration: number, fn: (t: number) => number) {
  const length = Math.floor(duration * SAMPLE_RATE)
  const out = new Float32Array(length)
  for (let i = 0; i < length; i++) out[i] = fn(i / SAMPLE_RATE)
  return out
}

function toWavDataUri(samples: Float32Array) {
  const buffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(buffer)
  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i))
  }
  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, SAMPLE_RATE, true)
  view.setUint32(28, SAMPLE_RATE * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, samples.length * 2, true)
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(44 + i * 2, s * 0x7fff, true)
  }
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return `data:audio/wav;base64,${btoa(binary)}`
}

const noise = () => Math.random() * 2 - 1
const tone = (freq: number, t: number) => Math.sin(2 * Math.PI * freq * t)

function bell(notes: number[], spacing: number, decay: number, duration: number, sparkle = 0) {
  return render(duration, (t) => {
    let v = 0
    notes.forEach((f, i) => {
      const start = i * spacing
      if (t < start) return
      const lt = t - start
      const env = Math.exp(-lt * decay) * Math.min(1, lt * 200)
      v += (tone(f, lt) * 0.6 + tone(f * 2.01, lt) * 0.25 + tone(f * 3.98, lt) * 0.1) * env
    })
    if (sparkle) v += tone(4200 + Math.sin(t * 40) * 800, t) * Math.exp(-t * 3) * sparkle * (Math.random() > 0.7 ? 1 : 0.2)
    return v * 0.35
  })
}

function synthesize(name: SoundName): Float32Array {
  switch (name) {
    case 'tear': {
      let prev = 0
      return render(0.18, (t) => {
        const crackle = Math.random() > 0.82 ? noise() : noise() * 0.25
        const hp = crackle - prev * 0.6
        prev = crackle
        return hp * Math.exp(-t * 14) * 0.55
      })
    }
    case 'rip': {
      let prev = 0
      return render(0.55, (t) => {
        const n = Math.random() > 0.7 ? noise() : noise() * 0.35
        const hp = n - prev * 0.5
        prev = n
        const env = Math.min(1, t * 60) * Math.exp(-t * 5)
        return (hp * 0.6 + tone(900 - t * 1200, t) * 0.05) * env
      })
    }
    case 'slide': {
      let lp = 0
      return render(0.5, (t) => {
        lp += (noise() - lp) * (0.08 + t * 0.4)
        return lp * Math.sin(Math.PI * (t / 0.5)) * 1.6
      })
    }
    case 'thud':
    case 'stamp': {
      return render(0.45, (t) => {
        const f = 90 * Math.exp(-t * 6) + 38
        const body = Math.sin(2 * Math.PI * f * t) * Math.exp(-t * 9)
        const click = noise() * Math.exp(-t * 90) * 0.5
        return (body * 0.9 + click) * (name === 'stamp' ? 0.9 : 0.75)
      })
    }
    case 'chimeR':
      return bell([880, 1318.5], 0.08, 6, 0.8)
    case 'chimeSR':
      return bell([659.3, 987.8, 1318.5], 0.08, 5, 1.0, 0.2)
    case 'chimeSSR':
      return bell([523.3, 659.3, 783.99, 1046.5], 0.09, 4, 1.3, 0.35)
    case 'chimeUR':
      return bell([523.3, 659.3, 783.99, 1046.5, 1318.5, 1568], 0.08, 3, 1.8, 0.5)
    case 'god':
      return render(1.8, (t) => {
        let v = 0
        ;[261.6, 329.6, 392, 523.3, 659.3].forEach((f, i) => {
          const lfo = 1 + Math.sin(t * (5 + i)) * 0.004
          v += tone(f * lfo, t) * (0.18 - i * 0.02)
        })
        const env = Math.min(1, t * 1.5) * Math.exp(-Math.max(0, t - 1.1) * 4)
        const shimmer = tone(2093 + Math.sin(t * 30) * 300, t) * 0.05 * Math.random()
        return (v + shimmer) * env * 0.8
      })
    case 'coinFlip':
      return render(0.25, (t) => {
        const ring = tone(2600, t) * 0.4 + tone(3900, t) * 0.25 + tone(5200, t) * 0.12
        return ring * Math.exp(-t * 18) * 0.5
      })
    case 'coinLand':
      return render(0.6, (t) => {
        const bounce = [0, 0.12, 0.2].reduce((acc, start, i) => {
          if (t < start) return acc
          const lt = t - start
          return acc + (tone(1800, lt) * 0.4 + tone(2700, lt) * 0.3) * Math.exp(-lt * 22) * (1 - i * 0.3)
        }, 0)
        return bounce * 0.45
      })
    case 'win':
      return bell([783.99, 987.8, 1174.7, 1568, 1975.5], 0.06, 4, 1.3, 0.4)
    case 'lose':
      return render(0.7, (t) => {
        const f = 220 - t * 120
        return (tone(f, t) * 0.5 + tone(f * 1.5, t) * 0.2) * Math.exp(-t * 4) * 0.5
      })
    case 'click':
      return render(0.05, (t) => (tone(1600, t) * 0.5 + noise() * 0.2) * Math.exp(-t * 120) * 0.4)
    case 'dust': {
      let lp = 0
      return render(0.9, (t) => {
        lp += (noise() - lp) * (0.6 - t * 0.5)
        const env = Math.sin(Math.PI * Math.min(1, t / 0.9))
        return (lp * 0.5 + tone(1200 + t * 2400, t) * 0.04) * env
      })
    }
  }
}

const cache = new Map<SoundName, Howl>()

function getHowl(name: SoundName) {
  let howl = cache.get(name)
  if (!howl) {
    howl = new Howl({ src: [toWavDataUri(synthesize(name))], format: ['wav'], volume: 0.7 })
    cache.set(name, howl)
  }
  return howl
}

export function playSound(name: SoundName, opts: { rate?: number; volume?: number } = {}) {
  if (typeof window === 'undefined') return
  try {
    const howl = getHowl(name)
    const id = howl.play()
    if (opts.rate) howl.rate(opts.rate, id)
    if (opts.volume !== undefined) howl.volume(opts.volume, id)
  } catch {}
}

export function setAudioMuted(muted: boolean) {
  if (typeof window === 'undefined') return
  Howler.mute(muted)
}

export const RARITY_CHIME: Record<string, SoundName | null> = {
  C: null,
  R: 'chimeR',
  SR: 'chimeSR',
  SSR: 'chimeSSR',
  UR: 'chimeUR',
}
