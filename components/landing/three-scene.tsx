"use client";

/* Landing arka planındaki gerçek WebGL sahnesi (R3F).
   Merkezde kristal bir HUB + etrafında yörüngedeki 5 platform düğümü.
   Scroll ilerledikçe sahne döner/kayar; mouse ile hafif eğilir.
   Yalnız client'ta, dynamic import (ssr:false) ile yüklenir. */

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import * as THREE from "three";

/* Marka paleti — cyan/violet, dark-first neon */
const CYAN = "#00F0FF";
const VIOLET = "#8b5cf6";

type NodeSpec = {
  r: number;      // yörünge yarıçapı
  speed: number;  // açısal hız (işareti yön)
  phase: number;  // başlangıç açısı
  tilt: number;   // dikey salınım oranı
  color: string;
};

const NODES: NodeSpec[] = [
  { r: 2.0, speed: 0.20, phase: 0.0, tilt: 0.25, color: CYAN },
  { r: 2.5, speed: -0.15, phase: 1.3, tilt: -0.35, color: VIOLET },
  { r: 2.3, speed: 0.24, phase: 2.6, tilt: 0.45, color: "#22d3ee" },
  { r: 2.8, speed: -0.18, phase: 3.9, tilt: -0.2, color: "#a78bfa" },
  { r: 1.8, speed: 0.28, phase: 5.1, tilt: 0.35, color: CYAN },
];

/* Düğüm parıltısı için radyal gradient sprite dokusu (client-only) */
function useGlowTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,255,255,0.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function HubSystem({ scroll }: { scroll: React.RefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  const nodeRefs = useRef<THREE.Mesh[]>([]);
  const lineRef = useRef<THREE.LineSegments>(null);
  const glow = useGlowTexture();
  const { pointer } = useThree();

  /* Hub → düğüm bağlantı çizgileri için paylaşılan buffer (her frame güncellenir) */
  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(NODES.length * 6), 3),
    );
    return g;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = scroll.current ?? 0;
    const posAttr = lineGeo.getAttribute("position") as THREE.BufferAttribute;

    NODES.forEach((n, i) => {
      const a = t * n.speed + n.phase;
      const x = Math.cos(a) * n.r;
      const z = Math.sin(a) * n.r;
      const y = Math.sin(a * 1.3) * n.r * n.tilt;
      const mesh = nodeRefs.current[i];
      if (mesh) {
        mesh.position.set(x, y, z);
        const sc = 1 + Math.sin(t * 2 + i) * 0.18;
        mesh.scale.setScalar(sc);
      }
      posAttr.setXYZ(i * 2, 0, 0, 0);
      posAttr.setXYZ(i * 2 + 1, x, y, z);
    });
    posAttr.needsUpdate = true;

    if (group.current) {
      // Taban otomatik dönüş + scroll dönüşü + mouse parallax (lerp'le yumuşat)
      const targetRotY = t * 0.07 + s * Math.PI * 2.4 + pointer.x * 0.5;
      const targetRotX = 0.12 + s * 0.6 + pointer.y * -0.3;
      group.current.rotation.y += (targetRotY - group.current.rotation.y) * 0.05;
      group.current.rotation.x += (targetRotX - group.current.rotation.x) * 0.05;
      // Scroll boyunca yatay kayma (bölümden bölüme farklı konum) + aşağı süzülme + yakınlaşma
      group.current.position.x = 1.6 * Math.cos(s * Math.PI * 1.4) - 0.2;
      group.current.position.y = -s * 1.4;
      const sc = 1 + s * 0.12;
      group.current.scale.setScalar(sc);
    }
  });

  return (
    <group ref={group}>
      {/* Kristal çekirdek — camsı/yarı saydam (arkadaki metin nefes alsın) */}
      <mesh>
        <icosahedronGeometry args={[1.05, 1]} />
        <meshStandardMaterial
          color="#0b1220"
          emissive={CYAN}
          emissiveIntensity={0.4}
          metalness={0.3}
          roughness={0.4}
          transparent
          opacity={0.38}
          flatShading
        />
      </mesh>

      {/* Wireframe kabuk */}
      <mesh>
        <icosahedronGeometry args={[1.32, 1]} />
        <meshBasicMaterial color={CYAN} wireframe transparent opacity={0.28} />
      </mesh>

      {/* Merkezden düğümlere ışıyan bağlantı çizgileri */}
      <lineSegments ref={lineRef} geometry={lineGeo}>
        <lineBasicMaterial
          color={CYAN}
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* Yörüngedeki 5 platform düğümü + parıltı halesi */}
      {NODES.map((n, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) nodeRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial
            color={n.color}
            emissive={n.color}
            emissiveIntensity={2.4}
            toneMapped={false}
          />
          <sprite scale={[1.1, 1.1, 1]}>
            <spriteMaterial
              map={glow}
              color={n.color}
              blending={THREE.AdditiveBlending}
              transparent
              opacity={0.9}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>
        </mesh>
      ))}

      {/* Atmosfer tozu */}
      <Sparkles count={50} scale={9} size={2.4} speed={0.28} opacity={0.5} color={CYAN} />
      <Sparkles count={30} scale={7} size={2} speed={0.2} opacity={0.4} color={VIOLET} />
    </group>
  );
}

export default function ThreeScene() {
  const scroll = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      scroll.current = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0, 8], fov: 50 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={1.4} />
      <pointLight position={[6, 5, 6]} intensity={90} color={CYAN} distance={30} />
      <pointLight position={[-6, -4, 4]} intensity={70} color={VIOLET} distance={30} />
      <HubSystem scroll={scroll} />
    </Canvas>
  );
}
