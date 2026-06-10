import * as THREE from 'three'

// Procedural leather texture sets, generated once per type at startup.
// Each type builds a heightfield, from which we derive a normal map
// (surface bumps), an albedo mottle (dye pooling darker in recesses),
// and a roughness map (high spots burnish shinier).
//
// Types follow the leathers used in western bootmaking:
//   calf    – classic pebbled full-grain calfskin
//   smooth  – box calf, nearly smooth dress leather
//   suede   – roughout / suede nap, matte and fuzzy
//   ostrich – full-quill ostrich, smooth skin with raised quill bumps
//   caiman  – caiman belly, armored rectangular scale tiles

const SIZE = 512

const cache = {}

function rng(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

function voronoiField(cells, rand) {
  const pts = []
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      pts.push([(gx + 0.15 + rand() * 0.7) / cells, (gy + 0.15 + rand() * 0.7) / cells])
    }
  }
  const height = new Float32Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE
      const v = y / SIZE
      const cx = Math.floor(u * cells)
      const cy = Math.floor(v * cells)
      let d1 = Infinity
      let d2 = Infinity
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const p = pts[((cy + oy + cells) % cells) * cells + ((cx + ox + cells) % cells)]
          let dx = Math.abs(p[0] - u)
          if (dx > 0.5) dx = 1 - dx
          let dy = Math.abs(p[1] - v)
          if (dy > 0.5) dy = 1 - dy
          const d = Math.hypot(dx, dy)
          if (d < d1) {
            d2 = d1
            d1 = d
          } else if (d < d2) {
            d2 = d
          }
        }
      }
      const ridge = Math.min((d2 - d1) * cells * 2.4, 1)
      height[y * SIZE + x] = Math.pow(ridge, 0.65) + (rand() - 0.5) * 0.06
    }
  }
  return height
}

function calfField() {
  return voronoiField(18, rng(7))
}

function smoothField() {
  const rand = rng(11)
  const h = new Float32Array(SIZE * SIZE)
  for (let i = 0; i < h.length; i++) h[i] = 0.5 + (rand() - 0.5) * 0.12
  return h
}

function suedeField() {
  // Dense fine fuzz: two scales of random noise.
  const rand = rng(23)
  const coarse = voronoiField(40, rng(29))
  const h = new Float32Array(SIZE * SIZE)
  for (let i = 0; i < h.length; i++) {
    h[i] = coarse[i] * 0.3 + 0.35 + (rand() - 0.5) * 0.5
  }
  return h
}

function ostrichField() {
  // Smooth skin with raised quill follicles in a loose jittered grid.
  const cells = 6
  const rand = rng(41)
  const quills = []
  for (let gy = 0; gy < cells; gy++) {
    for (let gx = 0; gx < cells; gx++) {
      if (rand() < 0.62) {
        quills.push([(gx + 0.25 + rand() * 0.5) / cells, (gy + 0.25 + rand() * 0.5) / cells])
      }
    }
  }
  const noise = rng(43)
  const h = new Float32Array(SIZE * SIZE)
  const r2 = 0.0016 // quill radius squared in uv space
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE
      const v = y / SIZE
      let bump = 0
      for (const q of quills) {
        let dx = Math.abs(q[0] - u)
        if (dx > 0.5) dx = 1 - dx
        let dy = Math.abs(q[1] - v)
        if (dy > 0.5) dy = 1 - dy
        const d2 = dx * dx + dy * dy
        if (d2 < r2 * 9) bump = Math.max(bump, Math.exp(-d2 / r2))
      }
      h[y * SIZE + x] = 0.18 + bump * 0.82 + (noise() - 0.5) * 0.05
    }
  }
  return h
}

