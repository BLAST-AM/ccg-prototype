'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' })
    } catch {
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
    camera.position.z = 8

    const count = 900
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const palette = [new THREE.Color('#f59e0b'), new THREE.Color('#a855f7'), new THREE.Color('#67e8f9'), new THREE.Color('#ffffff')]
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 26
      positions[i * 3 + 1] = (Math.random() - 0.5) * 18
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14
      const c = palette[Math.floor(Math.random() * palette.length)]
      colors.set([c.r, c.g, c.b], i * 3)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    const sprite = document.createElement('canvas')
    sprite.width = sprite.height = 64
    const ctx = sprite.getContext('2d')!
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.3, 'rgba(255,255,255,0.5)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, 64, 64)
    const texture = new THREE.CanvasTexture(sprite)

    const material = new THREE.PointsMaterial({
      size: 0.09,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    const mouse = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1
      mouse.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const resize = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let frame = 0
    const clock = new THREE.Clock()
    const tick = () => {
      const t = clock.getElapsedTime()
      points.rotation.y = t * 0.02
      points.rotation.x = Math.sin(t * 0.1) * 0.05
      camera.position.x += (mouse.x * 0.8 - camera.position.x) * 0.03
      camera.position.y += (-mouse.y * 0.5 - camera.position.y) * 0.03
      camera.lookAt(0, 0, 0)
      renderer.render(scene, camera)
      frame = requestAnimationFrame(tick)
    }
    if (reduced) renderer.render(scene, camera)
    else tick()

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(frame)
      else if (!reduced) tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVisibility)
      geometry.dispose()
      material.dispose()
      texture.dispose()
      renderer.dispose()
    }
  }, [])

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 -z-20 bg-[radial-gradient(ellipse_at_15%_0%,rgba(168,85,247,0.22),transparent_50%),radial-gradient(ellipse_at_90%_100%,rgba(245,158,11,0.14),transparent_50%)]"
        aria-hidden="true"
      />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 -z-10 h-full w-full" aria-hidden="true" />
    </>
  )
}
