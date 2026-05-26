import React, { useRef, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

/* ═══════════════════════════════════════════════
   Brain anatomy warping — pure functions
   ═══════════════════════════════════════════════ */

function warpCerebrum(sx: number, sy: number, sz: number): [number, number, number] {
  let x = sx * 0.62, y = sy * 0.74, z = sz * 0.92

  // Frontal taper
  if (z > 0) x *= 1.0 - z * 0.22

  // Occipital bulge
  if (z < -0.3) x *= 1.0 + 0.06 * Math.exp(-8 * (z + 0.6) * (z + 0.6))

  // Posterior-inferior cavity (pocket for cerebellum)
  if (z < -0.15 && y < 0) {
    const cs = Math.min(1.0, (-z - 0.15) * 2.5)
    const bs = Math.min(1.0, -y * 2.0)
    y *= 1.0 - 0.55 * cs * bs
  }

  // Anterior-inferior lift + general inferior flatten
  if (z > 0 && y < 0) {
    y *= 0.58
    y += z * 0.14
  } else if (y < 0) {
    y *= 0.65
  }

  // Longitudinal fissure
  const fd = 0.28 * Math.exp(-28 * x * x)
  const fg = y > -0.1 ? 1.0 : Math.max(0, 1.0 + (y + 0.1) * 5)
  x *= 1.0 - fd * fg

  // Temporal bulge
  if (y < 0.1 && y > -0.3) {
    x *= 1.0 + 0.08 * Math.exp(-6 * y * y) * Math.sign(x)
  }

  return [x, y + 0.15, z]
}

function warpCerebellum(sx: number, sy: number, sz: number): [number, number, number] {
  let x = sx * 0.52
  let y = sy * 0.26 - 0.44
  let z = sz * 0.38 - 0.30

  // Midline vertical cleft
  y += 0.12 * Math.exp(-40 * x * x)

  return [x, y + 0.15, z]
}

/* ═══════════════════════════════════════════════
   Point cloud generation
   ═══════════════════════════════════════════════ */

function randSphere(rMin: number, rMax: number): [number, number, number] {
  const theta = Math.random() * Math.PI * 2
  const u = Math.random() * 2 - 1
  const s = Math.sqrt(1 - u * u)
  const r = rMin + Math.cbrt(Math.random()) * (rMax - rMin)
  return [s * Math.cos(theta) * r, u * r, s * Math.sin(theta) * r]
}

function generateBrainCloud(): number[][] {
  const pts: number[][] = []

  // Cerebrum surface (dense outer shell)
  for (let i = 0; i < 700; i++) {
    const [sx, sy, sz] = randSphere(0.92, 1.06)
    pts.push(warpCerebrum(sx, sy, sz))
  }

  // Cerebrum volume (visible through the mesh for depth)
  for (let i = 0; i < 140; i++) {
    const [sx, sy, sz] = randSphere(0.50, 0.88)
    pts.push(warpCerebrum(sx, sy, sz))
  }

  // Cerebellum surface
  for (let i = 0; i < 200; i++) {
    const [sx, sy, sz] = randSphere(0.88, 1.08)
    pts.push(warpCerebellum(sx, sy, sz))
  }

  // Cerebellum volume
  for (let i = 0; i < 50; i++) {
    const [sx, sy, sz] = randSphere(0.35, 0.82)
    pts.push(warpCerebellum(sx, sy, sz))
  }

  // Brainstem (tapered cylinder)
  for (let i = 0; i < 60; i++) {
    const theta = Math.random() * Math.PI * 2
    const h = (Math.random() - 0.5) * 0.48 // height range
    const t = (h + 0.24) / 0.48             // 0→1 bottom→top
    const rad = 0.045 + t * 0.045           // taper: 0.045 → 0.09
    const rJitter = 0.6 + Math.random() * 0.4
    const x = Math.cos(theta) * rad * rJitter
    const z0 = Math.sin(theta) * rad * rJitter
    const bend = Math.sin(t * Math.PI * 0.8) * 0.05
    pts.push([x, h - 0.45 + 0.15, z0 - 0.10 - bend])
  }

  return pts
}

/* ═══════════════════════════════════════════════
   KNN edge builder
   ═══════════════════════════════════════════════ */

function buildEdges(
  pts: number[][],
  maxDist: number,
  maxK: number
): [number, number][] {
  const n = pts.length
  const maxD2 = maxDist * maxDist
  const edges: [number, number][] = []
  const seen = new Set<number>()

  for (let i = 0; i < n; i++) {
    const [ax, ay, az] = pts[i]
    const near: { j: number; d2: number }[] = []

    for (let j = 0; j < n; j++) {
      if (i === j) continue
      const dx = ax - pts[j][0]
      const dy = ay - pts[j][1]
      const dz = az - pts[j][2]
      const d2 = dx * dx + dy * dy + dz * dz
      if (d2 < maxD2) near.push({ j, d2 })
    }

    near.sort((a, b) => a.d2 - b.d2)
    for (const { j } of near.slice(0, maxK)) {
      const key = i < j ? i * n + j : j * n + i
      if (!seen.has(key)) {
        seen.add(key)
        edges.push([i, j])
      }
    }
  }

  return edges
}

/* ═══════════════════════════════════════════════
   Brain Network 3D Mesh — the hero element
   ═══════════════════════════════════════════════ */

function BrainNetworkMesh() {
  const groupRef = useRef<THREE.Group>(null)
  const lineMatRef = useRef<THREE.LineBasicMaterial>(null)
  const pointMatRef = useRef<THREE.PointsMaterial>(null)

  const { lineGeom, ptGeom } = useMemo(() => {
    const pts = generateBrainCloud()

    // Two-pass connectivity: dense local + sparse long-range
    const localEdges = buildEdges(pts, 0.20, 5)
    const longEdges = buildEdges(pts, 0.38, 2)

    // Merge & deduplicate
    const allEdgeSet = new Set<string>()
    const allEdges: [number, number][] = []
    for (const e of [...localEdges, ...longEdges]) {
      const key = `${Math.min(e[0], e[1])}-${Math.max(e[0], e[1])}`
      if (!allEdgeSet.has(key)) {
        allEdgeSet.add(key)
        allEdges.push(e)
      }
    }

    // Build line segments buffer
    const linePos = new Float32Array(allEdges.length * 6)
    for (let i = 0; i < allEdges.length; i++) {
      const [a, b] = allEdges[i]
      linePos[i * 6] = pts[a][0]
      linePos[i * 6 + 1] = pts[a][1]
      linePos[i * 6 + 2] = pts[a][2]
      linePos[i * 6 + 3] = pts[b][0]
      linePos[i * 6 + 4] = pts[b][1]
      linePos[i * 6 + 5] = pts[b][2]
    }
    const lg = new THREE.BufferGeometry()
    lg.setAttribute('position', new THREE.BufferAttribute(linePos, 3))

    // Build points buffer
    const ptPos = new Float32Array(pts.length * 3)
    for (let i = 0; i < pts.length; i++) {
      ptPos[i * 3] = pts[i][0]
      ptPos[i * 3 + 1] = pts[i][1]
      ptPos[i * 3 + 2] = pts[i][2]
    }
    const pg = new THREE.BufferGeometry()
    pg.setAttribute('position', new THREE.BufferAttribute(ptPos, 3))

    return { lineGeom: lg, ptGeom: pg }
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    // Slow continuous Y-axis rotation
    groupRef.current.rotation.y = t * 0.18

    // Subtle pulsing glow on lines
    if (lineMatRef.current) {
      lineMatRef.current.opacity = 0.48 + Math.sin(t * 0.7) * 0.1
    }
    if (pointMatRef.current) {
      pointMatRef.current.opacity = 0.8 + Math.sin(t * 0.7 + 0.5) * 0.12
    }
  })

  return (
    <group ref={groupRef} scale={1.45}>
      {/* Network edge lines */}
      <lineSegments geometry={lineGeom}>
        <lineBasicMaterial
          ref={lineMatRef}
          color="#22d3ee"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </lineSegments>

      {/* Network node dots */}
      <points geometry={ptGeom}>
        <pointsMaterial
          ref={pointMatRef}
          color="#67e8f9"
          size={0.02}
          transparent
          opacity={0.88}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Brighter core dots (subset effect via second smaller points layer) */}
      <points geometry={ptGeom}>
        <pointsMaterial
          color="#a5f3fc"
          size={0.008}
          transparent
          opacity={0.95}
          sizeAttenuation
          depthWrite={false}
        />
      </points>

      {/* Subtle inner glow volume */}
      <mesh position={[0, 0.08, -0.04]}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.05} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   Lighting rig
   ═══════════════════════════════════════════════ */

function LightRig() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[8, 8, 8]} intensity={1.2} color="#22d3ee" />
      <pointLight position={[-8, -6, -8]} intensity={0.4} color="#0ea5e9" />
    </>
  )
}

