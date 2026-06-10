import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { finishById, leatherById, threadById } from '../data/presets'
import { getLeatherMaps } from './leatherMaps'

function leatherMaterial(colorHex, finish) {
  const maps = getLeatherMaps()
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    map: maps.map,
    normalMap: maps.normalMap,
    normalScale: new THREE.Vector2(0.7, 0.7),
    roughnessMap: maps.roughnessMap,
    roughness: finish.roughness,
    clearcoat: finish.clearcoat,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.9,
  })
}

// One material per customizable part, shared by the placeholder boot and
// any imported .glb model.
export function useBootMaterials(design) {
  const materials = useMemo(() => {
    const finish = finishById(design.finish)
    return {
      shaft: leatherMaterial(leatherById(design.shaft).color, finish),
      vamp: leatherMaterial(leatherById(design.vamp).color, finish),
      heel: leatherMaterial(leatherById(design.heel).color, finish),
      straps: leatherMaterial(leatherById(design.straps).color, finish),
      thread: new THREE.MeshStandardMaterial({
        color: threadById(design.thread).color,
        roughness: 0.7,
      }),
    }
  }, [design.shaft, design.vamp, design.heel, design.straps, design.thread, design.finish])

  useEffect(() => {
    return () => Object.values(materials).forEach((m) => m.dispose())
  }, [materials])

  return materials
}
