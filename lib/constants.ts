import type { Style } from "@/lib/garment-images";

export const VARIANT_IDS: Record<string, string> = {
  // Hoodie Black
  "hoodie-black-S-outline": "56937201041739",
  "hoodie-black-S-standard": "56937201074507",
  "hoodie-black-S-photo-stitch": "56937201107275",
  "hoodie-black-S-pet-head": "56937201140043",
  "hoodie-black-M-outline": "56937201172811",
  "hoodie-black-M-standard": "56937201205579",
  "hoodie-black-M-photo-stitch": "56937201238347",
  "hoodie-black-M-pet-head": "56937201271115",
  "hoodie-black-L-outline": "56937201303883",
  "hoodie-black-L-standard": "56937201336651",
  "hoodie-black-L-photo-stitch": "56937201369419",
  "hoodie-black-L-pet-head": "56937201402187",
  // Hoodie White
  "hoodie-white-S-outline": "56937179152715",
  "hoodie-white-S-standard": "56937179185483",
  "hoodie-white-S-photo-stitch": "56937179218251",
  "hoodie-white-S-pet-head": "56937179251019",
  "hoodie-white-M-outline": "56937179283787",
  "hoodie-white-M-standard": "56937179316555",
  "hoodie-white-M-photo-stitch": "56937179349323",
  "hoodie-white-M-pet-head": "56937179382091",
  "hoodie-white-L-outline": "56937193275723",
  "hoodie-white-L-standard": "56937193308491",
  "hoodie-white-L-photo-stitch": "56937193341259",
  "hoodie-white-L-pet-head": "56937193374027",
  // Cap Black
  "cap-black-S-outline": "56937206317387",
  "cap-black-S-standard": "56937206350155",
  "cap-black-S-photo-stitch": "56937206382923",
  "cap-black-S-pet-head": "56937206415691",
  "cap-black-M-outline": "56937206448459",
  "cap-black-M-standard": "56937206481227",
  "cap-black-M-photo-stitch": "56937206513995",
  "cap-black-M-pet-head": "56937206546763",
  // Cap White
  "cap-white-S-outline": "56937204482379",
  "cap-white-S-standard": "56937204515147",
  "cap-white-S-photo-stitch": "56937204547915",
  "cap-white-S-pet-head": "56937204580683",
  "cap-white-M-outline": "56937204613451",
  "cap-white-M-standard": "56937204646219",
  "cap-white-M-photo-stitch": "56937204678987",
  "cap-white-M-pet-head": "56937204711755",
  // Hoodie Black — Front + Back
  "hoodie-black-S-outline-fb": "56975651111243",
  "hoodie-black-S-standard-fb": "56975651144011",
  "hoodie-black-S-photo-stitch-fb": "56975651176779",
  "hoodie-black-S-pet-head-fb": "56975651209547",
  "hoodie-black-M-outline-fb": "56975651242315",
  "hoodie-black-M-standard-fb": "56975651275083",
  "hoodie-black-M-photo-stitch-fb": "56975651307851",
  "hoodie-black-M-pet-head-fb": "56975651340619",
  "hoodie-black-L-outline-fb": "56975651373387",
  "hoodie-black-L-standard-fb": "56975651406155",
  "hoodie-black-L-photo-stitch-fb": "56975651438923",
  "hoodie-black-L-pet-head-fb": "56975651471691",
  // Hoodie White — Front + Back
  "hoodie-white-S-outline-fb": "56975651504459",
  "hoodie-white-S-standard-fb": "56975651537227",
  "hoodie-white-S-photo-stitch-fb": "56975651569995",
  "hoodie-white-S-pet-head-fb": "56975651602763",
  "hoodie-white-M-outline-fb": "56975651635531",
  "hoodie-white-M-standard-fb": "56975651668299",
  "hoodie-white-M-photo-stitch-fb": "56975651701067",
  "hoodie-white-M-pet-head-fb": "56975651733835",
  "hoodie-white-L-outline-fb": "56975651766603",
  "hoodie-white-L-standard-fb": "56975651799371",
  "hoodie-white-L-photo-stitch-fb": "56975651832139",
  "hoodie-white-L-pet-head-fb": "56975651864907",
};

