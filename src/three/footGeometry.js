import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'

// Pure geometry builders for the placeholder boot's foot, sole, and heel.
// The foot is a lofted "last" volume: at every station along its length we
// sweep a superellipse cross-section whose width follows the footprint
// outline and whose crown follows the instep profile — giving a genuinely
// rounded foot. The welt and outsole are the footprint outline extruded
// vertically and draped over the arch, so the sole edge wraps the whole
// boot, toe included. Dimensions are roughly in inches.

export function extrudeProfile(shape, width, bevel, { smooth = false, inset = 0 } = {}) {
  const depth = width - bevel * 2
  let geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -inset,
    bevelSegments: 6,
    curveSegments: 24,
  })
  if (smooth) {
    geo.deleteAttribute('normal')
    geo = mergeVertices(geo)
    geo.computeVertexNormals()
  }
  geo.translate(0, 0, -depth / 2)
  return geo
}

export function toeTip(toe) {
  return toe === 'snip' ? 11.0 : toe === 'square' ? 10.45 : 10.6
}

// How much the sole rises from the ground toward the heel: flat from the
// toe to the ball (x ≈ 5.5), then a quadratic arch up to the heel seat.
export function archLift(x, heelH) {
  const f = Math.min(1, Math.max(0, (5.5 - x) / 5.65))
  return heelH * f * f
}

function smoothstep(t) {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

// Footprint half-width along the boot, with toe-shape variants.
function halfWidth(x, toe) {
  const tip = toeTip(toe)
  if (x <= 0.55) {
    // rounded heel seat
    const t = (x + 0.15) / 0.7
    return 1.52 * Math.sqrt(Math.max(0.001, 1 - (1 - t) ** 2))
  }
  const ballX = 6.2
  const ballW = 1.74
  if (x <= ballX) {
    // gentle waist between heel seat and ball
    const t = (x - 0.55) / (ballX - 0.55)
    return 1.55 + (ballW - 1.55) * smoothstep(t) - 0.04 * Math.sin(t * Math.PI)
  }
  const t = Math.min(1, (x - ballX) / (tip - ballX))
  const endW = toe === 'square' ? 1.0 : toe === 'snip' ? 0.24 : 0.62
  const w = ballW + (endW - ballW) * smoothstep(t)
  if (toe !== 'square' && t > 0.84) {
    const tt = (t - 0.84) / 0.16
    return w * Math.sqrt(Math.max(0.002, 1 - tt * tt * 0.98))
  }
  return w
}

// Height of the foot's crown above its base, along the length.
function crownHeight(x, toe, tip) {
  const rear = 3.3
  if (x < 1.0) {
    const t = (x + 0.15) / 1.15
    return rear * (0.62 + 0.38 * Math.sqrt(Math.max(0, 1 - (1 - t) ** 2)))
  }
  if (x < 4.2) return rear
  const t = Math.min(1, (x - 4.2) / (tip - 4.2))
  const toeH = toe === 'square' ? 0.95 : toe === 'snip' ? 0.7 : 0.85
  return rear + (toeH - rear) * smoothstep(t)
}

// Cross-section roundness: fuller through the ankle (so the shaft tube
// tucks in), easing to a rounded oval at the toe; square toes get boxier
// (but still round-cornered) toward the tip.
function sectionExponent(x, toe, tip) {
  let p = 3.1 - 0.7 * smoothstep((x - 3.5) / 3.0)
  const t = smoothstep((x - (tip - 3.2)) / 3.2)
  if (toe === 'square') p += 2.4 * t
  if (toe === 'snip') p -= 0.5 * t
  return p
}

export function buildFootGeometry(toe, heelH) {
  const tip = toeTip(toe)
  const NS = 64 // stations along the length
  const NK = 24 // points across each section
  const positions = []
  const uvs = []
  const indices = []
  for (let i = 0; i <= NS; i++) {
    const x = -0.15 + (tip + 0.15) * (i / NS)
    const w = Math.max(0.04, halfWidth(x, toe))
    const baseY = archLift(x, heelH) + 0.48
    const crown = crownHeight(x, toe, tip)
    const p = sectionExponent(x, toe, tip)
    for (let k = 0; k <= NK; k++) {
      const s = (k / NK) * 2 - 1
      const z = w * s
      const y =
        baseY + crown * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(s), p)), 1 / p)
      positions.push(x, y, z)
      uvs.push(x, s * 2.4)
    }
  }
  for (let i = 0; i < NS; i++) {
    for (let k = 0; k < NK; k++) {
      const a = i * (NK + 1) + k
      const b = a + NK + 1
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

// Footprint outline in the XZ plane, outset for the welt/outsole overhang.
function footprintShape(toe, outset) {
  const tip = toeTip(toe)
  const M = 56
  const s = new THREE.Shape()
  for (let i = 0; i <= M; i++) {
    const x = -0.15 + (tip + 0.15) * (i / M)
    const w = halfWidth(x, toe) + outset
    if (i === 0) s.moveTo(x - outset, w * 0.2)
    else s.lineTo(x + (i === M ? outset : 0), w)
  }
  for (let i = M; i >= 0; i--) {
    const x = -0.15 + (tip + 0.15) * (i / M)
    const w = halfWidth(x, toe) + outset
    s.lineTo(x + (i === M ? outset : 0), -w)
  }
  s.lineTo(-0.15 - outset, -halfWidth(-0.15 + 0.001, toe) * 0.2)
  return s
}

// A slab of sole following the footprint, draped over the arch so it rims
// the entire boot — including the front of the toe.
export function buildSoleSlab(toe, heelH, outset, y0, y1) {
  const geo = new THREE.ExtrudeGeometry(footprintShape(toe, outset), {
    depth: y1 - y0,
    bevelEnabled: false,
    curveSegments: 8,
  })
  geo.rotateX(-Math.PI / 2)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) + y0 + archLift(pos.getX(i), heelH))
  }
  geo.computeVertexNormals()
  return geo
}

// A real western heel is a stack of leather lifts: horizontal layers up
// to where the heel meets the arch, a wedge tucking under the sole, and
// a dark top-lift cap on the ground.
export function buildHeelStack(heelH) {
  const stackTop = 0.55 * heelH + 0.1
  const xBack = (y) => 0.5 - (0.4 * y) / (heelH + 0.1)
  const xFront = (y) => 2.25 + 0.35 * Math.min(1, y / (0.55 * heelH))
  const lifts = []
  const count = Math.max(3, Math.round(stackTop / 0.27))
  for (let i = 0; i < count; i++) {
    const y0 = (stackTop * i) / count
    const y1 = (stackTop * (i + 1)) / count + 0.012
    const s = new THREE.Shape()
    s.moveTo(xBack(y0), y0)
    s.lineTo(xFront(y0), y0)
    s.lineTo(xFront(y1), y1)
    s.lineTo(xBack(y1), y1)
    s.lineTo(xBack(y0), y0)
    lifts.push(extrudeProfile(s, 2.9 - (i % 2) * 0.05, 0.05))
  }
  const w = new THREE.Shape()
  w.moveTo(0.1, heelH + 0.1)
  w.quadraticCurveTo(1.5, heelH * 0.78 + 0.1, 2.6, stackTop)
  w.lineTo(xBack(stackTop), stackTop)
  w.lineTo(0.1, heelH + 0.1)
  return { lifts, wedge: extrudeProfile(w, 2.95, 0.15) }
}
