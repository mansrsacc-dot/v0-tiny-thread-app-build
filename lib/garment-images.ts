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

// NOTE: Embroidery design size pixel ranges keyed by S/M/L.
// Coordinate system: canvas ~780px tall → 700mm hoodie → 1mm ≈ 1.11px.
// RENDER_SCALE 0.55 is applied at render time (currentSizePx × sizeScale).
// Targets at typical desktop preview (~560px wide, sizeScale ≈ 0.77):
//   S ≈ 1/5 of hoodie chest  →  rendered ~10% of canvas
//   M ≈ 1/3 of hoodie chest  →  rendered ~16% of canvas
//   L ≈ 1/2 of hoodie chest  →  rendered ~25% of canvas
// Garment size (incl. XL) is selected on the Shopify product page before app load.
// Each tier's max is +10% over its previous top mm (S 80→88, M 125→137, L 185→204), and a
// picked size now DEFAULTS to that max. mm is always px × 700/780, so preview/label/email agree.
export const SIZE_CONSTRAINTS = {
  S: { min: 45,  max: 98,  label: "40-88mm"   },
  M: { min: 85,  max: 153, label: "75-137mm"  },
  L: { min: 140, max: 227, label: "125-204mm" },
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
