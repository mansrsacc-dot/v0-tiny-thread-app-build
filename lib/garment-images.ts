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

// Embroidery design size, keyed by S/M/L. Values are currentSizePx in the internal 780-unit
// design space. Real-world mm = px × 700/780 (so the 780-unit-wide canvas = 700mm). The SAME
// conversion drives the preview render, the on-screen "~XXmm" label, and the designer-email mm,
// so all three stay in sync. px = mm × 780/700. A picked size DEFAULTS to its max → S=70 / M=100
// / L=140 mm; the customer can drag down to the min within a tier. (Garment size incl. XL is
// chosen on the Shopify product page; it does not affect embroidery size or price.)
export const SIZE_CONSTRAINTS = {
  S: { min: 45,  max: 78,  label: "40-70mm"   },
  M: { min: 79,  max: 111, label: "71-100mm"  },
  L: { min: 113, max: 156, label: "101-140mm" },
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
