// Universal Numbering System: 1–32
// Upper arch: 1 (upper-right wisdom) → 16 (upper-left wisdom)
// Lower arch: 17 (lower-left wisdom) → 32 (lower-right wisdom)

// Tooth sizes in scene units (roughly 10× real mm scale)
// rx = mesiodistal half-width, rz = bucco-lingual half-depth, h = crown height
const TOOTH_SIZES = {
  wisdom:   { rx: 0.24, rz: 0.26, h: 0.38 },
  molar:    { rx: 0.26, rz: 0.28, h: 0.44 },
  premolar: { rx: 0.18, rz: 0.22, h: 0.42 },
  canine:   { rx: 0.15, rz: 0.16, h: 0.50 },
  // Incisors are the KEY: very thin (rz=0.07) so they look like chisel/paddle shapes
  incisor:  { rx: 0.19, rz: 0.07, h: 0.42 },
};

const UPPER_TYPES = [
  'wisdom','molar','molar','premolar','premolar','canine','incisor','incisor',
  'incisor','incisor','canine','premolar','premolar','molar','molar','wisdom',
];
const LOWER_TYPES = [...UPPER_TYPES];

const UPPER_NAMES = [
  'UR Wisdom','UR 2nd Molar','UR 1st Molar','UR 2nd Premolar','UR 1st Premolar','UR Canine','UR Lateral Incisor','UR Central Incisor',
  'UL Central Incisor','UL Lateral Incisor','UL Canine','UL 1st Premolar','UL 2nd Premolar','UL 1st Molar','UL 2nd Molar','UL Wisdom',
];
const LOWER_NAMES = [
  'LL Wisdom','LL 2nd Molar','LL 1st Molar','LL 2nd Premolar','LL 1st Premolar','LL Canine','LL Lateral Incisor','LL Central Incisor',
  'LR Central Incisor','LR Lateral Incisor','LR Canine','LR 1st Premolar','LR 2nd Premolar','LR 1st Molar','LR 2nd Molar','LR Wisdom',
];

// Semi-ellipse arch.  angle 0→π = right-back → front → left-back
// rotationY makes each tooth face radially outward from the arch center.
function archPositions(count, a, b, flipX = false) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / (count - 1)) * Math.PI;
    const x = a * Math.cos(angle) * (flipX ? -1 : 1);
    const z = -b * Math.sin(angle);

    // Face tooth outward from arch centre.
    // Formula derived from ellipse tangent: rotY = atan2((b/a)·x, (a/b)·z)
    // For the flipped lower arch the sign flips on both axes.
    const rotationY = flipX
      ? Math.atan2(-(b / a) * x, -(a / b) * z)
      : Math.atan2((b / a) * x, (a / b) * z);

    return { x, z, rotationY };
  });
}

const upperPos = archPositions(16, 3.2, 2.2);
const lowerPos = archPositions(16, 3.0, 2.0, true);

export const UPPER_TEETH = upperPos.map((pos, i) => ({
  id: i + 1,
  number: i + 1,
  name: UPPER_NAMES[i],
  type: UPPER_TYPES[i],
  arch: 'upper',
  y: 0.50,
  ...pos,
  ...TOOTH_SIZES[UPPER_TYPES[i]],
}));

export const LOWER_TEETH = lowerPos.map((pos, i) => ({
  id: i + 17,
  number: i + 17,
  name: LOWER_NAMES[i],
  type: LOWER_TYPES[i],
  arch: 'lower',
  y: -0.50,
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

// Arch parameters exported so TeethScene can build gum geometry
export const UPPER_ARCH = { a: 3.2, b: 2.2 };
export const LOWER_ARCH = { a: 3.0, b: 2.0 };
export const GUM_Y = { upper: 0.12, lower: -0.12 };
