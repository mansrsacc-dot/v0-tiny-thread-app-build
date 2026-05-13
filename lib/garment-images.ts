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
export type View = "front" | "back";
export type Size = "S" | "M" | "L" | "XL";
export type Style = "outline" | "standard" | "pet-head" | "car";

// NOTE: Size here refers to the GARMENT (hoodie) size — S/M/L/XL.
// Embroidery design size is a separate pixel range tied to the garment size.
export const SIZE_CONSTRAINTS = {
  S:  { min: 60,  max: 130, label: "45-100mm"  },
  M:  { min: 130, max: 190, label: "100-150mm" },
  L:  { min: 190, max: 260, label: "150-250mm" },
  XL: { min: 190, max: 260, label: "150-250mm" },
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
