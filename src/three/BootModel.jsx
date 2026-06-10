import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { heelById, threadById } from '../data/presets'
import { useBootMaterials } from './materials'

// Procedural placeholder boot, built from side-profile shapes extruded
// across the boot's width. Dimensions are roughly in inches. Each part is
// a separate mesh so leathers can be swapped independently — the same part
// names the real commissioned .glb model should use.

// A large bevel with a negative bevelOffset rounds the cross-section
// (less boxy) while keeping the side silhouette close to the drawn
// profile: the body is inset and the bevel swells back out to the
// original outline.
function extrudeProfile(shape, width, bevel, { smooth = false, inset = 0 } = {}) {
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
    // Extrusions are flat-shaded by default; weld vertices and recompute
    // normals so curved leather surfaces shade smoothly.
    geo.deleteAttribute('normal')
    geo = mergeVertices(geo)
    geo.computeVertexNormals()
  }
  geo.translate(0, 0, -depth / 2)
  return geo
}

// The sole arches: flat on the ground from toe to ball (x ≈ 5.5), then
// rises toward the rear where the heel block (heelH tall) meets the
// ground. So taller heels raise the back of the boot while the toe stays
// planted, like a real boot.
function footShape(toe, heelH) {
  const s = new THREE.Shape()
  s.moveTo(0.25, heelH + 0.5)
  s.lineTo(0.45, heelH + 3.6)
  s.quadraticCurveTo(2.2, heelH * 0.5 + 4.7, 3.9, 4.0)
  s.quadraticCurveTo(5.6, 3.0, 7.2, 1.9)
  if (toe === 'snip') {
    s.quadraticCurveTo(9.6, 1.05, 11.0, 0.62)
    s.lineTo(11.0, 0.5)
  } else if (toe === 'square') {
    s.quadraticCurveTo(9.2, 1.15, 10.0, 1.05)
    s.quadraticCurveTo(10.45, 1.0, 10.45, 0.5)
  } else {
    s.quadraticCurveTo(9.4, 1.2, 10.2, 0.95)
    s.quadraticCurveTo(10.7, 0.8, 10.7, 0.5)
  }
  s.lineTo(5.5, 0.5)
  s.quadraticCurveTo(2.6, heelH * 0.35 + 0.5, 0.25, heelH + 0.5)
  return s
}

function soleShape(toe, heelH) {
  const tip = toe === 'snip' ? 11.15 : toe === 'square' ? 10.6 : 10.85
  const s = new THREE.Shape()
  s.moveTo(-0.15, heelH)
  s.lineTo(-0.15, heelH + 0.55)
  s.quadraticCurveTo(2.6, heelH * 0.35 + 0.55, 5.5, 0.55)
  s.lineTo(tip, 0.55)
  s.lineTo(tip, 0)
  s.lineTo(5.5, 0)
  s.quadraticCurveTo(2.6, heelH * 0.35, -0.15, heelH)
  return s
}

function shaftShape(height) {
  const top = 0.5 + height
  const s = new THREE.Shape()
  // The bottom edge tucks below the vamp's top edge so no seam gap shows.
  s.moveTo(0.15, 2.9)
  s.lineTo(-0.15, top)
  s.quadraticCurveTo(2.5, top + 0.5, 5.15, top)
  s.lineTo(4.85, 3.0)
  s.quadraticCurveTo(2.5, 4.1, 0.15, 2.9)
  return s
}

function heelShape(height) {
  const s = new THREE.Shape()
  s.moveTo(0.1, height + 0.1)
  s.quadraticCurveTo(1.5, height * 0.7 + 0.1, 2.6, height * 0.55 + 0.1)
  s.lineTo(2.25, 0)
  s.quadraticCurveTo(1.35, -0.06, 0.5, 0)
  s.lineTo(0.1, height + 0.1)
  return s
}

// Wavy "flame" stitch line running up the shaft.
function flameCurve(cx, baseY, topY, amp, phase) {
  const pts = []
  const n = 16
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const y = baseY + (topY - baseY) * t
    const x = cx + Math.sin(t * Math.PI * 3 + phase) * amp * (1 - t * 0.5)
    pts.push(new THREE.Vector3(x, y, 0))
  }
  return new THREE.CatmullRomCurve3(pts)
}

// The rounded shaft's flat side face is inset from the profile outline,
// so stitching has to stay inside roughly x 0.8–4.2 and below top - 0.9.
function stitchGeometries(shaftHeight) {
  const top = 0.5 + shaftHeight
  const geos = []
  const flames = [
    flameCurve(1.5, 4.8, top - 1.5, 0.35, 0),
    flameCurve(2.55, 4.6, top - 1.3, 0.4, Math.PI / 2),
    flameCurve(3.6, 4.8, top - 1.5, 0.35, Math.PI),
  ]
  for (const c of flames) geos.push(new THREE.TubeGeometry(c, 48, 0.055, 6))
  // Collar rows near the top opening.
  for (const y of [top - 1.0, top - 1.25]) {
    const row = new THREE.LineCurve3(
      new THREE.Vector3(0.9, y, 0),
      new THREE.Vector3(4.15, y, 0),
    )
    geos.push(new THREE.TubeGeometry(row, 2, 0.05, 6))
  }
  return geos
}

