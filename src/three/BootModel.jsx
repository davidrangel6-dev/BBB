import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { heelById, leatherById, threadById } from '../data/presets'
import { getLeatherMaps } from './leatherMaps'
import { useBootMaterials } from './materials'

// Procedural placeholder boot. The shaft is a true elliptical cylinder
// (hollow tube with a flared top and bound collar), the foot is a
// side-profile extrusion with rounded edges. Dimensions are roughly in
// inches. Each part is a separate mesh so leathers swap independently.

// Shaft tube dimensions (centered on the ankle at x = 2.5).
const SHAFT_CX = 2.5
const SHAFT_BOTTOM = 2.8
const SHAFT_RX_TOP = 2.7 // front-back radius at the opening
const SHAFT_RX_BOT = 2.55
const SHAFT_RZ_TOP = 1.95 // side-to-side radius at the opening
const SHAFT_RZ_BOT = 1.83

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
    geo.deleteAttribute('normal')
    geo = mergeVertices(geo)
    geo.computeVertexNormals()
  }
  geo.translate(0, 0, -depth / 2)
  return geo
}

// Cylinder UVs span 0–1 around the tube; rescale them to inch-space so
// the leather grain matches the extruded parts.
function tubeGeometry(cylHeight) {
  const geo = new THREE.CylinderGeometry(
    1,
    SHAFT_RX_BOT / SHAFT_RX_TOP,
    cylHeight,
    64,
    1,
    true,
  )
  const uv = geo.attributes.uv
  const circumference = Math.PI * (SHAFT_RX_TOP + SHAFT_RZ_TOP)
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * circumference, uv.getY(i) * cylHeight)
  }
  return geo
}

// The sole arches: flat on the ground from toe to ball (x ≈ 5.5), then
// rises toward the rear where the heel block meets the ground.
function footShape(toe, heelH) {
  const s = new THREE.Shape()
  s.moveTo(0.25, heelH + 0.5)
  s.lineTo(0.45, heelH + 3.3)
  s.quadraticCurveTo(2.2, heelH * 0.5 + 4.4, 3.9, 4.0)
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

// A real western heel is a stack of leather lifts: horizontal layers up
// to where the heel meets the arch, a wedge tucking under the sole, and
// a dark top-lift cap on the ground.
function heelStack(heelH) {
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
    // Alternate widths a hair so the stack reads as individual layers.
    lifts.push(extrudeProfile(s, 3.28 - (i % 2) * 0.05, 0.05))
  }
  const w = new THREE.Shape()
  w.moveTo(0.1, heelH + 0.1)
  w.quadraticCurveTo(1.5, heelH * 0.78 + 0.1, 2.6, stackTop)
  w.lineTo(xBack(stackTop), stackTop)
  w.lineTo(0.1, heelH + 0.1)
  return { lifts, wedge: extrudeProfile(w, 3.3, 0.15) }
}

// Depth (z) of the shaft tube's surface at a given x, so stitching can
// hug the curved leather instead of floating beside it.
function shaftSurfaceZ(x) {
  const a = (SHAFT_RX_TOP + SHAFT_RX_BOT) / 2
  const b = (SHAFT_RZ_TOP + SHAFT_RZ_BOT) / 2
  const t = (x - SHAFT_CX) / a
  return (b + 0.05) * Math.sqrt(Math.max(0.02, 1 - t * t))
}

// Wavy "flame" stitch line running up the shaft, wrapped onto the tube.
function flameCurve(cx, baseY, topY, amp, phase) {
  const pts = []
  const n = 20
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const y = baseY + (topY - baseY) * t
    const x = cx + Math.sin(t * Math.PI * 3 + phase) * amp * (1 - t * 0.5)
    pts.push(new THREE.Vector3(x, y, shaftSurfaceZ(x)))
  }
  return new THREE.CatmullRomCurve3(pts)
}

// Horizontal collar row wrapped around the front face of the tube.
function collarCurve(y) {
  const pts = []
  const n = 24
  for (let i = 0; i <= n; i++) {
    const x = 1.0 + ((4.0 - 1.0) * i) / n
    pts.push(new THREE.Vector3(x, y, shaftSurfaceZ(x)))
  }
  return new THREE.CatmullRomCurve3(pts)
}

