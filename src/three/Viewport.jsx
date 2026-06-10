import { Canvas } from '@react-three/fiber'
import { ContactShadows, OrbitControls } from '@react-three/drei'
import BootModel from './BootModel'
import CustomModel from './CustomModel'

export default function Viewport({ design, customScene }) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      camera={{ position: [19, 10, 21], fov: 32 }}
    >
      <color attach="background" args={['#ece6d8']} />
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[10, 16, 9]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
      />
      <directionalLight position={[-9, 7, -11]} intensity={0.5} />
      {customScene ? (
        <CustomModel scene={customScene} design={design} />
      ) : (
        <BootModel design={design} />
      )}
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.45}
        scale={34}
        blur={2.2}
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
