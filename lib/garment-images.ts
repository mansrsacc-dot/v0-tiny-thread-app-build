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
// VISUAL-ONLY: this scales the on-screen/email mockup render of designs. It does NOT touch pxToMm,
// so the "~XXmm" label, designer-email mm, and cart mm are unchanged. Bumped 0.33 → 0.4125 (+25%)
// so designs appear 25% bigger on the preview while the true stitched mm stays exactly the same.
const ZONE_PREVIEW_WIDTH_FRACTION = 0.4125;

// VISUAL-ONLY on-screen scale per garment size (used by BOTH the live preview and the email
// mockup). currentSizePx maps to canvas units; multiply by this so the design shows at its real
// proportion of the zone. Narrower zone (smaller hoodie) → same mm looks slightly bigger.
export const designRenderScale = (garmentSize: string): number =>
  ZONE_PREVIEW_WIDTH_FRACTION * (ZONE_REF_MM / (EMBROIDERY_ZONES[garmentSize as keyof typeof EMBROIDERY_ZONES]?.width ?? ZONE_REF_MM));

// Embroidery size tiers — each is an adjustable mm RANGE (min–max), independent of hoodie size.
// A picked tier DEFAULTS to the MIDPOINT of its range; the customer resizes anywhere from min to
// max. px = mmToPx(mm) = mm × 780/500; mm reads back as pxToMm(px) = px × 500/780. The shown mm is
// pxToMm(px) × contentScale (true visible-artwork size) — one conversion → preview, label, email.
export const SIZE_CONSTRAINTS = {
  S: { min: 62,  max: 109, label: "40-70mm"   }, // mmToPx: 40→62, 70→109; midpoint ~55mm
  M: { min: 111, max: 187, label: "71-120mm"  }, // 71→111, 120→187;       midpoint ~95mm
  L: { min: 189, max: 273, label: "121-175mm" }, // 121→189, 175→273;      midpoint ~148mm
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
    name: "Klasiskais",
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