function stitchGeometries(shaftHeight) {
  const top = 0.5 + shaftHeight
  const geos = []
  const flames = [
    flameCurve(1.6, 4.8, top - 1.5, 0.35, 0),
    flameCurve(2.5, 4.6, top - 1.3, 0.4, Math.PI / 2),
    flameCurve(3.4, 4.8, top - 1.5, 0.35, Math.PI),
  ]
  for (const c of flames) geos.push(new THREE.TubeGeometry(c, 64, 0.055, 6))
  for (const y of [top - 1.0, top - 1.25]) {
    geos.push(new THREE.TubeGeometry(collarCurve(y), 48, 0.05, 6))
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

export default function BootModel({ design }) {
  const materials = useBootMaterials(design)
  const heelHeight = heelById(design.heelStyle).height
  const decalTex = useStitchDecalTexture(
    design.stitchPattern,
    threadById(design.thread).color,
  )

  const geos = useMemo(() => {
    const top = 0.5 + design.shaftHeight
    return {
      shaftTube: tubeGeometry(top - SHAFT_BOTTOM),
      vamp: extrudeProfile(footShape(design.toe, heelHeight), 3.5, 0.8, {
        smooth: true,
        inset: 0.45,
      }),
      sole: extrudeProfile(soleShape(design.toe, heelHeight), 3.8, 0.25, { inset: 0.1 }),
      heel: heelStack(heelHeight),
      stitches: stitchGeometries(design.shaftHeight),
    }
  }, [design.toe, design.shaftHeight, heelHeight])

  useEffect(() => {
    return () => {
      geos.shaftTube.dispose()
      geos.vamp.dispose()
      geos.sole.dispose()
      geos.heel.lifts.forEach((g) => g.dispose())
      geos.heel.wedge.dispose()
      geos.stitches.forEach((g) => g.dispose())
    }
  }, [geos])

  // Stacked-lift materials: alternating natural-leaning tones derived from
  // the heel leather, with a near-black rubber top lift on the ground.
  const liftMaterials = useMemo(() => {
    const natural = new THREE.Color('#c9a578')
    const base = new THREE.Color(leatherById(design.heel).color).lerp(natural, 0.45)
    const maps = getLeatherMaps('calf')
    const make = (color) =>
      new THREE.MeshStandardMaterial({
        color,
        map: maps.map,
        normalMap: maps.normalMap,
        roughness: 0.85,
      })
    return {
      light: make(base.clone().offsetHSL(0, 0, 0.05)),
      dark: make(base.clone().offsetHSL(0, 0, -0.05)),
      cap: make(new THREE.Color('#2b2522')),
    }
  }, [design.heel])

  useEffect(() => {
    return () => Object.values(liftMaterials).forEach((m) => m.dispose())
  }, [liftMaterials])

  const top = 0.5 + design.shaftHeight
  const cylHeight = top - SHAFT_BOTTOM
  const cylCenterY = (top + SHAFT_BOTTOM) / 2
  const decalBottom = 4.9
  const decalTop = top - 1.5
  const decalCenter = (decalBottom + decalTop) / 2
  const decalHeight = Math.max(decalTop - decalBottom, 1)

  return (
    <group position={[-5.2, 0, 0]}>
      {/* Shaft: hollow elliptical tube with a flared, bound opening */}
      <mesh
        geometry={geos.shaftTube}
        material={materials.shaft}
        position={[SHAFT_CX, cylCenterY, 0]}
        scale={[SHAFT_RX_TOP, 1, SHAFT_RZ_TOP]}
        castShadow
        receiveShadow
      />
      <mesh
        material={materials.shaft}
        position={[SHAFT_CX, top, 0]}
        rotation-x={Math.PI / 2}
        scale={[SHAFT_RX_TOP, SHAFT_RZ_TOP, 1]}
        castShadow
      >
        <torusGeometry args={[1, 0.06, 12, 64]} />
      </mesh>
      <mesh geometry={geos.vamp} material={materials.vamp} castShadow receiveShadow />
      <mesh geometry={geos.sole} material={materials.heel} castShadow receiveShadow />
      {geos.heel.lifts.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          material={i === 0 ? liftMaterials.cap : i % 2 ? liftMaterials.light : liftMaterials.dark}
          castShadow
          receiveShadow
        />
      ))}
      <mesh geometry={geos.heel.wedge} material={materials.heel} castShadow receiveShadow />
      {decalTex
        ? [0, Math.PI].map((thetaMid) => (
            <mesh
              key={thetaMid}
              position={[SHAFT_CX, decalCenter, 0]}
              scale={[
                (SHAFT_RX_TOP + SHAFT_RX_BOT) / 2 + 0.06,
                1,
                (SHAFT_RZ_TOP + SHAFT_RZ_BOT) / 2 + 0.06,
              ]}
            >
              <cylinderGeometry
                args={[1, 1, decalHeight, 32, 1, true, thetaMid - 0.8, 1.6]}
              />
              <meshStandardMaterial
                map={decalTex}
                transparent
                roughness={0.85}
                depthWrite={false}
              />
            </mesh>
          ))
        : [1, -1].map((side) => (
            <group key={side} scale={[1, 1, side]}>
              {geos.stitches.map((g, i) => (
                <mesh key={i} geometry={g} material={materials.thread} />
              ))}
            </group>
          ))}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          material={materials.straps}
          position={[SHAFT_CX, top - 1.6, side * (SHAFT_RZ_TOP - 0.04)]}
          castShadow
        >
          <boxGeometry args={[0.95, 1.7, 0.18]} />
        </mesh>
      ))}
    </group>
  )
}
