import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF, Center, Bounds, Environment } from "@react-three/drei"
import { PageContainerDesktop, PageLayoutDesktop } from "./Header"
import { useRef, useEffect, useState } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"


function Chair() {
  const { scene } = useGLTF("/models/barber_chair.glb")
  const ref = useRef<THREE.Object3D | null>(null)

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y += 0.005   // rotation speed
    }
  })

  return (
    <Center>
      <primitive ref={ref} object={scene} scale={5} />
    </Center>
  )
}
export default function BarberScene() {
  return (
    <PageLayoutDesktop variant="customer">
      <PageContainerDesktop maxWidth="xl">

        <div className="relative w-[600px] h-[800px] mx-auto rounded-xl overflow-hidden bg-transparent">

          <Canvas camera={{ fov: 45 }}>

            {/* lighting */}
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={2} />
            <Environment preset="studio" />

            {/* auto-fit model */}
            <Bounds fit clip observe margin={1.2}>
              <Chair />
            </Bounds>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
            />

          </Canvas>

        </div>


      </PageContainerDesktop>
    </PageLayoutDesktop>
  )
}

useGLTF.preload("/models/barber_chair.glb")