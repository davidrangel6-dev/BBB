import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { heelById, leatherById, threadById } from '../data/presets'
import { getLeatherMaps } from './leatherMaps'
import { useBootMaterials } from './materials'
import {
  archLift,
  buildFootGeometry,
  buildHeelStack,
  buildSoleSlab,
  buildSoleStitches,
} from './footGeometry'

// Procedural placeholder boot. The shaft is a tapered elliptical tube
// (hollow, flared opening, bound collar); the foot is a lofted rounded
// "last" volume; the welt and outsole wrap the entire footprint; the
// heel is a stack of leather lifts. Each part is a separate mesh so
// leathers swap independently.

// Shaft tube dimensions (centered on the ankle at x = 2.5). The tube
// tapers toward the ankle so it tucks into the rounded foot.
const SHAFT_CX = 2.5
const SHAFT_BOTTOM = 2.9
const SHAFT_RX_TOP = 2.7
const SHAFT_RZ_TOP = 1.95
const SHAFT_TAPER = 0.82

// Cylinder UVs span 0–1 around the tube; rescale them to inch-space so
// the leather grain matches the foot.
function tubeGeometry(cylHeight) {
  const geo = new THREE.CylinderGeometry(1, SHAFT_TAPER, cylHeight, 64, 1, true)
  const uv = geo.attributes.uv
  const circumference = Math.PI * (SHAFT_RX_TOP + SHAFT_RZ_TOP)
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, uv.getX(i) * circumference, uv.getY(i) * cylHeight)
  }
  return geo
}

// Depth (z) of the shaft tube's surface at a given x, so stitching can
// hug the curved leather instead of floating beside it.
function shaftSurfaceZ(x) {
  const a = SHAFT_RX_TOP * 0.93
  const b = SHAFT_RZ_TOP * 0.93
  const t = (x - SHAFT_CX) / a
  return (b + 0.06) * Math.sqrt(Math.max(0.02, 1 - t * t))
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
      foot: buildFootGeometry(design.toe, heelHeight),
      welt: buildSoleSlab(design.toe, heelHeight, 0.22, 0.5, 0.64),
      outsole: buildSoleSlab(design.toe, heelHeight, 0.16, 0, 0.52),
      heel: buildHeelStack(heelHeight),
      soleStitches: buildSoleStitches(design.toe, heelHeight),
      stitches: stitchGeometries(design.shaftHeight),
    }
  }, [design.toe, design.shaftHeight, heelHeight])

  useEffect(() => {
    return () => {
      geos.shaftTube.dispose()
      geos.foot.dispose()
      geos.welt.dispose()
      geos.outsole.dispose()
      geos.heel.lifts.forEach((g) => g.dispose())
      geos.heel.wedge.dispose()
      geos.soleStitches.forEach((g) => g.dispose())
      geos.stitches.forEach((g) => g.dispose())
    }
  }, [geos])

  // Stacked-lift materials: alternating natural-leaning tones derived from
  // the heel leather, a near-black rubber top lift, and the natural welt.
  const liftMaterials = useMemo(() => {
    const natural = new THREE.Color('#c9a578')
    const base = new THREE.Color(leatherById(design.heel).color).lerp(natural, 0.45)
    const maps = getLeatherMaps('calf')
    const make = (color, roughness = 0.85) =>
      new THREE.MeshStandardMaterial({
        color,
        map: maps.map,
        normalMap: maps.normalMap,
        roughness,
      })
    return {
      light: make(base.clone().offsetHSL(0, 0, 0.05)),
      dark: make(base.clone().offsetHSL(0, 0, -0.05)),
      cap: make(new THREE.Color('#2b2522')),
      welt: make(new THREE.Color('#d8c39a'), 0.9),
    }
  }, [design.heel])

  useEffect(() => {
    return () => Object.values(liftMaterials).forEach((m) => m.dispose())
  }, [liftMaterials])

  const top = 0.5 + design.shaftHeight
  const cylCenterY = (top + SHAFT_BOTTOM) / 2
  const decalBottom = 4.9
  const decalTop = top - 1.5
  const decalCenter = (decalBottom + decalTop) / 2
  const decalHeight = Math.max(decalTop - decalBottom, 1)

  return (
    <group position={[-5.2, 0, 0]}>
      {/* Shaft: hollow tapered tube with a flared, bound opening */}
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
      {/* Ankle roll filling the shaft-to-foot transition */}
      <mesh
        material={materials.vamp}
        position={[SHAFT_CX, 2.7 + archLift(SHAFT_CX, heelHeight) * 0.6, 0]}
        scale={[2.45, 1.3, 1.7]}
        castShadow
      >
        <sphereGeometry args={[1, 32, 20]} />
      </mesh>
      <mesh geometry={geos.foot} material={materials.vamp} castShadow receiveShadow />
      <mesh geometry={geos.welt} material={liftMaterials.welt} castShadow receiveShadow />
      <mesh geometry={geos.outsole} material={materials.heel} castShadow receiveShadow />
      {geos.heel.lifts.map((g, i) => (
        <mesh
          key={i}
          geometry={g}
          material={i === 0 ? liftMaterials.cap : i % 2 ? liftMaterials.light : liftMaterials.dark}
          castShadow
          receiveShadow
        />
      ))}
      <mesh geometry={geos.heel.wedge} material={liftMaterials.dark} castShadow receiveShadow />
      {geos.soleStitches.map((g, i) => (
        <mesh key={`ss-${i}`} geometry={g} material={materials.thread} />
      ))}
      {decalTex
        ? [0, Math.PI].map((thetaMid) => (
            <mesh
              key={thetaMid}
              position={[SHAFT_CX, decalCenter, 0]}
              scale={[SHAFT_RX_TOP * 0.95, 1, SHAFT_RZ_TOP * 0.95]}
            >
              <cylinderGeometry
                args={[1.02, 0.98, decalHeight, 32, 1, true, thetaMid - 0.8, 1.6]}
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