export const PRICING: Record<string, Record<string, Record<string, number>>> = {
  hoodie: {
    outline:        { S: 59, M: 69, L: 99  },
    standard:       { S: 69, M: 79, L: 109 },
    "pet-head":     { S: 79, M: 89, L: 129 },
    car:            { S: 79, M: 89, L: 129 },
  },
  cap: {
    outline:        { S: 39, M: 49 },
    standard:       { S: 45, M: 55 },
    "pet-head":     { S: 55, M: 65 },
    car:            { S: 55, M: 65 },
  },
};

export const BACK_SURCHARGE: Record<string, Record<string, number>> = {
  outline:    { S: 17, M: 28, L: 40 },
  standard:   { S: 19, M: 35, L: 50 },
  "pet-head": { S: 22, M: 41, L: 50 },
  car:        { S: 22, M: 41, L: 50 },
};

export const TEXT_COLOR_PALETTE = [
  { id: "auto",   hex: "",        label: "Default" },
  { id: "white",  hex: "#FFFFFF", label: "White"   },
  { id: "black",  hex: "#000000", label: "Black"   },
  { id: "red",    hex: "#D8315B", label: "Red"     },
  { id: "blue",   hex: "#3E92CC", label: "Blue"    },
  { id: "navy",   hex: "#0A2463", label: "Navy"    },
  { id: "yellow", hex: "#F5C518", label: "Yellow"  },
  { id: "green",  hex: "#2E7D32", label: "Green"   },
  { id: "orange", hex: "#E55934", label: "Orange"  },
  { id: "pink",   hex: "#E94B7B", label: "Pink"    },
  { id: "gold",   hex: "#C9A227", label: "Gold"    },
  { id: "silver", hex: "#C0C0C0", label: "Silver"  },
];

export const TEXT_FONTS = [
  { id: "montserrat", name: "Montserrat", css: "'Montserrat', sans-serif",   fontVariant: "normal" },
  { id: "anton",      name: "Anton",      css: "'Anton', sans-serif",         fontVariant: "normal" },
  { id: "quicksand",  name: "Quicksand",  css: "'Quicksand', sans-serif",     fontVariant: "normal" },
  { id: "greatvibes", name: "Great Vibes",css: "'Great Vibes', cursive",      fontVariant: "normal" },
  { id: "sacramento", name: "Sacramento", css: "'Sacramento', cursive",       fontVariant: "normal" },
  { id: "cinzel",     name: "Cinzel",     css: "'Cinzel', serif",             fontVariant: "normal" },
];

export const TEXT_PRICE = 12;
export const TEXT_MAX_CHARS = 20;
export const TEXT_MAX_CHARS_MULTIROW = 20;
export const TEXT_SIZE_PX: Record<"S" | "M" | "L", number> = { S: 12, M: 22, L: 37 };
export const TEXT_SIZE_CONSTRAINTS = {
  S: { min: 9,  max: 16, label: "8-14mm"  },
  M: { min: 17, max: 28, label: "15-25mm" },
  L: { min: 29, max: 45, label: "26-40mm" },
} as const;
export const TEXT_ADDON_VARIANT_ID = "57137410703691";

export const SLEEVE_PRICE = 25;
export const SLEEVE_TEXT_PRICE = 12;
export const SLEEVE_TEXT_MAX_CHARS = 10;
export const SLEEVE_DESIGN_SIZE_PX = 85;
export const SLEEVE_SIZE_CONSTRAINTS = {
  min: Math.round(SLEEVE_DESIGN_SIZE_PX / 4),
  max: SLEEVE_DESIGN_SIZE_PX,
} as const;
export const SLEEVE_PHOTO_ADDON_VARIANT_ID = "57473281982795";

export const MAX_DESIGNS_PER_SIDE = 3;

export const ADDITIONAL_DESIGN_PRICING: Record<Style, Record<"S" | "M", number>> = {
  outline:    { S: 17, M: 35 },
  standard:   { S: 21, M: 41 },
  "pet-head": { S: 21, M: 41 },
  car:        { S: 21, M: 41 },
};

export const ADDITIONAL_DESIGN_VARIANT_IDS: Record<Style, Record<"S" | "M", string>> = {
  outline:    { S: "57443339469131", M: "57443339501899" },
  standard:   { S: "57443339534667", M: "57443339567435" },
  "pet-head": { S: "57443339600203", M: "57443339632971" },
  car:        { S: "57443339665739", M: "57443339698507" },
};
