import { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, RoundedBox } from '@react-three/drei';
import { UPPER_TEETH, LOWER_TEETH, STATUS_COLORS } from '../utils/toothData';

// ── Single tooth mesh ─────────────────────────────────────────────────────────

function Tooth({ tooth, status, selected, onClick }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const baseColor = STATUS_COLORS[status] || STATUS_COLORS.healthy;
  const color = selected ? '#60a5fa' : hovered ? '#e0edff' : baseColor;
  const emissive = selected ? '#1e3a6e' : hovered ? '#1a3560' : '#000000';

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.scale.y = selected
        ? 1 + 0.04 * Math.sin(Date.now() / 300)
        : 1;
    }
  });

  return (
    <group
      position={[tooth.x, tooth.y, tooth.z]}
      onClick={e => { e.stopPropagation(); onClick(tooth); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      <mesh ref={meshRef} scale={[tooth.rx * 2, 1, tooth.rz * 2]}>
        <capsuleGeometry args={[0.5, tooth.h, 4, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={emissive}
          emissiveIntensity={0.15}
          roughness={0.25}
          metalness={0.0}
        />
      </mesh>

      {/* Status indicator dot */}
      {status !== 'healthy' && (
        <mesh position={[0, tooth.arch === 'upper' ? tooth.h / 2 + 0.25 : -(tooth.h / 2 + 0.25), 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={STATUS_COLORS[status]} emissive={STATUS_COLORS[status]} emissiveIntensity={0.5} />
        </mesh>
      )}

      {/* Hover label */}
      {hovered && (
        <Html
          position={[0, tooth.arch === 'upper' ? tooth.h / 2 + 0.6 : -(tooth.h / 2 + 0.6), 0]}
          center
          distanceFactor={6}
        >
          <div style={{
            background: 'rgba(15,23,42,0.9)',
            color: '#f1f5f9',
            padding: '4px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontFamily: 'Inter, sans-serif',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}>
            #{tooth.number} {tooth.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ── Arch gum surface ──────────────────────────────────────────────────────────

function GumArch({ teeth, yOffset, color }) {
  const points = teeth.map(t => [t.x, yOffset, t.z]);
  return (
    <>
      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.18, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </>
  );
}

// ── Scene ─────────────────────────────────────────────────────────────────────

export default function TeethScene({ statuses, onToothClick, showUpper, showLower }) {
  return (
    <Canvas
      camera={{ position: [0, 5, 7], fov: 45, near: 0.1, far: 100 }}
      style={{ background: '#0d1b2a', borderRadius: 12 }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <directionalLight position={[-5, 5, -5]} intensity={0.4} />
      <pointLight position={[0, 8, 0]} intensity={0.5} color="#e0f2fe" />

      <OrbitControls
        enablePan={true}
        minDistance={3}
        maxDistance={18}
        target={[0, 0, 0]}
      />

      {/* Upper arch */}
      {showUpper && (
        <group>
          <GumArch teeth={UPPER_TEETH} yOffset={0.1} color="#d96b8a" />
          {UPPER_TEETH.map(tooth => (
            <Tooth
              key={tooth.id}
              tooth={tooth}
              status={statuses[tooth.id] || 'healthy'}
              selected={false}
              onClick={onToothClick}
            />
          ))}
        </group>
      )}

      {/* Lower arch */}
      {showLower && (
        <group>
          <GumArch teeth={LOWER_TEETH} yOffset={-0.1} color="#d96b8a" />
          {LOWER_TEETH.map(tooth => (
            <Tooth
              key={tooth.id}
              tooth={tooth}
              status={statuses[tooth.id] || 'healthy'}
              selected={false}
              onClick={onToothClick}
            />
          ))}
        </group>
      )}
    </Canvas>
  );
}
