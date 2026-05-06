export const GARMENT_IMAGES = {
  hoodie: {
    black: {
      front: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/hoodie-black-front-v3.jpg",
      back: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/hoodie-black-back-v3.jpg",
    },
    white: {
      front: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/hoodie-cream-front-v4.jpg",
      back: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/hoodie-cream-back-v4.jpg",
    },
  },
  cap: {
    black: {
      front: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/cap-black-front-v5.jpg",
    },
    white: {
      // Only one cap color on hand - cream cap NOT sold. Keep same black image here
      // so the UI still works if someone selects "cream" by accident (but Shopify cream cap
      // variant should be disabled/unpublished for now).
      front: "https://guhctceu21hc4orl.public.blob.vercel-storage.com/cap-black-front-v5.jpg",
    },
  },
} as const;

export type Product = "hoodie" | "cap";
export type Color = "black" | "white";
export type View = "front" | "back";
export type Size = "S" | "M" | "L";
export type Style = "outline" | "standard" | "pet-head" | "car";

export const SIZE_CONSTRAINTS = {
  S: { min: 60, max: 130, label: "45-100mm" },
  M: { min: 130, max: 190, label: "100-150mm" },
  L: { min: 190, max: 260, label: "150-250mm" },
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
