export const GARMENT_IMAGES = {
  hoodie: {
    black: {
      front: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-front-L8JNMTYtT2Xneu4ym3Ax12fau4pIHq.jpg",
      back: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-black-back-Lfr4AB79XMlYiUB9Qa9V4CSpdwQJQM.jpg",
    },
    white: {
      front: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-front-k4zZvfmeQ2iVRi7MzQy94KPnW4ebyY.jpg",
      back: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hoodie-white-back.jpg-X5I6sYplyDPZPlPnUEP1gK81mtIe8Q.jpeg",
    },
  },
  cap: {
    black: {
      front: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-black-front.jpg-MIVejSe8JWwmgLY47q8dnpjKC393xd.jpeg",
    },
    white: {
      front: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/cap-white-front-kYisZ76gyCeeLb3IYogIXdTJo7mXkO.jpg",
    },
  },
} as const;

export type Product = "hoodie" | "cap";
export type Color = "black" | "white";
export type View = "front" | "back";
export type Size = "S" | "M" | "L";
export type Style = "outline" | "standard" | "photo-stitch" | "pet-head";

export const SIZE_CONSTRAINTS = {
  S: { min: 60, max: 130, label: "45-100mm" },
  M: { min: 130, max: 190, label: "100-150mm" },
  L: { min: 190, max: 260, label: "150-250mm" },
} as const;

export const STYLES = [
  {
    id: "outline" as Style,
    name: "Outline",
    description: "Elegant line-art style",
    bestFor: "portraits, minimalist designs, signatures",
  },
  {
    id: "standard" as Style,
    name: "Standard Logo",
    description: "Clean, sharp embroidery",
    bestFor: "logos, text, badges",
  },
  {
    id: "photo-stitch" as Style,
    name: "Photo Stitch",
    description: "Ultra-detailed thread painting",
    bestFor: "portraits, pets, cars",
  },
  {
    id: "pet-head" as Style,
    name: "Pet Head",
    description: "Embroidered pet face portrait",
    bestFor: "single pet close-up",
  },
] as const;
