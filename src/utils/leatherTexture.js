import * as THREE from 'three'

let cached = null

// Procedural leather grain: speckled noise on a canvas, used as a bump map.
export function leatherBumpTexture() {
  if (cached) return cached
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#808080'
  ctx.fillRect(0, 0, size, size)
  for (let i = 0; i < 14000; i++) {
    const v = 110 + Math.floor(Math.random() * 90)
    ctx.fillStyle = `rgb(${v},${v},${v})`
    const r = Math.random() < 0.15 ? 1.6 : 0.8
    ctx.beginPath()
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2)
    ctx.fill()
  }
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(0.6, 0.6)
  cached = tex
  return tex
}