/* ═══════════════════════════════════════════════
   Background particle web (unchanged)
   ═══════════════════════════════════════════════ */

function ParticleWebPoints({ count = 250 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null)

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count * 3; i += 3) {
      arr[i] = (Math.random() - 0.5) * 12
      arr[i + 1] = (Math.random() - 0.5) * 12
      arr[i + 2] = (Math.random() - 0.5) * 8
    }
    return arr
  }, [count])

  useFrame((state) => {
    if (!pointsRef.current) return
    pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.012
    pointsRef.current.rotation.x = state.clock.getElapsedTime() * 0.006
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#a78bfa"
        size={0.045}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.35}
      />
    </points>
  )
}

/* ═══════════════════════════════════════════════
   Exported scene wrappers
   ═══════════════════════════════════════════════ */

export function FloatingBrainOrbScene() {
  return (
    <div className="w-full h-[350px] md:h-[450px] lg:h-full relative">
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
        <Suspense fallback={null}>
          <LightRig />
          <Float speed={1.2} rotationIntensity={0.15} floatIntensity={0.15}>
            <BrainNetworkMesh />
          </Float>
          <ParticleWebPoints count={60} />
        </Suspense>
      </Canvas>
    </div>
  )
}

export function ParticleWebBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 bg-slate-950/10 dark:bg-transparent">
      <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <ParticleWebPoints count={250} />
        </Suspense>
      </Canvas>
    </div>
  )
}
