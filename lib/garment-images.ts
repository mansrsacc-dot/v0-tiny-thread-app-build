export const GARMENT_IMAGES = {
  hoodie: {
    black: {
      front: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
      back: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
    },
    white: {
      // Cream version: AI-recolored from black mockups (nano-banana)
      front: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/hoodie-front-cream-v8.jpg",
      back: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/hoodie-back-cream-v8.jpg",
    },
  },
  cap: {
    black: {
      front: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
    },
    white: {
      // Cream version: AI-recolored from black cap mockup
      front: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/cap-front-cream-v8.jpg",
    },
  },
} as const;

export type Product = "hoodie" | "cap";
export type Color = "black" | "white";
export type View = "front" | "back" | "left-sleeve" | "right-sleeve";
export type Size = "S" | "M" | "L";
export type Style = "outline" | "standard" | "pet-head" | "car";

// ── Real-world scale via an INVISIBLE reference zone ─────────────────────────────────────────
// Per GARMENT size, the real max embroidery area (height × width, mm). NEVER drawn — it is purely
// the basis for px ↔ real-mm conversion and for scaling the preview so a design looks the right
// size on each hoodie. The design canvas width represents the zone WIDTH, so a design of `mm`
// renders at mm / zoneWidth of the canvas → the same real mm looks bigger on a smaller hoodie.
export const EMBROIDERY_ZONES = {
  S:  { width: 450, height: 300 },
  M:  { width: 500, height: 300 },
  L:  { width: 500, height: 340 },
  XL: { width: 530, height: 360 },
} as const;

const CANVAS_UNITS = 780; // internal design-canvas width, in currentSizePx units
const ZONE_REF_MM = 500;  // canvas width in mm = the M/L zone width (so render scale = 1.0 there)

// TRUE stitched size of a design in mm — INDEPENDENT of hoodie size (a 150mm design is 150mm on
// any hoodie). Drives the on-screen "~XXmm" label AND the designer-email mm. mm = px × 500/780.
export const pxToMm = (px: number) => Math.round((px * ZONE_REF_MM) / CANVAS_UNITS);
export const mmToPx = (mm: number) => Math.round((mm * CANVAS_UNITS) / ZONE_REF_MM);

// The embroidery zone (chest patch) spans only THIS fraction of the preview/mockup width — it is
// a sub-region of the hoodie photo, NOT the whole canvas. So a design of `mm` renders at
// (mm / zoneWidth) of the zone, i.e. (mm / zoneWidth) × ZONE_PREVIEW_WIDTH_FRACTION of the canvas.
// TUNE THIS to match where the chest sits in the photo: raise it if designs look too small, lower
// if too big. (At 0.33 a 150mm design in a 450mm zone = ⅓ of the zone = ~11% of the canvas width.)
const ZONE_PREVIEW_WIDTH_FRACTION = 0.33;

// VISUAL-ONLY on-screen scale per garment size (used by BOTH the live preview and the email
// mockup). currentSizePx maps to canvas units; multiply by this so the design shows at its real
// proportion of the zone. Narrower zone (smaller hoodie) → same mm looks slightly bigger.
export const designRenderScale = (garmentSize: string): number =>
  ZONE_PREVIEW_WIDTH_FRACTION * (ZONE_REF_MM / (EMBROIDERY_ZONES[garmentSize as keyof typeof EMBROIDERY_ZONES]?.width ?? ZONE_REF_MM));

// Embroidery size tiers — real stitched mm, independent of hoodie size. A picked tier DEFAULTS to
// its `max` (the tier mm: S=70 / M=110 / L=150; L=150 = practical max); the customer can drag down
// to `min`. px = mmToPx(mm); mm reads back as pxToMm(px). One conversion → preview, label, email.
export const SIZE_CONSTRAINTS = {
  S: { min: 62,  max: 109, label: "70mm"  }, // mmToPx: 40→62, 70→109
  M: { min: 78,  max: 172, label: "110mm" }, // 50→78, 110→172
  L: { min: 109, max: 234, label: "150mm" }, // 70→109, 150→234
} as const;

export const STYLES = [
  {
    id: "outline" as Style,
    name: "Kontūra",
    description: "Minimālistiska līniju grafika",
    bestFor: "portreti, minimālistiski dizaini, paraksti",
  },
  {
    id: "standard" as Style,
    name: "Standarta Logo",
    description: "Tīrs, plakans dizains",
    bestFor: "logo, teksts, emblēmas",
  },
  {
    id: "pet-head" as Style,
    name: "Mīluļa Portrets",
    description: "Izšūts mājdzīvnieka portrets",
    bestFor: "viena mājdzīvnieka tuvplāns",
  },
  {
    id: "car" as Style,
    name: "Mašīnas izšuvums",
    description: "Detalizēts auto portrets",
    bestFor: "auto, motocikli, transportlīdzekļi",
  },
] as const;
