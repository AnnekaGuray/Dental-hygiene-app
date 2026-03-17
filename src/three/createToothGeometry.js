import * as THREE from 'three';

/**
 * Creates a realistic tapered crown geometry for a tooth.
 *
 * The crown is built as a lofted surface: a series of elliptical cross-sections
 * that evolve from the cervical margin (wide, at the gum line) to the occlusal
 * surface (narrower, with type-specific profile).
 *
 * @param {string} type   - 'incisor' | 'canine' | 'premolar' | 'molar' | 'wisdom'
 * @param {number} rx     - mesiodistal half-width
 * @param {number} rz     - bucco-lingual half-depth
 * @param {number} h      - crown height
 */
export function createCrownGeometry(type, rx, rz, h) {
  const RAD = 28;   // radial segments (smoothness around the circumference)
  const HGT = 22;   // height segments (loft resolution)

  /**
   * Returns [xScale, zScale] at normalised height t (0 = cervical, 1 = occlusal).
   * These scale factors change the cross-section shape up the crown.
   */
  function profile(t) {
    switch (type) {

      // ── Incisor ──────────────────────────────────────────────────────────
      // Key: almost flat at the occlusal (incisal) edge.
      // Wide mesiodistally; thins dramatically in the bucco-lingual direction.
      case 'incisor':
        return [
          1.0 - t * 0.26 + t * t * 0.06,   // slight narrowing then stabilises
          1.0 - t * 0.82 + t * t * 0.22,   // thins to ~20% – creates the chisel
        ];

      // ── Canine ───────────────────────────────────────────────────────────
      // Oval at the base; tapers steeply to a blunt point.
      case 'canine':
        return [
          1.0 - t * 0.52 + t * t * 0.10,
          1.0 - t * 0.58 + t * t * 0.12,
        ];

      // ── Premolar ─────────────────────────────────────────────────────────
      // Characteristic cervical constriction (waist) in the middle third,
      // then flares slightly for the two buccal/lingual cusps.
      case 'premolar': {
        const waist = 1.0 - 0.16 * Math.sin(Math.pow(t, 0.6) * Math.PI);
        return [
          waist * (1.0 - t * 0.09),
          waist * (1.0 - t * 0.09),
        ];
      }

      // ── Molar / Wisdom ───────────────────────────────────────────────────
      // Cervical bulge in the lower third (convex toward the furcation),
      // then narrows as it meets the four cusps.
      case 'molar':
      case 'wisdom':
      default: {
        const bulge = 1.0 + 0.07 * Math.sin(t * Math.PI * 0.45);
        return [
          bulge * (1.0 - t * 0.19),
          bulge * (1.0 - t * 0.19),
        ];
      }
    }
  }

  const W = RAD + 1;
  const positions = [];
  const indices   = [];

  // ── Build loft rings ────────────────────────────────────────────────────
  for (let j = 0; j <= HGT; j++) {
    const t = j / HGT;
    const y = (t - 0.5) * h;
    const [sx, sz] = profile(t);

    for (let i = 0; i <= RAD; i++) {
      const theta = (i / RAD) * Math.PI * 2;
      positions.push(
        Math.cos(theta) * rx * sx,
        y,
        Math.sin(theta) * rz * sz,
      );
    }
  }

  // ── Quad faces between adjacent rings ──────────────────────────────────
  for (let j = 0; j < HGT; j++) {
    for (let i = 0; i < RAD; i++) {
      const a = j * W + i;
      const b = a + 1;
      const c = a + W;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  // ── Cervical cap (bottom) ──────────────────────────────────────────────
  const bc = positions.length / 3;
  positions.push(0, -h / 2, 0);
  for (let i = 0; i < RAD; i++) indices.push(bc, i + 1, i);

  // ── Occlusal cap (top) ─────────────────────────────────────────────────
  const topRing = HGT * W;
  const tc = positions.length / 3;
  positions.push(0, h / 2, 0);
  for (let i = 0; i < RAD; i++) indices.push(tc, topRing + i, topRing + i + 1);

  const geo = new THREE.BufferGeometry();
  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals();
  return geo;
}
