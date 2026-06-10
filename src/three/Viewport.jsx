import { useEffect } from 'react'
import * as THREE from 'three'
import { Canvas, useThree } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import BootModel from './BootModel'
import CustomModel from './CustomModel'

// Image-based studio lighting from three's procedural RoomEnvironment —
// gives leather realistic reflections without fetching any HDRI assets.
function StudioEnvironment() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])
  return null
}

export default function Viewport({ design, customScene }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [23, 12, 25], fov: 32 }}
      onCreated={({ gl }) => {
        gl.toneMappingExposure = 1.15
      }}
    >
      <color attach="background" args={['#ffffff']} />
      <StudioEnvironment />
      <ambientLight intensity={0.15} />
      <directionalLight
        position={[10, 16, 9]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-9, 7, -11]} intensity={0.3} />
      {customScene ? (
        <CustomModel scene={customScene} design={design} />
      ) : (
        <BootModel design={design} />
      )}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.35}
        scale={34}
        blur={2.4}
        far={18}
        resolution={512}
      />
      <OrbitControls
        makeDefault
        enableDamping
        target={[0, 7, 0]}
        minDistance={8}
        maxDistance={50}
        maxPolarAngle={Math.PI * 0.55}
      />
    </Canvas>
  )
}
