import { useMemo } from 'react'
import * as THREE from 'three'
import { useBootMaterials } from './materials'

// Renders a user-supplied .glb boot model with the design's materials
// applied. Meshes are matched to customizable parts by name, so a
// commissioned model should name its meshes with these keywords:
//   shaft/upper, vamp/foot/toe, heel/sole, strap/pull, stitch/thread
function partForMeshName(name) {
  const n = name.toLowerCase()
  if (n.includes('stitch') || n.includes('thread')) return 'thread'
  if (n.includes('strap') || n.includes('pull')) return 'straps'
  if (n.includes('heel') || n.includes('sole')) return 'heel'
  if (n.includes('shaft') || n.includes('upper')) return 'shaft'
  if (n.includes('vamp') || n.includes('foot') || n.includes('toe')) return 'vamp'
  return 'vamp'
}

export default function CustomModel({ scene, design }) {
  const materials = useBootMaterials(design)

  // Scale and center the model so it sits on the ground at a boot-like size.
  const transform = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = box.getSize(new THREE.Vector3())
    const scale = size.y > 0 ? 15 / size.y : 1
    const center = box.getCenter(new THREE.Vector3())
    return {
      scale,
      position: [-center.x * scale, -box.min.y * scale, -center.z * scale],
    }
  }, [scene])

  scene.traverse((obj) => {
    if (!obj.isMesh) return
    obj.material = materials[partForMeshName(obj.name)]
    obj.castShadow = true
    obj.receiveShadow = true
  })

  return (
    <group position={transform.position} scale={transform.scale}>
      <primitive object={scene} />
    </group>
  )
}
