import * as THREE from 'three'

// Procedural full-grain leather maps, generated once at startup. A
// jittered-grid Voronoi heightfield makes the pebbled grain (toroidal so
// it tiles seamlessly); from it we derive a normal map (surface bumps),
// an albedo mottle (dye pooling darker in the creases), and a roughness
// map (pebble tops polish up shinier than the valleys).

const SIZE = 512
const CELLS = 18

let cache = null

function buildHeightField() {
  const pts = []
  for (let gy = 0; gy < CELLS; gy++) {
    for (let gx = 0; gx < CELLS; gx++) {
      pts.push([
        (gx + 0.15 + Math.random() * 0.7) / CELLS,
        (gy + 0.15 + Math.random() * 0.7) / CELLS,
      ])
    }
  }
  const height = new Float32Array(SIZE * SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = x / SIZE
      const v = y / SIZE
      const cx = Math.floor(u * CELLS)
      const cy = Math.floor(v * CELLS)
      let d1 = Infinity
      let d2 = Infinity
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const p = pts[((cy + oy + CELLS) % CELLS) * CELLS + ((cx + ox + CELLS) % CELLS)]
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
      const ridge = Math.min((d2 - d1) * CELLS * 2.4, 1)
      height[y * SIZE + x] = Math.pow(ridge, 0.65) + (Math.random() - 0.5) * 0.06
    }
  }
  return height
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

export function getLeatherMaps() {
  if (cache) return cache

  const height = buildHeightField()
  const H = (x, y) => height[((y + SIZE) % SIZE) * SIZE + ((x + SIZE) % SIZE)]

  const albedo = new Uint8Array(SIZE * SIZE * 4)
  const normal = new Uint8Array(SIZE * SIZE * 4)
  const rough = new Uint8Array(SIZE * SIZE * 4)
  const strength = 1.7

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4
      const h = H(x, y)

      const dx = (H(x + 1, y) - H(x - 1, y)) * strength
      const dy = (H(x, y + 1) - H(x, y - 1)) * strength
      const inv = 1 / Math.hypot(dx, dy, 1)
      normal[i] = (-dx * inv * 0.5 + 0.5) * 255
      normal[i + 1] = (-dy * inv * 0.5 + 0.5) * 255
      normal[i + 2] = (inv * 0.5 + 0.5) * 255
      normal[i + 3] = 255

      // Dye sits darker in the creases, lighter on the pebble tops.
      const tone = Math.max(0, Math.min(255, 205 + h * 46 + (Math.random() - 0.5) * 10))
      albedo[i] = tone
      albedo[i + 1] = tone
      albedo[i + 2] = tone
      albedo[i + 3] = 255

      // Pebble tops burnish slightly shinier than the valleys.
      const r = 255 * (1 - 0.22 * h)
      rough[i] = r
      rough[i + 1] = r
      rough[i + 2] = r
      rough[i + 3] = 255
    }
  }

  cache = {
    map: dataTexture(albedo, THREE.SRGBColorSpace),
    normalMap: dataTexture(normal),
    roughnessMap: dataTexture(rough),
  }
  return cache
}
