import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { heelById } from '../data/presets'
import { useBootMaterials } from './materials'

// Procedural placeholder boot, built from side-profile shapes extruded
// across the boot's width. Dimensions are roughly in inches. Each part is
// a separate mesh so leathers can be swapped independently — the same part
// names the real commissioned .glb model should use.

function extrudeProfile(shape, width, bevel, smooth = false) {
  const depth = width - bevel * 2
  let geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
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

function stitchGeometries(shaftHeight) {
  const top = 0.5 + shaftHeight
  const geos = []
  const flames = [
    flameCurve(1.4, 4.6, top - 1.1, 0.4, 0),
    flameCurve(2.55, 4.4, top - 0.9, 0.45, Math.PI / 2),
    flameCurve(3.7, 4.6, top - 1.1, 0.4, Math.PI),
  ]
  for (const c of flames) geos.push(new THREE.TubeGeometry(c, 48, 0.055, 6))
  // Collar rows near the top opening.
  for (const y of [top - 0.45, top - 0.7]) {
    const row = new THREE.LineCurve3(
      new THREE.Vector3(0.35, y, 0),
      new THREE.Vector3(4.7, y, 0),
    )
    geos.push(new THREE.TubeGeometry(row, 2, 0.05, 6))
  }
  return geos
}

const SHAFT_WIDTH = 3.7

export default function BootModel({ design }) {
  const materials = useBootMaterials(design)
  const heelHeight = heelById(design.heelStyle).height

  const geos = useMemo(() => {
    return {
      vamp: extrudeProfile(footShape(design.toe, heelHeight), 3.5, 0.4, true),
      sole: extrudeProfile(soleShape(design.toe, heelHeight), 3.8, 0.18),
      shaft: extrudeProfile(shaftShape(design.shaftHeight), SHAFT_WIDTH, 0.45, true),
      heel: extrudeProfile(heelShape(heelHeight), 3.3, 0.15),
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

  const stitchZ = SHAFT_WIDTH / 2 + 0.03
  const strapY = 0.5 + design.shaftHeight - 1.0

  return (
    <group position={[-5.2, 0, 0]}>
      <mesh geometry={geos.shaft} material={materials.shaft} castShadow receiveShadow />
      <mesh geometry={geos.vamp} material={materials.vamp} castShadow receiveShadow />
      <mesh geometry={geos.sole} material={materials.heel} castShadow receiveShadow />
      <mesh geometry={geos.heel} material={materials.heel} castShadow receiveShadow />
      {[stitchZ, -stitchZ].map((z) =>
        geos.stitches.map((g, i) => (
          <mesh key={`${z}-${i}`} geometry={g} material={materials.thread} position={[0, 0, z]} />
        )),
      )}
      {[1, -1].map((side) => (
        <mesh
          key={side}
          material={materials.straps}
          position={[2.5, strapY, side * (SHAFT_WIDTH / 2 + 0.05)]}
          castShadow
        >
          <boxGeometry args={[0.95, 1.7, 0.18]} />
        </mesh>
      ))}
    </group>
  )
}
