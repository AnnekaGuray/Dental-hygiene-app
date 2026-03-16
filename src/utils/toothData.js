// Universal Numbering System: 1–32
// Upper arch: 1 (upper-right wisdom) → 16 (upper-left wisdom)
// Lower arch: 17 (lower-left wisdom) → 32 (lower-right wisdom)

const TOOTH_SIZES = {
  wisdom:   { rx: 0.26, rz: 0.28, h: 0.42 },
  molar:    { rx: 0.28, rz: 0.32, h: 0.48 },
  premolar: { rx: 0.20, rz: 0.22, h: 0.46 },
  canine:   { rx: 0.15, rz: 0.16, h: 0.54 },
  incisor:  { rx: 0.13, rz: 0.18, h: 0.46 },
};

const UPPER_TYPES = [
  'wisdom','molar','molar','premolar','premolar','canine','incisor','incisor',
  'incisor','incisor','canine','premolar','premolar','molar','molar','wisdom',
];
const LOWER_TYPES = [...UPPER_TYPES]; // symmetric

const UPPER_NAMES = [
  'UR Wisdom','UR 2nd Molar','UR 1st Molar','UR 2nd Premolar','UR 1st Premolar','UR Canine','UR Lateral Incisor','UR Central Incisor',
  'UL Central Incisor','UL Lateral Incisor','UL Canine','UL 1st Premolar','UL 2nd Premolar','UL 1st Molar','UL 2nd Molar','UL Wisdom',
];
const LOWER_NAMES = [
  'LL Wisdom','LL 2nd Molar','LL 1st Molar','LL 2nd Premolar','LL 1st Premolar','LL Canine','LL Lateral Incisor','LL Central Incisor',
  'LR Central Incisor','LR Lateral Incisor','LR Canine','LR 1st Premolar','LR 2nd Premolar','LR 1st Molar','LR 2nd Molar','LR Wisdom',
];

// Arch: semi-ellipse in the XZ plane.
// angle 0→π maps from right-back → front-center → left-back
function archPositions(count, a, b, flipX = false) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / (count - 1)) * Math.PI;
    const x = a * Math.cos(angle) * (flipX ? -1 : 1);
    const z = -b * Math.sin(angle);
    return { x, z };
  });
}

const upperPos = archPositions(16, 3.2, 2.2);
const lowerPos = archPositions(16, 3.0, 2.0, true); // flipped: L→R for lower arch

export const UPPER_TEETH = upperPos.map((pos, i) => ({
  id: i + 1,
  number: i + 1,
  name: UPPER_NAMES[i],
  type: UPPER_TYPES[i],
  arch: 'upper',
  y: 0.55,
  ...pos,
  ...TOOTH_SIZES[UPPER_TYPES[i]],
}));

export const LOWER_TEETH = lowerPos.map((pos, i) => ({
  id: i + 17,
  number: i + 17,
  name: LOWER_NAMES[i],
  type: LOWER_TYPES[i],
  arch: 'lower',
  y: -0.55,
  ...pos,
  ...TOOTH_SIZES[LOWER_TYPES[i]],
}));

export const ALL_TEETH = [...UPPER_TEETH, ...LOWER_TEETH];

export const STATUS_COLORS = {
  healthy:   '#f5f0e8',
  watch:     '#fbbf24',
  attention: '#ef4444',
};

export const STATUS_LABELS = {
  healthy:   'Healthy',
  watch:     'Monitor',
  attention: 'Needs Attention',
};
