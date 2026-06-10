import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { finishById, leatherById, threadById } from '../data/presets'
import { leatherBumpTexture } from '../utils/leatherTexture'

function leatherMaterial(colorHex, finish) {
  return new THREE.MeshPhysicalMaterial({
    color: colorHex,
    roughness: finish.roughness,
    clearcoat: finish.clearcoat,
    clearcoatRoughness: 0.4,
    bumpMap: leatherBumpTexture(),
    bumpScale: 0.35,
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