function caimanField() {
  // Caiman belly: even rows of rectangular tile scales (brick-offset),
  // each scale gently domed with crinkling inside (bony deposits), one
  // follicle pore per scale, deep creases between scales, and uneven
  // per-scale dye take.
  const cols = 5
  const rows = 7
  const rand = rng(57)
  const rowPhase = []
  for (let r = 0; r < rows; r++) rowPhase.push((Math.floor(rand() * 3) * 0.5) / cols + rand() * 0.06)
  const cellTone = []
  const cellLift = []
  const poreU = []
  const poreV = []
  for (let i = 0; i < cols * rows; i++) {
    cellTone.push((rand() - 0.5) * 30)
    cellLift.push(0.82 + rand() * 0.22)
    poreU.push(0.3 + rand() * 0.4)
    poreV.push(0.22 + rand() * 0.3)
  }
  const crinkle = voronoiField(34, rng(63))
  const noise = rng(61)
  const h = new Float32Array(SIZE * SIZE)
  const tint = new Float32Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = y * SIZE + x
      const v = (y / SIZE) * rows
      const row = Math.floor(v) % rows
      const u = ((x / SIZE) + rowPhase[row]) * cols
      const col = ((Math.floor(u) % cols) + cols) % cols
      const lu = u - Math.floor(u)
      const lv = v - Math.floor(v)
      const ci = row * cols + col
      const eu = Math.min(1, Math.min(lu, 1 - lu) * 7)
      const ev = Math.min(1, Math.min(lv, 1 - lv) * 9)
      // product rounds the scale corners naturally
      const plateau = Math.pow(eu * ev, 0.4)
      const dome = 1 - ((lu - 0.5) ** 2 * 1.1 + (lv - 0.5) ** 2 * 0.7)
      let hh = plateau * dome * cellLift[ci]
      // crinkling inside the scale
      hh -= plateau * 0.16 * (1 - crinkle[i])
      // follicle pore
      const du = (lu - poreU[ci]) * 7
      const dv = (lv - poreV[ci]) * 9
      hh -= 0.5 * Math.exp(-(du * du + dv * dv) * 3.5) * plateau
      h[i] = Math.max(0, hh) + (noise() - 0.5) * 0.03
      tint[i] = cellTone[ci] * plateau
    }
  }
  return { h, tint }
}

const TYPE_PARAMS = {
  calf: { field: calfField, normalStrength: 1.7, toneBase: 205, toneRange: 46, roughDepth: 0.22 },
  smooth: { field: smoothField, normalStrength: 0.7, toneBase: 225, toneRange: 22, roughDepth: 0.1 },
  suede: { field: suedeField, normalStrength: 1.2, toneBase: 215, toneRange: 34, roughDepth: -0.08 },
  ostrich: { field: ostrichField, normalStrength: 2.4, toneBase: 230, toneRange: -38, roughDepth: 0.18 },
  caiman: { field: caimanField, normalStrength: 2.8, toneBase: 190, toneRange: 55, roughDepth: 0.4 },
}

function dataTexture(data, colorSpace = THREE.NoColorSpace) {
  const tex = new THREE.DataTexture(data, SIZE, SIZE)
  tex.colorSpace = colorSpace
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(0.35, 0.35)
  // DataTextures default to nearest/no-mipmap sampling, which bands badly.
  tex.magFilter = THREE.LinearFilter
  tex.minFilter = THREE.LinearMipmapLinearFilter
  tex.generateMipmaps = true
  tex.anisotropy = 4
  tex.needsUpdate = true
  return tex
}

export function getLeatherMaps(type = 'calf') {
  if (cache[type]) return cache[type]
  const params = TYPE_PARAMS[type] ?? TYPE_PARAMS.calf

  const fieldResult = params.field()
  const height = fieldResult instanceof Float32Array ? fieldResult : fieldResult.h
  const tintArr = fieldResult instanceof Float32Array ? null : fieldResult.tint
  const H = (x, y) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)]

  const albedo = new Uint8Array(SIZE * SIZE * 4)
  const normal = new Uint8Array(SIZE * SIZE * 4)
  const rough = new Uint8Array(SIZE * SIZE * 4)
  const mottleNoise = rng(91)

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      const h = H(x, y)

      const dx = (H(x + 1, y) - H(x - 1, y)) * params.normalStrength
      const dy = (H(x, y + 1) - H(x, y - 1)) * params.normalStrength
      const inv = 1 / Math.hypot(dx, dy, 1)
      normal[i] = (-dx * inv * 0.5 + 0.5) * 255
      normal[i + 1] = (-dy * inv * 0.5 + 0.5) * 255
      normal[i + 2] = (inv * 0.5 + 0.5) * 255
      normal[i + 3] = 255

      // Dye sits darker in the recesses (or on quill tops for ostrich,
      // where toneRange is negative), with per-scale variance when the
      // type provides it.
      const tone = Math.max(
        0,
        Math.min(
          255,
          params.toneBase +
            h * params.toneRange +
            (tintArr ? tintArr[y * SIZE + x] : 0) +
            (mottleNoise() - 0.5) * 10,
        ),
      )
      albedo[i] = tone
      albedo[i + 1] = tone
      albedo[i + 2] = tone
      albedo[i + 3] = 255

      // High spots burnish shinier (negative depth = high spots rougher).
      const r = 255 * Math.min(1, Math.max(0.4, 1 - params.roughDepth * h))
      rough[i] = r
      rough[i + 1] = r
      rough[i + 2] = r
      rough[i + 3] = 255
    }
  }

  cache[type] = {
    map: dataTexture(albedo, THREE.SRGBColorSpace),
    normalMap: dataTexture(normal),
    roughnessMap: dataTexture(rough),
  }
  return cache[type]
}
