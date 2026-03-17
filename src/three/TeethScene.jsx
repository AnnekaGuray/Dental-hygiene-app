import { useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { UPPER_TEETH, LOWER_TEETH, STATUS_COLORS } from '../utils/toothData';

// ─────────────────────────────────────────────────────────────────────────────
// Jaw OBJ model — loaded imperatively to avoid useLoader/Suspense strict-mode
// context-loss issues.
// ─────────────────────────────────────────────────────────────────────────────
function JawModel() {
  const [model, setModel] = useState(null);

  useEffect(() => {
    let active = true;
    const loader = new OBJLoader();

    loader.load('/models/full_jaw.obj', (obj) => {
      if (!active) return;

      const toothMat  = new THREE.MeshPhysicalMaterial({
        color: '#f0ebe0',
        emissive: '#c8b89a',
        emissiveIntensity: 0.25,
        roughness: 0.14,
        metalness: 0,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
        side: THREE.DoubleSide,
      });
      const gumMat    = new THREE.MeshStandardMaterial({ color: '#c8506a', roughness: 0.72, side: THREE.DoubleSide });
      const tongueMat = new THREE.MeshStandardMaterial({ color: '#c06070', roughness: 0.85, side: THREE.DoubleSide });

      obj.traverse(child => {
        if (!child.isMesh) return;
        child.geometry.computeVertexNormals();
        child.raycast = () => {};
        const matName = child.material?.name ?? '';
        if (matName === 'blinn3SG')      child.material = gumMat;
        else if (matName === 'blinn6SG') child.material = tongueMat;
        else                             child.material = toothMat;
        child.castShadow = true;
      });

      setModel(obj);
    });

    return () => { active = false; };
  }, []);

  if (!model) return null;

  const scale = 0.7;
  return (
    <primitive
      object={model}
      dispose={null}
      position={[-2.9 * scale, -2.36 * scale, 0.26 * scale]}
      scale={[scale, scale, scale]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Individual tooth — invisible hitbox for clicking + status overlay
// ─────────────────────────────────────────────────────────────────────────────
function Tooth({ tooth, status, onClick }) {
  const [hovered, setHovered] = useState(false);

  const { rx, rz, h } = tooth;
  const isUpper = tooth.arch === 'upper';

  return (
    <group
      position={[tooth.x, tooth.y, tooth.z]}
      rotation={[0, tooth.rotationY, 0]}
      onClick={e => { e.stopPropagation(); onClick(tooth); }}
      onPointerOver={e => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default'; }}
    >
      {/* Invisible box — receives raycasts so the tooth is clickable */}
      <mesh>
        <boxGeometry args={[rx * 2.2, h * 1.4, rz * 2.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* ── Status dot (world-space, always above the tooth) ─────────── */}
      {status !== 'healthy' && (
        <mesh position={[0, isUpper ? h / 2 + 0.28 : -(h / 2 + 0.28), 0]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial
            color={STATUS_COLORS[status]}
            emissive={STATUS_COLORS[status]}
            emissiveIntensity={0.8}
          />
        </mesh>
      )}

      {/* ── Hover tooltip ─────────────────────────────────────────────── */}
      {hovered && (
        <Html
          position={[0, isUpper ? h / 2 + 0.60 : -(h / 2 + 0.60), 0]}
          center
          distanceFactor={6}
          zIndexRange={[100, 200]}
        >
          <div style={{
            background:   'rgba(8,14,28,0.92)',
            color:        '#dce8ff',
            padding:      '4px 11px',
            borderRadius: 6,
            fontSize:     11,
            fontFamily:   'Inter, sans-serif',
            whiteSpace:   'nowrap',
            pointerEvents:'none',
            boxShadow:    '0 2px 8px rgba(0,0,0,0.6)',
          }}>
            #{tooth.number} · {tooth.name}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Arch — invisible hitboxes + status indicators for one jaw
// ─────────────────────────────────────────────────────────────────────────────
function Arch({ teeth, statuses, onToothClick }) {
  return (
    <group>
      {teeth.map(tooth => (
        <Tooth
          key={tooth.id}
          tooth={tooth}
          status={statuses[tooth.id] || 'healthy'}
          onClick={onToothClick}
        />
      ))}
    </group>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene root
// ─────────────────────────────────────────────────────────────────────────────
export default function TeethScene({ statuses, onToothClick, showUpper, showLower }) {
  return (
    <Canvas
      camera={{ position: [0, 5.5, 7], fov: 40, near: 0.1, far: 100 }}
      style={{ background: '#0c1522', borderRadius: 12 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.1 }}
      shadows={{ type: THREE.PCFShadowMap }}
    >
      {/* Lighting that mimics a dental operatory lamp */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[3, 12, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-4, 6, -3]} intensity={0.55} color="#cce0ff" />
      <pointLight position={[0, 2.5, 2]}  intensity={0.40} color="#fff8ec" />
      <pointLight position={[0, -2.5, 2]} intensity={0.30} color="#fff8ec" />

      {/* Studio HDRI gives realistic clearcoat reflections on enamel */}
      <Environment preset="studio" />

      <OrbitControls
        enablePan
        minDistance={2}
        maxDistance={18}
        target={[0, 0, 0]}
      />

      {/* OBJ jaw model — visual only, raycasting disabled */}
      <JawModel />

      {/* Invisible click targets + status overlays per tooth */}
      {showUpper && (
        <Arch
          teeth={UPPER_TEETH}
          statuses={statuses}
          onToothClick={onToothClick}
        />
      )}
      {showLower && (
        <Arch
          teeth={LOWER_TEETH}
          statuses={statuses}
          onToothClick={onToothClick}
        />
      )}
    </Canvas>
  );
}