// Turns an imported pattern image (black-on-white line art works best)
// into a thread-colored transparent decal texture.
function useStitchDecalTexture(dataUrl, threadColor) {
  const [tex, setTex] = useState(null)
  useEffect(() => {
    if (!dataUrl) {
      setTex(null)
      return undefined
    }
    let cancelled = false
    let texture = null
    const img = new Image()
    img.onload = () => {
      if (cancelled) return
      const S = 512
      const canvas = document.createElement('canvas')
      canvas.width = S
      canvas.height = S
      const ctx = canvas.getContext('2d')
      const scale = Math.min(S / img.width, S / img.height)
      const w = img.width * scale
      const h = img.height * scale
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2, w, h)
      const px = ctx.getImageData(0, 0, S, S)
      const d = px.data
      const col = new THREE.Color(threadColor)
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255
        const alpha = (1 - lum) * (d[i + 3] / 255)
        d[i] = col.r * 255
        d[i + 1] = col.g * 255
        d[i + 2] = col.b * 255
        d[i + 3] = alpha * 255
      }
      ctx.putImageData(px, 0, 0)
      texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      setTex(texture)
    }
    img.src = dataUrl
    return () => {
      cancelled = true
      texture?.dispose()
    }
  }, [dataUrl, threadColor])
  return tex
}

const SHAFT_WIDTH = 3.7

export default function BootModel({ design }) {
  const materials = useBootMaterials(design)
  const heelHeight = heelById(design.heelStyle).height
  const decalTex = useStitchDecalTexture(
    design.stitchPattern,
    threadById(design.thread).color,
  )

  const geos = useMemo(() => {
    return {
      vamp: extrudeProfile(footShape(design.toe, heelHeight), 3.5, 0.8, {
        smooth: true,
        inset: 0.45,
      }),
      sole: extrudeProfile(soleShape(design.toe, heelHeight), 3.8, 0.25, { inset: 0.1 }),
      shaft: extrudeProfile(shaftShape(design.shaftHeight), SHAFT_WIDTH, 0.95, {
        smooth: true,
        inset: 0.95,
      }),
      heel: extrudeProfile(heelShape(heelHeight), 3.3, 0.3, { inset: 0.2 }),
      stitches: stitchGeometries(design.shaftHeight),
    }
  }, [design.toe, design.shaftHeight, heelHeight])

  useEffect(() => {
    return () => {
      geos.vamp.dispose()
      geos.sole.dispose()
      geos.shaft.dispose()
      geos.heel.dispose()
      geos.stitches.forEach((g) => g.dispose())
    }
  }, [geos])

  const top = 0.5 + design.shaftHeight
  const stitchZ = SHAFT_WIDTH / 2 + 0.03
  const decalBottom = 4.9
  const decalTop = top - 1.5
  const decalCenter = (decalBottom + decalTop) / 2
  const decalHeight = Math.max(decalTop - decalBottom, 1)

  return (
    <group position={[-5.2, 0, 0]}>
      <mesh geometry={geos.shaft} material={materials.shaft} castShadow receiveShadow />
      <mesh geometry={geos.vamp} material={materials.vamp} castShadow receiveShadow />
      <mesh geometry={geos.sole} material={materials.heel} castShadow receiveShadow />
      <mesh geometry={geos.heel} material={materials.heel} castShadow receiveShadow />
      {decalTex
        ? [1, -1].map((side) => (
            <mesh
              key={side}
              position={[2.5, decalCenter, side * stitchZ]}
              rotation={[0, side === 1 ? 0 : Math.PI, 0]}
            >
              <planeGeometry args={[3.1, decalHeight]} />
              <meshStandardMaterial
                map={decalTex}
                transparent
                roughness={0.85}
                depthWrite={false}
              />
            </mesh>
          ))
        : [stitchZ, -stitchZ].map((z) =>
            geos.stitches.map((g, i) => (
              <mesh
                key={`${z}-${i}`}
                geometry={g}
                material={materials.thread}
                position={[0, 0, z]}
              />
            )),
          )}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          material={materials.straps}
          position={[2.5, top - 1.7, side * (SHAFT_WIDTH / 2 + 0.05)]}
          castShadow
        >
          <boxGeometry args={[0.95, 1.7, 0.18]} />
        </mesh>
      ))}
    </group>
  )
}
