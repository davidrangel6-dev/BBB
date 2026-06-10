import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { finishById, leatherById, threadById } from '../data/presets'
import { getLeatherMaps } from './leatherMaps'

// How each leather texture type behaves beyond its maps.
const TYPE_STYLE = {
  calf: {},
  smooth: { roughnessAdd: -0.08, clearcoatAdd: 0.1 },
  suede: { roughnessAdd: 0.35, clearcoat: 0, sheen: 0.6 },
  ostrich: { roughnessAdd: 0.05 },
  caiman: { roughnessAdd: -0.05, clearcoatAdd: 0.2 },
}

export function leatherMaterial(colorHex, finish, type = 'calf') {
  const maps = getLeatherMaps(type)
  const style = TYPE_STYLE[type] ?? {}
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    map: maps.map,
    normalMap: maps.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: maps.roughnessMap,
    roughness: Math.min(1, Math.max(0.1, finish.roughness + (style.roughnessAdd ?? 0))),
    clearcoat:
      style.clearcoat !== undefined
        ? style.clearcoat
        : Math.min(1, finish.clearcoat + (style.clearcoatAdd ?? 0)),
    clearcoatRoughness: 0.35,
    sheen: style.sheen ?? 0,
    sheenColor: new THREE.Color(colorHex).lerp(new THREE.Color('#ffffff'), 0.5),
    envMapIntensity: 0.9,
    // The shaft is an open tube, so its inside must render too.
    side: THREE.DoubleSide,
  })
}

// One material per customizable part, shared by the placeholder boot and
// any imported .glb model.
export function useBootMaterials(design) {
  const materials = useMemo(() => {
    const finish = finishById(design.finish)
    return {
      shaft: leatherMaterial(leatherById(design.shaft).color, finish, design.shaftTexture),
      vamp: leatherMaterial(leatherById(design.vamp).color, finish, design.vampTexture),
      heel: leatherMaterial(leatherById(design.heel).color, finish, 'calf'),
      straps: leatherMaterial(leatherById(design.straps).color, finish, 'calf'),
      thread: new THREE.MeshStandardMaterial({
        color: threadById(design.thread).color,
        roughness: 0.7,
      }),
    }
  }, [
    design.shaft,
    design.vamp,
    design.heel,
    design.straps,
    design.thread,
    design.finish,
    design.shaftTexture,
    design.vampTexture,
  ])

  useEffect(() => {
    return () => Object.values(materials).forEach((m) => m.dispose())
  }, [materials])

  return materials
}
