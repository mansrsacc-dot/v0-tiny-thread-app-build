"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GARMENT_IMAGES, SIZE_CONSTRAINTS, STYLES, type Product, type Color, type View, type Size, type Style } from "@/lib/garment-images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Translations (LV primary, EN fallback via toggle)
export type Lang = "lv" | "en";
const T: Record<Lang, Record<string, string>> = {
  lv: {
    product: "Produkts",
    color: "Krāsa",
    view: "Skats",
    front: "Priekša",
    back: "Aizmugure",
    size: "Izmērs",
    style: "Stils",
    price: "Cena",
    uploadPhoto: "Augšupielādē foto",
    dropImageBrowse: "Ievelc attēlu vai izvēlies",
    browse: "izvēlies",
    maxFileSize: "JPG, PNG — maks. 10MB",
    clickToUpload: "Nospied, lai augšupielādētu foto",
    generating: "Ġenerē izšuvumu...",
    regenerate: "Ġenerēt vēlreiz",
    left: "atlicis",
    addToCart: "Pievienot grozam",
    addingToCart: "Pievieno grozam...",
    addToBack: "Pievienot izšuvumu aizmugurē",
    addToFront: "Pievienot izšuvumu priekšā",
    designLayers: "Dizaina slāņi",
    removeBackground: "Noņemt fonu",
    original: "Oriģināls",
    stitched: "Izšūts",
    howItWorks: "Kā tas strādā",
    bestFor: "Piemērots",
    fromPhotoToStitch: "No foto līdz izšuvumam",
    photoLabel: "Foto",
    resultLabel: "Rezultāts",
    petHeadHint: "Šis stils vislabāk strādā ar viena mājdzīvnieka sejas tuvplānu",
    designFilesSent: "Tavi dizaina faili tiks nosūtīti mūsu izšuvumu māksliniekiem",
    loading: "Ielādē...",
    myDesigns: "Mani dizaini",
    maxReached: "Sasniegts maks.",
    regenLeft: "atlicis",
    confirmTitle: "Vai esi pabeidzis?",
    confirmDesc: "Pārliecinies, ka tavs dizains izskatās tieši tā, kā vēlies. Pēc pasūtīšanas izmaiņas nav iespējamas.",
    confirmAddBack: "💡 Tu vēl vari pievienot izšuvumu aizmugurē pirms pasūtīšanas",
    confirmYes: "Jā, pievienot grozam",
    confirmNo: "Nē, vēlos vēl pielāgot",
    inclBack: "iekļ. aizmugure",
    welcome: "Laipni lūgti TinyThread Studijā",
    welcomeDesc: "Izveido savu pielāgoto izšuvumu dažu minūšu laikā",
    welcomePrompt: "Gribi uzzināt, kā studija strādā?",
    showGuide: "Apskatīt ceļvedi",
    skipGuide: "Izlaist",
    next: "Tālāk",
    back_btn: "Atpakaļ",
    getStarted: "Sāksim!",
    startCreating: "Sākt radīt",
    close: "Aizvērt",
    // Toasts
    noDesign: "Nav dizaina",
    noDesignDesc: "Lūdzu, vispirms augšupielādē un ģenerē dizainu.",
    notReady: "Nav gatavs",
    notReadyDesc: "Lūdzu, pagaidi, kamēr tiek izģenerēts izšuvuma priekšskatījums.",
    errorCart: "Kļūda pievienojot grozam",
    errorGeneric: "Kaut kas nogāja greizi. Lūdzu, mēģini vēlreiz.",
    error: "Kļūda",
    failedSave: "Neizdevās saglabāt dizainu",
    designSaved: "Dizains saglabāts!",
    designApplied: "Dizains pielietots!",
    pleaseLogin: "Lūdzu, ielogojies",
    pleaseLoginDesc: "Lai saglabātu dizainu, nepieciešams konts",
    // Style descriptions
    outlineDesc: "Minimālistiska līniju grafika",
    outlineBest: "portreti, minimālistiski dizaini, paraksti",
    standardDesc: "Tīrs, plakans dizains",
    standardBest: "logo, teksts, emblēmas",
    petHeadDesc: "Izšūts mājdzīvnieka portrets",
    petHeadBest: "viena mājdzīvnieka tuvplāns",
    carDesc: "Detalizēts auto portrets",
    carBest: "auto, motocikli, transportlīdzekļi",
    // Style names
    styleOutline: "Kontūra",
    styleStandard: "Standarta Logo",
    stylePetHead: "Mīluļa Portrets",
    styleCar: "Mašīnas izšuvums",
    // Product names
    hoodie: "Džemperis",
    cap: "Cepure",
    // Text feature
    addText: "Pievienot tekstu",
    textPlaceholder: "Ievadi tekstu...",
    textFont: "Fonts",
    textColor: "Krāsa",
    textColorAuto: "Auto",
    textColorWhite: "Balta",
    textColorBlack: "Melna",
    textColorRed: "Sarkana",
    textColorBlue: "Zila",
    textColorNavy: "Tumši zila",
    textColorYellow: "Dzeltena",
    textColorGreen: "Zaļa",
    textColorOrange: "Oranža",
    textColorPink: "Rozā",
    textColorGold: "Zelta",
    textColorSilver: "Sudraba",
    textCharsLeft: "simboli atlikuši",
    textPrice: "Tekstu pievienošana",
    textOnly: "Teksts",
    addTextCta: "Pievienot tekstu (+€12)",
    addTextFree: "Pievienot tekstu — BEZMAKSAS",
    textTooLong: "Maksimums 20 simboli",
    cancel: "Atcelt",
    leftSleeve: "Kreisā Piedurkne",
    rightSleeve: "Labā Piedurkne",
    sleeveSizeFixed: "Fiksēts",
    addToLeftSleeve: "Pievienot dizainu kreisajai piedurknei",
    addToRightSleeve: "Pievienot dizainu labajai piedurknei",
    sleeveTextTooLong: "Maksimums 10 simboli uz piedurknes",
    sleevePriceInfo: "Piedurkne ar dizainu",
    sleevePriceText: "Teksts uz piedurknes",
    inclSleeve: "iekļ. piedurkne",
    sleeveTextReminder: "Pievienojiet tekstu līdz 10 simboliem bez maksas!",
    carPlateQuestion: "Vai vēlaties lai tiktu iekļauta Jūsu numura zīme?",
    carPlateYes: "Jā",
    carPlateNo: "Nē",
    carPlateInputLabel: "Ievadiet numura zīmi",
    carPlateInputPlaceholder: "piem. NL725",
    carPlateConfirm: "Apstiprināt",
    orderMultiple: "Pasūtīt vairākus vienādus",
    orderMultipleTooltip: "Pasūtīt vienādu dizainu dažādos izmēros vai daudzumā draugiem, ģimenei vai grupai",
    orderMultipleTitle: "Pasūtīt vairākus vienādus",
    orderMultipleTotal: "Kopā",
    orderMultipleAddBtn: "Pievienot grozam",
    orderMultipleAdding: "Pievieno...",
    orderMultipleSizeNA: "Drīzumā",
    addAnotherDesign: "Pievienot vēl dizainu šai pusei",
    maxDesignsPerSide: "Maksimālais dizainu skaits šai pusei sasniegts",
    maxDesignsTitle: "Maksimums sasniegts",
    maxDesignsBody: "Vienā pusē iespējami maksimāli 3 dizaini + teksts.",
    maxDesignsOk: "Labi",
    additionalDesign: "Papildu dizains",
  },
  en: {
    product: "Product",
    color: "Color",
    view: "View",
    front: "Front",
    back: "Back",
    size: "Size",
    style: "Style",
    price: "Price",
    uploadPhoto: "Upload Photo",
    dropImageBrowse: "Drop image or",
    browse: "browse",
    maxFileSize: "JPG, PNG — max 10MB",
    clickToUpload: "Click to upload your photo",
    generating: "Generating embroidery...",
    regenerate: "Regenerate",
    left: "left",
    addToCart: "Add to Cart",
    addingToCart: "Adding to Cart...",
    addToBack: "Add embroidery to the back",
    addToFront: "Add embroidery to the front",
    designLayers: "Design Layers",
    removeBackground: "Remove Background",
    original: "Original",
    stitched: "Stitched",
    howItWorks: "How It Works",
    bestFor: "Best for",
    fromPhotoToStitch: "From photo to stitch",
    photoLabel: "Photo",
    resultLabel: "Result",
    petHeadHint: "This style works best with a single pet face in the photo",
    designFilesSent: "Your design files will be sent to our embroidery artists",
    loading: "Loading...",
    myDesigns: "My designs",
    maxReached: "Max reached",
    regenLeft: "left",
    confirmTitle: "Are you done?",
    confirmDesc: "Make sure your design looks exactly how you want it. Changes are not possible after ordering.",
    confirmAddBack: "💡 You can still add embroidery to the back before ordering",
    confirmYes: "Yes, add to cart",
    confirmNo: "No, I want to adjust more",
    inclBack: "incl. back",
    welcome: "Welcome to TinyThread Studio",
    welcomeDesc: "Create your custom embroidered garment in minutes",
    welcomePrompt: "Want to learn how the studio works?",
    showGuide: "View Guide",
    skipGuide: "Skip",
    next: "Next",
    back_btn: "Back",
    getStarted: "Get Started!",
    startCreating: "Start Creating",
    close: "Close",
    // Toasts
    noDesign: "No design",
    noDesignDesc: "Please upload and generate a design first.",
    notReady: "Not ready",
    notReadyDesc: "Please wait for the embroidery preview to generate.",
    errorCart: "Error adding to cart",
    errorGeneric: "Something went wrong. Please try again.",
    error: "Error",
    failedSave: "Failed to save design",
    designSaved: "Design saved!",
    designApplied: "Design applied!",
    pleaseLogin: "Please log in",
    pleaseLoginDesc: "You need an account to save designs",
    // Style descriptions
    outlineDesc: "Elegant line-art style",
    outlineBest: "portraits, minimalist designs, signatures",
    standardDesc: "Clean, sharp embroidery",
    standardBest: "logos, text, badges",
    petHeadDesc: "Embroidered pet face portrait",
    petHeadBest: "single pet close-up",
    carDesc: "Detailed car portrait",
    carBest: "cars, motorcycles, vehicles",
    // Style names
    styleOutline: "Outline",
    styleStandard: "Standard Logo",
    stylePetHead: "Pet Head",
    styleCar: "Car Embroidery",
    // Product names
    hoodie: "Hoodie",
    cap: "Cap",
    // Text feature
    addText: "Add Text",
    textPlaceholder: "Enter your text...",
    textFont: "Font",
    textColor: "Color",
    textColorAuto: "Auto",
    textColorWhite: "White",
    textColorBlack: "Black",
    textColorRed: "Red",
    textColorBlue: "Blue",
    textColorNavy: "Navy",
    textColorYellow: "Yellow",
    textColorGreen: "Green",
    textColorOrange: "Orange",
    textColorPink: "Pink",
    textColorGold: "Gold",
    textColorSilver: "Silver",
    textCharsLeft: "chars left",
    textPrice: "Text addition",
    textOnly: "Text",
    addTextCta: "Add Text (+€12)",
    addTextFree: "Add text — FREE",
    textTooLong: "Maximum 20 characters",
    cancel: "Cancel",
    leftSleeve: "Left Sleeve",
    rightSleeve: "Right Sleeve",
    sleeveSizeFixed: "Fixed",
    addToLeftSleeve: "Add design to left sleeve",
    addToRightSleeve: "Add design to right sleeve",
    sleeveTextTooLong: "Maximum 10 characters on sleeve",
    sleevePriceInfo: "Sleeve with design",
    sleevePriceText: "Text on sleeve",
    inclSleeve: "incl. sleeve",
    sleeveTextReminder: "Add up to 10 characters of text for free!",
    carPlateQuestion: "Would you like your license plate to be included?",
    carPlateYes: "Yes",
    carPlateNo: "No",
    carPlateInputLabel: "Enter your license plate",
    carPlateInputPlaceholder: "e.g. NL725",
    carPlateConfirm: "Confirm",
    orderMultiple: "Order multiple identical",
    orderMultipleTooltip: "Order the same design in multiple sizes or quantities for friends, family or groups",
    orderMultipleTitle: "Order multiple identical",
    orderMultipleTotal: "Total",
    orderMultipleAddBtn: "Add to Cart",
    orderMultipleAdding: "Adding...",
    orderMultipleSizeNA: "Coming soon",
    addAnotherDesign: "Add another design to this side",
    maxDesignsPerSide: "Maximum designs reached for this side",
    maxDesignsTitle: "Limit reached",
    maxDesignsBody: "Maximum 3 designs + text possible on 1 side.",
    maxDesignsOk: "OK",
    additionalDesign: "Additional design",
  },
};

// Product variant IDs - map from product+color+size+style to numeric variant ID
const VARIANT_IDS: Record<string, string> = {
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

// Pricing based on product, style, and size
const PRICING: Record<string, Record<string, Record<string, number>>> = {
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
  }
};

// Back embroidery surcharge by style
const BACK_SURCHARGE: Record<string, number> = {
  outline: 20,
  standard: 25,
  "pet-head": 35,
  car: 35,
};

// Guide content (LV and EN) — 4 steps
const GUIDE_CONTENT: Record<Lang, Array<{title: string; text: string; icon: string}>> = {
  en: [
    {
      title: "Choose Your Style",
      text: "Pick a hoodie or cap, select your color and embroidery size. S for small and subtle, L for large and bold.",
      icon: "👕",
    },
    {
      title: "Upload & Generate",
      text: "Upload any photo — your pet, car, portrait or any design. We transform it into an embroidery-ready design in seconds.",
      icon: "📸",
    },
    {
      title: "Preview & Perfect",
      text: "Drag to reposition, resize, add text. Switch between front and back. Regenerate up to 4 times until it's exactly right.",
      icon: "✨",
    },
    {
      title: "We Craft It For You",
      text: "Add to cart and order. Our embroidery artists in Riga handcraft your unique piece using professional equipment and premium thread. Delivery in 5–7 days.",
      icon: "💎",
    },
  ],
  lv: [
    {
      title: "Izvēlies savu stilu",
      text: "Izvēlies džemperi vai cepuri, krāsu un izšuvuma izmēru. S maziem un smalkiem dizainiem, L lieliem un izteiksmīgiem.",
      icon: "👕",
    },
    {
      title: "Augšupielādē un ģenerē",
      text: "Augšupielādē jebkuru foto — mīluli, automašīnu, portretu vai jebkuru dizainu. Mēs sekundēs pārveidojam to izšuvumam gatavā dizainā.",
      icon: "📸",
    },
    {
      title: "Izmanto savu iztēli",
      text: "Velciet, lai pārvietotu, mainītu izmēru vai pievienotu tekstu. Pārslēdzieties starp priekšu vai aizmuguri. Atjaunojiet līdz pat 4 reizēm, līdz rezultāts ir tieši tāds, kāds vajadzīgs.",
      icon: "✨",
    },
    {
      title: "Mēs to izgatavosim",
      text: "Ielieciet grozā un pasūtiet. Mūsu izšuvumu meistari Rīgā ar rokām izgatavos jūsu unikālo izstrādājumu, izmantojot profesionālu aprīkojumu un augstākās kvalitātes diegus. Piegāde 5–10 dienu laikā.",
      icon: "💎",
    },
  ],
};

declare global {
  interface Window {
    __tinyThreadOrder?: unknown;
  }
}

interface Design {
  id: string;
  originalImage: string;
  style: Style;
  view: View;
  size: Size;
  currentSizePx: number;
  position: { x: number; y: number };
  generatedImages: Record<string, string>;
  processedImages: Record<string, string>;
  removeBackground: boolean;
  generationHistory: Record<string, string[]>;
  processedHistory: Record<string, string[]>;
  currentHistoryIndex: Record<string, number>;
  regenerationCount: number;
  rawImageUrl: string | null;
  rotation: number;
  // Text-only design (when set, originalImage is empty/placeholder)
  textContent?: string;
  textFont?: string;
  textColor?: string; // hex - if not set, uses default (white on black, black on white)
  licensePlate?: string; // undefined = not asked, "" = no plate, string = plate text
}

// Embroidery thread color palette - common thread colors available for text
const TEXT_COLOR_PALETTE = [
  { id: "auto", hex: "", label: "Default" }, // auto = white on black garment / black on white
  { id: "white", hex: "#FFFFFF", label: "White" },
  { id: "black", hex: "#000000", label: "Black" },
  { id: "red", hex: "#D8315B", label: "Red" },
  { id: "blue", hex: "#3E92CC", label: "Blue" },
  { id: "navy", hex: "#0A2463", label: "Navy" },
  { id: "yellow", hex: "#F5C518", label: "Yellow" },
  { id: "green", hex: "#2E7D32", label: "Green" },
  { id: "orange", hex: "#E55934", label: "Orange" },
  { id: "pink", hex: "#E94B7B", label: "Pink" },
  { id: "gold", hex: "#C9A227", label: "Gold" },
  { id: "silver", hex: "#C0C0C0", label: "Silver" },
];

// Embroidery fonts. All free Google Fonts.
const TEXT_FONTS = [
  { id: "montserrat",   name: "Montserrat",   css: "'Montserrat', sans-serif",      fontVariant: "normal" },
  { id: "anton",        name: "Anton",        css: "'Anton', sans-serif",            fontVariant: "normal" },
  { id: "quicksand",    name: "Quicksand",    css: "'Quicksand', sans-serif",        fontVariant: "normal" },
  { id: "greatvibes",   name: "Great Vibes",  css: "'Great Vibes', cursive",         fontVariant: "normal" },
  { id: "sacramento",   name: "Sacramento",   css: "'Sacramento', cursive",          fontVariant: "normal" },
  { id: "cinzel",       name: "Cinzel",       css: "'Cinzel', serif",                fontVariant: "normal" },
];
const TEXT_PRICE = 12;
const TEXT_MAX_CHARS = 20;
// Shopify variant ID for the €12 "Teksta izšuvums" add-on product
const TEXT_ADDON_VARIANT_ID = "57137410703691";
// Sleeve embroidery pricing
const SLEEVE_PRICE = 25; // photo design on sleeve
const SLEEVE_TEXT_PRICE = 12; // text-only on sleeve (no photo)
const SLEEVE_TEXT_MAX_CHARS = 10;
const SLEEVE_DESIGN_SIZE_PX = 150; // fixed ~100mm visual size
// Shopify variant ID for €25 sleeve add-on (create in Shopify, then fill in)
const SLEEVE_PHOTO_ADDON_VARIANT_ID = "";
const MAX_DESIGNS_PER_SIDE = 3;
const ADDITIONAL_DESIGN_PRICING: Record<Style, Record<"S" | "M", number>> = {
  outline:    { S: 17, M: 35 },
  standard:   { S: 21, M: 41 },
  "pet-head": { S: 21, M: 41 },
  car:        { S: 21, M: 41 },
};
const ADDITIONAL_DESIGN_VARIANT_IDS: Record<Style, Record<"S" | "M", string>> = {
  outline:    { S: "", M: "" },
  standard:   { S: "", M: "" },
  "pet-head": { S: "", M: "" },
  car:        { S: "", M: "" },
};
const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

export default function TinyThreadStudio() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<Lang>("lv");
  const t = T[lang];
  const [product, setProduct] = useState<Product>("hoodie");
  const [color, setColor] = useState<Color>("black");
  const [view, setView] = useState<View>("front");
  const [size, setSize] = useState<Size>("S");
  const [style, setStyle] = useState<Style>("outline");
  const [removeBackground, setRemoveBackground] = useState(true);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStitched, setShowStitched] = useState(false);
  const [dragState, setDragState] = useState<{ isDragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ isResizing: boolean; startX: number; startY: number; startSize: number } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const guideLang = lang;
  const [guideStep, setGuideStep] = useState(0);
  const [showConfirmCart, setShowConfirmCart] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textFontInput, setTextFontInput] = useState(TEXT_FONTS[0].id);
  const [textColorInput, setTextColorInput] = useState<string>(""); // "" = auto
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [multipleQtys, setMultipleQtys] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0 });
  const [isAddingMultiple, setIsAddingMultiple] = useState(false);
  const [showMultipleTooltip, setShowMultipleTooltip] = useState(false);
  const [showCarPlatePopup, setShowCarPlatePopup] = useState(false);
  const [showMaxDesignsPopup, setShowMaxDesignsPopup] = useState(false);
  const [carPlatePending, setCarPlatePending] = useState<{ designId: string; base64: string; sleevePlacement: boolean } | null>(null);
  const [carPlateStep, setCarPlateStep] = useState<"ask" | "input">("ask");
  const [carPlateInput, setCarPlateInput] = useState("");

  // Customer & saved designs state
  const [customer, setCustomer] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);


  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationLockRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  // Track preview width so design sizes scale responsively on small screens.
  // Reference width 400px = the size-constraint values (60-260 px) were originally tuned against.
  const [previewWidth, setPreviewWidth] = useState(400);
  useEffect(() => {
    const el = previewRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const update = () => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setPreviewWidth(w);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Visual scale: reduce on-screen size so designs match real-life embroidery proportions
  // on the hoodie (max 250mm on a ~550mm chest = ~45% of body width). Stored sizePx and
  // mm calculations stay unchanged — this only affects visual rendering.
  const RENDER_SCALE = 0.55;
  const sizeScale = (previewWidth / 400) * RENDER_SCALE;

  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  const currentDesignsForView = designs.filter(d => d.view === view);
  // Is the selected design a 2nd/3rd photo on its side? (L size not available, size changes independent)
  const selectedIsAdditional = !!selectedDesign && !selectedDesign.textContent &&
    designs.filter(d => d.view === selectedDesign.view && !d.textContent).indexOf(selectedDesign) > 0;
  // Base price uses the primary photo design's style (front first, else back, else currently selected)
  const photoFrontDesign = designs.find(d => d.view === "front" && !d.textContent);
  const photoBackDesign = designs.find(d => d.view === "back" && !d.textContent);
  const primaryPhotoStyle: Style = (photoFrontDesign?.style || photoBackDesign?.style || style);
  const basePrice = PRICING[product]?.[primaryPhotoStyle]?.[size] || 0;
  // Back surcharge only applies when there are photo designs on BOTH front and back
  const hasBothSidesPhoto = !!photoFrontDesign && !!photoBackDesign;
  const backSurcharge = hasBothSidesPhoto ? (BACK_SURCHARGE[photoBackDesign!.style] || 0) : 0;
  // Sleeve pricing: photo design +€25/sleeve; text-only sleeve +€12; text on sleeve WITH photo = FREE
  const sleevePhotoDesigns = designs.filter(d => isSleeveView(d.view) && !d.textContent);
  const sleeveSurcharge = sleevePhotoDesigns.length * SLEEVE_PRICE;
  // Text on a sleeve that has no photo design on that same sleeve counts as €12
  const sleeveTextOnlyCount = designs.filter(d =>
    isSleeveView(d.view) && !!d.textContent && !designs.some(o => o.view === d.view && !o.textContent)
  ).length;
  const regularTextCount = designs.filter(d => !!d.textContent && !isSleeveView(d.view)).length;
  const textSurcharge = (regularTextCount + sleeveTextOnlyCount) * TEXT_PRICE;
  const additionalDesignSurcharge = (() => {
    let total = 0;
    for (const v of ["front", "back"] as View[]) {
      const photosOnSide = designs.filter(d => d.view === v && !d.textContent);
      for (let i = 1; i < photosOnSide.length; i++) {
        const d = photosOnSide[i];
        const eff = (d.size === "L" ? "M" : d.size) as "S" | "M";
        total += ADDITIONAL_DESIGN_PRICING[d.style]?.[eff] || 0;
      }
    }
    return total;
  })();
  const currentPrice = basePrice + backSurcharge + sleeveSurcharge + textSurcharge + additionalDesignSurcharge;

  // Multiple-order modal: compute live total from qty selectors
  const multipleOrderTotal = (() => {
    const stylePrices = (PRICING[product] || {})[primaryPhotoStyle] || {};
    const sizes = product === "hoodie" ? ["S", "M", "L"] : ["S", "M"];
    return sizes.reduce((sum, sz) => sum + (multipleQtys[sz] || 0) * (stylePrices[sz] || 0), 0);
  })();
  const multipleOrderTotalQty = Object.values(multipleQtys).reduce((a, b) => a + b, 0);

  // Check if first visit and show welcome popup
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Restore saved language preference
      const savedLang = localStorage.getItem("tinythread_lang");
      if (savedLang === "en" || savedLang === "lv") setLang(savedLang);
      if (!localStorage.getItem("tinythread_visited")) {
        setShowWelcome(true);
      }
    }
  }, []);

  // Persist language when it changes
  const handleLangChange = (next: Lang) => {
    setLang(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("tinythread_lang", next);
    }
  };

  // Read URL parameters to pre-select product and color
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlProduct = params.get("product");
    const urlColor = params.get("color");
    
    if (urlProduct === "hoodie" || urlProduct === "cap") {
      setProduct(urlProduct);
    }
    if (urlColor === "black" || urlColor === "white") {
      setColor(urlColor);
    }

    // Auto-login if customer_email + signature are passed from Shopify
    const customerEmail = params.get("customer_email");
    const emailSig = params.get("customer_sig");
    if (customerEmail && emailSig) {
      fetch("/api/customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: customerEmail, emailSignature: emailSig }),
      })
        .then(r => r.json())
        .then(data => {
          if (data.id) {
            setCustomer(data);
            loadSavedDesigns(data.id);
            console.log("[AUTH] Auto-logged in:", data.firstName);
          }
        })
        .catch(e => console.error("[AUTH] Auto-login error:", e));
    }
  }, []);

  // Load saved designs for a customer
  const loadSavedDesigns = async (customerId: string) => {
    console.log("[DESIGNS] loadSavedDesigns called, customerId=", customerId);
    setIsLoadingSaved(true);
    try {
      const res = await fetch(`/api/designs?customerId=${customerId}`);
      const data = await res.json();
      console.log("[DESIGNS] loadSavedDesigns response status=", res.status, "data=", JSON.stringify(data).slice(0, 200));
      if (data.designs) {
        setSavedDesigns(data.designs);
        console.log("[DESIGNS] Loaded", data.designs.length, "saved designs");
      } else {
        console.warn("[DESIGNS] No designs array in response:", data);
      }
    } catch (e) {
      console.error("[DESIGNS] Load error:", e);
    }
    setIsLoadingSaved(false);
  };

  // Create a thumbnail preserving aspect ratio
  const createThumbnail = (src: string, maxDim = 200): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const scale = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * scale);
          h = Math.round(h * scale);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve("");
      img.src = src;
    });
  };

  // Save current design - uploads full images to permanent storage
  const handleSaveDesign = async (design: Design) => {
    console.log("[SAVE] handleSaveDesign called, customer=", customer?.id ?? "null", "design.style=", design.style);
    if (!customer) {
      toast({ title: t.pleaseLogin, description: t.pleaseLoginDesc });
      return;
    }
    setIsSavingDesign(true);
    try {
      // Upload the generated design to Vercel Blob (permanent URL)
      // Prefer processedImages (background removed) over rawImageUrl
      let permanentGeneratedUrl = "";
      const generatedSrc = design.processedImages?.[design.style] || design.rawImageUrl || "";
      console.log("[SAVE] generatedSrc type=", generatedSrc ? (generatedSrc.startsWith("data:") ? "base64" : "url") : "empty", "len=", generatedSrc.length);
      if (generatedSrc) {
        const uploadRes = await fetch("/api/store-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            generatedSrc.startsWith("data:") || generatedSrc.startsWith("/")
              ? { base64Data: generatedSrc, filename: `gen_${customer.id}_${Date.now()}.png` }
              : { imageUrl: generatedSrc, filename: `gen_${customer.id}_${Date.now()}.png` }
          ),
        });
        const uploadData = await uploadRes.json();
        console.log("[SAVE] store-image result:", JSON.stringify(uploadData).slice(0, 150));
        if (uploadData.url) permanentGeneratedUrl = uploadData.url;
      }

      // Upload the original photo to Vercel Blob
      let permanentOriginalUrl = "";
      if (design.originalImage) {
        const origRes = await fetch("/api/store-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ base64Data: design.originalImage, filename: `orig_${customer.id}_${Date.now()}.jpg` }),
        });
        const origData = await origRes.json();
        if (origData.url) permanentOriginalUrl = origData.url;
      }

      // Create a small thumbnail for the grid display
      const thumbnail = await createThumbnail(permanentGeneratedUrl || generatedSrc);

      console.log("[SAVE] permanentGeneratedUrl=", permanentGeneratedUrl ? permanentGeneratedUrl.slice(0, 80) : "empty");
      const res = await fetch("/api/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id,
          design: {
            originalImageUrl: permanentOriginalUrl,
            generatedImageUrl: permanentGeneratedUrl,
            thumbnailUrl: thumbnail,
            style: design.style,
            product,
            garmentColor: color,
            size: design.size,
            position: design.position,
            sizePx: design.currentSizePx,
            view: design.view,
            licensePlate: design.licensePlate,
          },
        }),
      });
      const data = await res.json();
      console.log("[SAVE] /api/designs POST status=", res.status, "response=", JSON.stringify(data).slice(0, 200));
      if (data.success) {
        toast({ title: t.designSaved });
        if (data.design) {
          setSavedDesigns(prev => [...prev, data.design]);
        } else {
          await loadSavedDesigns(customer.id);
        }
      } else {
        toast({ title: t.error, description: data.error || t.failedSave });
      }
    } catch (e) {
      console.error("[DESIGNS] Save error:", e);
      toast({ title: t.error, description: t.failedSave });
    } finally {
      setIsSavingDesign(false);
    }
  };

  // Apply a saved design to the current garment
  const applySavedDesign = (saved: any) => {
    try {
      const savedStyle = saved.style || style;
      // Always place the design on the view the user is currently looking at,
      // not the view it was originally saved from.
      const targetView = view;
      const fullUrl = saved.generatedImageUrl || saved.thumbnailUrl || saved.originalImageUrl || "";

      // Cap size to M for 2nd/3rd designs (L is not available for additional slots)
      const photosOnView = designs.filter(d => d.view === targetView && !d.textContent).length;
      const willBeAdditional = !isSleeveView(targetView) && photosOnView >= 1;
      const rawSize: Size = (saved.size as Size) || size;
      const effectiveSize: Size = willBeAdditional && rawSize === "L" ? "M" : rawSize;
      const rawSizePx = saved.sizePx || 150;
      const { min: eMin, max: eMax } = SIZE_CONSTRAINTS[effectiveSize];
      const effectiveSizePx = isSleeveView(targetView)
        ? SLEEVE_DESIGN_SIZE_PX
        : Math.max(eMin, Math.min(eMax, rawSizePx));

      const newDesign: Design = {
        id: `saved_${Date.now()}`,
        style: savedStyle,
        size: effectiveSize,
        view: targetView,
        position: saved.position || { x: 50, y: 40 },
        currentSizePx: effectiveSizePx,
        generatedImages: fullUrl ? { [savedStyle]: fullUrl } : {},
        processedImages: fullUrl ? { [savedStyle]: fullUrl } : {},
        removeBackground: false,
        originalImage: saved.originalImageUrl || fullUrl,
        generationHistory: {},
        processedHistory: {},
        currentHistoryIndex: {},
        regenerationCount: 0,
        rawImageUrl: null,
        rotation: 0,
        licensePlate: saved.licensePlate,
      };

      if (photosOnView >= MAX_DESIGNS_PER_SIDE) {
        setShowMaxDesignsPopup(true);
        return;
      }

      setDesigns(prev => [...prev, newDesign]);
      setSelectedDesignId(newDesign.id);
      if (["outline", "standard", "pet-head", "car"].includes(savedStyle)) setStyle(savedStyle as Style);
      if (!isSleeveView(targetView) && saved.size && ["S", "M", "L"].includes(saved.size)) setSize(saved.size as Size);
      setShowStitched(true);
      setShowSavedDesigns(false);
      toast({ title: t.designApplied });
    } catch (e) {
      console.error("[DESIGNS] Apply error:", e);
    }
  };

  const getGarmentImage = () => {
    if (product === "cap") {
      return GARMENT_IMAGES.cap[color]?.front || GARMENT_IMAGES.cap.black.front;
    }
    if (isSleeveView(view)) return null;
    return GARMENT_IMAGES.hoodie[color][view as "front" | "back"];
  };

  const removeImageBackground = useCallback(async (imageUrl: string, styleType: Style, garmentColor: Color): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) { resolve(imageUrl); return; }

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        if (styleType === "standard") {
          // Edge-connected flood fill: only remove white pixels reachable from the image border.
          // Interior white elements (e.g. camera ring inside a logo) are enclosed by colored
          // pixels and are NOT reachable from the edges, so they are preserved.
          const W = canvas.width, H = canvas.height;
          const n = W * H;
          const visited = new Uint8Array(n);
          const queue: number[] = [];

          const tryEnqueue = (px: number) => {
            if (visited[px]) return;
            const i = px * 4;
            if (data[i + 3] > 0 && Math.min(data[i], data[i + 1], data[i + 2]) > 220) {
              visited[px] = 1;
              queue.push(px);
            }
          };

          // Seed BFS from all 4 image edges
          for (let x = 0; x < W; x++) { tryEnqueue(x); tryEnqueue((H - 1) * W + x); }
          for (let y = 1; y < H - 1; y++) { tryEnqueue(y * W); tryEnqueue(y * W + W - 1); }

          // Expand through adjacent near-white pixels
          let qi = 0;
          while (qi < queue.length) {
            const cur = queue[qi++];
            const cy = Math.floor(cur / W), cx = cur % W;
            if (cx > 0)     tryEnqueue(cur - 1);
            if (cx < W - 1) tryEnqueue(cur + 1);
            if (cy > 0)     tryEnqueue(cur - W);
            if (cy < H - 1) tryEnqueue(cur + W);
          }

          // Make only exterior (visited) near-white pixels transparent
          for (let idx = 0; idx < n; idx++) {
            if (!visited[idx]) continue;
            const i = idx * 4;
            const minRGB = Math.min(data[i], data[i + 1], data[i + 2]);
            if (minRGB > 245) {
              data[i + 3] = 0;
            } else if (minRGB > 220) {
              data[i + 3] = Math.round(((255 - minRGB) / (255 - 220)) * 255);
            }
          }
        } else {
          const threshold = 40;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (styleType === "outline") {
              if (garmentColor === "black") {
                if (r < threshold && g < threshold && b < threshold) data[i + 3] = 0;
              } else {
                if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) data[i + 3] = 0;
              }
            } else if (styleType === "pet-head" || styleType === "car") {
              if (r < threshold && g < threshold && b < threshold) data[i + 3] = 0;
            }
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = () => resolve(imageUrl);
      img.src = imageUrl;
    });
  }, []);

  const generateEmbroidery = useCallback(async (designId: string, imageBase64: string, styleType: Style, isRegenerate = false, licensePlate?: string): Promise<boolean> => {
    console.log("[generateEmbroidery] called", { designId, styleType, locked: generationLockRef.current });
    if (generationLockRef.current) {
      console.log("[generateEmbroidery] BLOCKED by lock — returning false");
      return false;
    }
    generationLockRef.current = true;
    setIsGenerating(true);

    try {
      const response = await fetch("/api/replicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: imageBase64,
          style: styleType,
          garmentColor: color,
          ...(licensePlate !== undefined && { licensePlate }),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        toast({ title: t.error, description: data.error || t.errorGeneric });
        return false;
      }

      if (data.imageUrl) {
        // Save the raw Replicate URL before background removal (for vectorization webhook)
        const rawReplicateUrl = data.imageUrl;
        let processed: string;
        // standard / pet-head / car all use AI-based background removal so we don't
        // accidentally strip colored pixels that match the background (e.g. black tires
        // on a car when the bg was black, or dark fur on a pet head).
        // Outline still uses the simple pixel-color strip because it's a clean
        // 2-color line drawing on a known background.
        if (styleType === "standard") {
          // Logo on pure white background: edge-connected flood fill (no rembg needed).
          // rembg would remove interior white elements (e.g. camera ring in Instagram logo);
          // flood fill only removes the outer background, not enclosed interior regions.
          const sourceUrl = data.imageUrl.includes("replicate.delivery")
            ? `/api/proxy-image?url=${encodeURIComponent(data.imageUrl)}`
            : data.imageUrl;
          processed = await removeImageBackground(sourceUrl, "standard", color);
        } else if (styleType === "pet-head" || styleType === "car") {
          // AI-based background removal for complex subjects with non-white backgrounds
          let aiBgUrl = data.imageUrl;
          try {
            const bgRes = await fetch("/api/remove-bg", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ imageUrl: data.imageUrl }),
            });
            const bgData = await bgRes.json();
            if (bgData.imageUrl) aiBgUrl = bgData.imageUrl;
          } catch {}
          const sourceForCleanup = aiBgUrl.includes("replicate.delivery")
            ? `/api/proxy-image?url=${encodeURIComponent(aiBgUrl)}`
            : aiBgUrl;
          processed = await removeImageBackground(sourceForCleanup, "standard", color);
        } else {
          processed = await removeImageBackground(data.imageUrl, styleType, color);
        }

        setDesigns(prev => prev.map(d => {
          if (d.id === designId) {
            const currentHistory = d.generationHistory[styleType] || [];
            const newHistory = [...currentHistory, data.imageUrl];
            const newIndex = newHistory.length - 1;
            const currentProcessedHistory = d.processedHistory?.[styleType] || [];
            const newProcessedHistory = [...currentProcessedHistory, processed];

            return {
              ...d,
              generatedImages: { ...d.generatedImages, [styleType]: data.imageUrl },
              processedImages: { ...d.processedImages, [styleType]: processed },
              generationHistory: { ...d.generationHistory, [styleType]: newHistory },
              processedHistory: { ...d.processedHistory, [styleType]: newProcessedHistory },
              currentHistoryIndex: { ...d.currentHistoryIndex, [styleType]: newIndex },
              rawImageUrl: rawReplicateUrl,
              ...(licensePlate !== undefined && { licensePlate }),
            };
          }
          return d;
        }));

        setShowStitched(true);
        console.log("[generateEmbroidery] succeeded, returning true");
        return true;
      }
      return false;
    } catch (error) {
      console.error("Generation failed:", error);
      toast({ title: t.error, description: t.errorGeneric });
      return false;
    } finally {
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }, [color, removeImageBackground, toast, t]);

  const compressImage = (base64: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        if (w > maxWidth) {
          h = Math.round(h * maxWidth / w);
          w = maxWidth;
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(base64);
      img.src = base64;
    });
  };

  const handleFileUpload = useCallback((file: File) => {
    // Limit: max 3 photos per side
    const photosOnThisView = designs.filter(d => d.view === view && !d.textContent).length;
    if (photosOnThisView >= MAX_DESIGNS_PER_SIDE) {
      setShowMaxDesignsPopup(true);
      return;
    }
    // 2nd and 3rd designs are capped at M (not L)
    const effectiveSize: Size = (!isSleeveView(view) && photosOnThisView >= 1 && size === "L") ? "M" : size;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      const base64 = await compressImage(rawBase64, 1024);
      console.log("[UPLOAD] Base64 length:", base64.length, "(compressed from", rawBase64.length, ")");
      
      if (base64.length < 1000) {
        alert("Error: Image data too small");
        return;
      }

      const sleevePlacement = isSleeveView(view);
      console.log("[handleFileUpload] view=", view, "sleevePlacement=", sleevePlacement);
      const newDesign: Design = {
        id: `design-${Date.now()}`,
        originalImage: base64,
        style: style,
        view: view,
        size: sleevePlacement ? "M" : effectiveSize,
        currentSizePx: sleevePlacement ? SLEEVE_DESIGN_SIZE_PX : SIZE_CONSTRAINTS[effectiveSize].min + (SIZE_CONSTRAINTS[effectiveSize].max - SIZE_CONSTRAINTS[effectiveSize].min) / 2,
        position: { x: 50, y: 40 },
        generatedImages: {},
        processedImages: {},
        removeBackground: removeBackground,
        generationHistory: {},
        processedHistory: {},
        currentHistoryIndex: {},
        regenerationCount: 0,
        rawImageUrl: null,
        rotation: 0,
      };

      setDesigns(prev => [...prev, newDesign]);
      setSelectedDesignId(newDesign.id);

      // On mobile, scroll the garment preview into view so the customer sees generation happening
      if (window.innerWidth < 1024 && previewRef.current) {
        previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (style === "car") {
        setCarPlatePending({ designId: newDesign.id, base64, sleevePlacement });
        setCarPlateStep("ask");
        setCarPlateInput("");
        setShowCarPlatePopup(true);
      } else {
        console.log("[handleFileUpload] awaiting generateEmbroidery, sleevePlacement=", sleevePlacement);
        const success = await generateEmbroidery(newDesign.id, base64, style);
        console.log("[handleFileUpload] generateEmbroidery returned", success, "sleevePlacement=", sleevePlacement);

        if (success && sleevePlacement) {
          console.log("[handleFileUpload] showing sleeve text reminder toast");
          toast({ description: t.sleeveTextReminder, duration: 7000 });
        }
      }
    };
    reader.readAsDataURL(file);
  }, [designs.length, style, view, size, removeBackground, generateEmbroidery, toast, t]);

  const handleAddText = useCallback(() => {
    const trimmed = textInput.trim();
    const maxChars = isSleeveView(view) ? SLEEVE_TEXT_MAX_CHARS : TEXT_MAX_CHARS;
    if (!trimmed || trimmed.length > maxChars) return;

    // If we are editing an existing text design, just update it
    if (editingTextId) {
      setDesigns(prev => prev.map(d =>
        d.id === editingTextId
          ? { ...d, textContent: trimmed, textFont: textFontInput, textColor: textColorInput || undefined }
          : d
      ));
      setEditingTextId(null);
      setTextInput("");
      setTextColorInput("");
      setShowTextModal(false);
      return;
    }

    // Adding new text - 1 text per side max
    const textOnThisView = designs.some(d => d.view === view && !!d.textContent);
    if (textOnThisView) {
      alert("You already have a text on this side. Click it to edit instead.");
      return;
    }

    const newDesign: Design = {
      id: `text-${Date.now()}`,
      originalImage: "",
      style: style,
      view: view,
      size: "M",
      currentSizePx: isSleeveView(view) ? SLEEVE_DESIGN_SIZE_PX : 140,
      position: { x: 50, y: 40 },
      generatedImages: {},
      processedImages: {},
      removeBackground: false,
      generationHistory: {},
      processedHistory: {},
      currentHistoryIndex: {},
      regenerationCount: 0,
      rawImageUrl: null,
      rotation: 0,
      textContent: trimmed,
      textFont: textFontInput,
      textColor: textColorInput || undefined,
    };

    setDesigns(prev => [...prev, newDesign]);
    setSelectedDesignId(newDesign.id);
    setTextInput("");
    setTextColorInput("");
    setShowTextModal(false);
  }, [textInput, textFontInput, textColorInput, editingTextId, designs, view, style]);

  const handleEditText = useCallback((design: Design) => {
    if (!design.textContent) return;
    setEditingTextId(design.id);
    setTextInput(design.textContent);
    setTextFontInput(design.textFont || TEXT_FONTS[0].id);
    setTextColorInput(design.textColor || "");
    setShowTextModal(true);
  }, []);

  const handleStyleChange = useCallback((newStyle: Style) => {
    setStyle(newStyle);
    
    if (selectedDesign) {
      setDesigns(prev => prev.map(d => {
        if (d.id === selectedDesign.id) {
          return { ...d, style: newStyle };
        }
        return d;
      }));

      if (!selectedDesign.generatedImages[newStyle]) {
        generateEmbroidery(selectedDesign.id, selectedDesign.originalImage, newStyle);
      }
    }
  }, [selectedDesign, generateEmbroidery]);

  const handleDeleteDesign = useCallback((designId: string) => {
    setDesigns(prev => prev.filter(d => d.id !== designId));
    if (selectedDesignId === designId) {
      setSelectedDesignId(null);
    }
  }, [selectedDesignId]);

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if ('changedTouches' in e && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    if ('clientX' in e) {
      return { x: e.clientX, y: e.clientY };
    }
    return { x: 0, y: 0 };
  };

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, designId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedDesignId(designId);
    const design = designs.find(d => d.id === designId);
    // Sync style selector so the user sees which style this design uses
    if (design && !design.textContent) setStyle(design.style);
    const pos = getPointerPos(e);
    if (design) {
      setDragState({
        isDragging: true,
        startX: pos.x,
        startY: pos.y,
        startPosX: design.position.x,
        startPosY: design.position.y,
      });
    }
  }, [designs]);

  // Keep old name as alias for backward compat
  const handleMouseDown = handlePointerDown;

  const handleResizePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, designId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const design = designs.find(d => d.id === designId);
    const pos = getPointerPos(e);
    if (design) {
      setResizeState({
        isResizing: true,
        startX: pos.x,
        startY: pos.y,
        startSize: design.currentSizePx,
      });
    }
  }, [designs]);

  const handleResizeMouseDown = handleResizePointerDown;

  useEffect(() => {
    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const pos = 'touches' in e && e.touches.length > 0
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY }
        : 'clientX' in e ? { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY } : null;
      if (!pos) return;

      if (dragState?.isDragging && selectedDesignId && previewRef.current) {
        e.preventDefault();
        const rect = previewRef.current.getBoundingClientRect();
        const deltaX = ((pos.x - dragState.startX) / rect.width) * 100;
        const deltaY = ((pos.y - dragState.startY) / rect.height) * 100;
        
        setDesigns(prev => prev.map(d => {
          if (d.id === selectedDesignId) {
            return {
              ...d,
              position: {
                x: Math.max(0, Math.min(100, dragState.startPosX + deltaX)),
                y: Math.max(0, Math.min(100, dragState.startPosY + deltaY)),
              },
            };
          }
          return d;
        }));
      }

      if (resizeState?.isResizing && selectedDesignId) {
        e.preventDefault();
        const design = designs.find(d => d.id === selectedDesignId);
        if (design) {
          // Divide delta by sizeScale so the resize handle tracks the cursor 1:1 on screen
          // (the design is rendered at currentSizePx * sizeScale).
          const delta = (pos.x - resizeState.startX) / (sizeScale || 1);
          const constraints = SIZE_CONSTRAINTS[design.size];
          const newSize = Math.max(constraints.min, Math.min(constraints.max, resizeState.startSize + delta));
          
          setDesigns(prev => prev.map(d => {
            if (d.id === selectedDesignId) {
              return { ...d, currentSizePx: newSize };
            }
            return d;
          }));
        }
      }
    };

    const handlePointerUp = () => {
      setDragState(null);
      setResizeState(null);
    };

    if (dragState?.isDragging || resizeState?.isResizing) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
      window.addEventListener("touchmove", handlePointerMove, { passive: false });
      window.addEventListener("touchend", handlePointerUp);
      window.addEventListener("touchcancel", handlePointerUp);
      return () => {
        window.removeEventListener("mousemove", handlePointerMove);
        window.removeEventListener("mouseup", handlePointerUp);
        window.removeEventListener("touchmove", handlePointerMove);
        window.removeEventListener("touchend", handlePointerUp);
        window.removeEventListener("touchcancel", handlePointerUp);
      };
    }
  }, [dragState, resizeState, selectedDesignId, designs, sizeScale]);

  const getSizeInMm = (sizePx: number, sizeCategory: Size) => {
    const constraints = SIZE_CONSTRAINTS[sizeCategory];
    const ratio = (sizePx - constraints.min) / (constraints.max - constraints.min);
    const mmRange = sizeCategory === "S" ? [45, 100] : sizeCategory === "M" ? [100, 150] : [150, 250];
    return Math.round(mmRange[0] + ratio * (mmRange[1] - mmRange[0]));
  };

  const handleRegenerate = useCallback(() => {
    if (cooldown > 0 || isGenerating || !selectedDesign) return;
    if (selectedDesign.regenerationCount >= 4) return;
    
    // Increment regeneration count
    setDesigns(prev => prev.map(d => {
      if (d.id === selectedDesign.id) {
        return { ...d, regenerationCount: d.regenerationCount + 1 };
      }
      return d;
    }));
    
    setCooldown(20);
    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    generateEmbroidery(selectedDesign.id, selectedDesign.originalImage, selectedDesign.style, true, selectedDesign.licensePlate);
  }, [cooldown, isGenerating, selectedDesign, generateEmbroidery]);

  const navigateHistory = useCallback((direction: "prev" | "next", targetDesignId?: string) => {
    const targetDesign = designs.find(d => d.id === targetDesignId) || selectedDesign;
    if (!targetDesign) return;

    const styleType = targetDesign.style;
    const history = targetDesign.generationHistory[styleType] || [];
    const currentIndex = targetDesign.currentHistoryIndex[styleType] ?? 0;

    let newIndex: number;
    if (direction === "prev") {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(history.length - 1, currentIndex + 1);
    }

    if (newIndex === currentIndex || !history[newIndex]) return;

    const newImageUrl = history[newIndex];
    const cachedProcessed = targetDesign.processedHistory?.[styleType]?.[newIndex];
    const processed = cachedProcessed || targetDesign.processedImages?.[styleType] || newImageUrl;

    setDesigns(prev => prev.map(d => {
      if (d.id === targetDesign.id) {
        return {
          ...d,
          generatedImages: { ...d.generatedImages, [styleType]: newImageUrl },
          processedImages: { ...d.processedImages, [styleType]: processed },
          currentHistoryIndex: { ...d.currentHistoryIndex, [styleType]: newIndex },
        };
      }
      return d;
    }));
  }, [designs, selectedDesign]);

  // Show confirmation popup before adding to cart
  const handleAddToCartClick = useCallback(() => {
    if (designs.length === 0) {
      toast({ title: t.noDesign, description: t.noDesignDesc });
      return;
    }
    setShowConfirmCart(true);
  }, [designs.length, toast]);

  // Handle "Order multiple identical" — adds one cart line per chosen size
  const handleAddMultipleToCart = useCallback(async () => {
    if (designs.length === 0) return;
    const allReady = designs.every(d => d.textContent || d.processedImages?.[d.style]);
    if (!allReady) {
      toast({ title: t.notReady, description: t.notReadyDesc });
      return;
    }

    const photoFront = designs.find(d => d.view === "front" && !d.textContent);
    const photoBack  = designs.find(d => d.view === "back"  && !d.textContent);
    const hasFrontAndBack = !!photoFront && !!photoBack;
    const variantStyleRaw = photoFront?.style || photoBack?.style || style;
    const variantStyle = variantStyleRaw === "car" ? "pet-head" : variantStyleRaw;

    // Only sizes that have Shopify variant IDs (XL not yet available)
    const availableSizeKeys = product === "hoodie" ? ["S", "M", "L"] : ["S", "M"];
    const cartItems = availableSizeKeys
      .map(sz => {
        const qty = multipleQtys[sz] || 0;
        if (qty === 0) return null;
        const vKey = hasFrontAndBack
          ? `${product}-${color}-${sz}-${variantStyle}-fb`
          : `${product}-${color}-${sz}-${variantStyle}`;
        const variantId = VARIANT_IDS[vKey];
        return variantId ? { id: variantId, quantity: qty, size: sz } : null;
      })
      .filter(Boolean) as { id: string; quantity: number; size: string }[];

    if (cartItems.length === 0) {
      toast({ title: t.errorCart, description: t.errorGeneric });
      return;
    }

    setIsAddingMultiple(true);
    try {
      const orderRef = `order_${Date.now()}`;

      // Store originals fire-and-forget
      const originals: Record<string, string> = {};
      const frontD = designs.find(d => d.view === "front");
      const backD = designs.find(d => d.view === "back");
      if (frontD?.originalImage) originals.front = frontD.originalImage;
      if (backD?.originalImage) originals.back = backD.originalImage;
      if (Object.keys(originals).length > 0) {
        fetch("/api/store-originals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderRef, originals }),
        }).catch(() => {});
      }

      // Upload design images to Vercel Blob for webhook access
      const uploadDesignToBlob = async (design: Design | undefined, side: string): Promise<string | null> => {
        if (!design || design.textContent) return null;
        const src = design.processedImages?.[design.style] || design.rawImageUrl || design.generatedImages?.[design.style] || null;
        if (!src) return null;
        try {
          const res = await fetch("/api/store-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              src.startsWith("data:")
                ? { base64Data: src, filename: `design_${side}_${Date.now()}.png` }
                : { imageUrl: src, filename: `design_${side}_${Date.now()}.png` }
            ),
          });
          const d = await res.json();
          return d.url || null;
        } catch { return null; }
      };

      // Upload ALL photo designs to blob (each design on each side gets its own stable URL)
      const designBlobUrls = await Promise.all(
        designs.map((d, idx) => d.textContent ? Promise.resolve(null) : uploadDesignToBlob(d, `${d.view}_${idx}`))
      );

      const photoStyleNames = designs
        .filter(d => !d.textContent)
        .map(d => STYLES.find(s => s.id === d.style)?.name || d.style);
      const textDesigns = designs.filter(d => !!d.textContent);

      const sharedProps: Record<string, string> = {
        "_order_ref": orderRef,
        "Design Count": String(designs.length),
        "Placement": designs.map(d => d.view).join(", "),
        "Order Type": "Multiple",
        "_positions": JSON.stringify(designs.map((d, idx) => ({
          view: d.view, x: d.position.x, y: d.position.y,
          size: d.currentSizePx || 150, rotation: d.rotation || 0,
          type: d.textContent ? "text" : "photo",
          ...(d.textContent ? {} : { blobUrl: designBlobUrls[idx] || undefined }),
        }))),
      };
      if (photoStyleNames.length > 0) sharedProps["Embroidery Style"] = photoStyleNames.join(", ");
      if (frontD) sharedProps["_garment"] = `${product}-${color}-front`;
      if (backD)  sharedProps["_garment_back"] = `${product}-${color}-back`;
      // Legacy single-design-per-view properties (backward compat)
      const idx0F = designs.findIndex(d => d.view === "front"         && !d.textContent);
      const idx0B = designs.findIndex(d => d.view === "back"          && !d.textContent);
      const idx0L = designs.findIndex(d => d.view === "left-sleeve"   && !d.textContent);
      const idx0R = designs.findIndex(d => d.view === "right-sleeve"  && !d.textContent);
      if (idx0F >= 0 && designBlobUrls[idx0F]) sharedProps["_design_image"]               = designBlobUrls[idx0F]!;
      if (idx0B >= 0 && designBlobUrls[idx0B]) sharedProps["_design_image_back"]          = designBlobUrls[idx0B]!;
      if (idx0L >= 0 && designBlobUrls[idx0L]) sharedProps["_design_image_left_sleeve"]   = designBlobUrls[idx0L]!;
      if (idx0R >= 0 && designBlobUrls[idx0R]) sharedProps["_design_image_right_sleeve"]  = designBlobUrls[idx0R]!;
      const carPhotoDesignMulti = designs.find(d => !d.textContent && d.style === "car");
      if (carPhotoDesignMulti && carPhotoDesignMulti.licensePlate !== undefined) {
        sharedProps["License Plate"] = carPhotoDesignMulti.licensePlate || "Nav nepieciešama";
      }
      if (textDesigns.length > 0) {
        sharedProps["Text Embroidery"] = textDesigns.map(d => {
          const fontName = (TEXT_FONTS.find(f => f.id === d.textFont) || TEXT_FONTS[0]).name;
          const sizeMm = d.currentSizePx ? Math.round((d.currentSizePx / 780) * 700) : 100;
          const colorEntry = TEXT_COLOR_PALETTE.find(c => c.hex && c.hex.toUpperCase() === (d.textColor || "").toUpperCase());
          const colorLabel = d.textColor ? (colorEntry?.label || d.textColor) : "Auto";
          return `"${d.textContent}" (font: ${fontName}, ${sizeMm}mm, color: ${colorLabel}, ${d.view})`;
        }).join(" | ");
      }

      const designSizeMm = designs.map(d => d.currentSizePx ? Math.round((d.currentSizePx / 780) * 700) : 100);
      const items = cartItems.map(({ id, quantity, size }) => ({
        id,
        quantity,
        properties: {
          ...sharedProps,
          "Embroidery Size": designs.map((d, i) => `${d.size} (${designSizeMm[i]}mm)`).join(", "),
        },
      }));

      const addRes = await fetch("https://tinythread.shop/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        credentials: "include",
        body: JSON.stringify({ items }),
      });

      if (addRes.ok) {
        window.location.href = "https://tinythread.shop/cart";
      } else {
        throw new Error("cart/add.js returned " + addRes.status);
      }
    } catch (e) {
      console.error("[MULTIPLE ORDER] Failed:", e);
      toast({ title: t.errorCart, description: t.errorGeneric });
    } finally {
      setIsAddingMultiple(false);
    }
  }, [multipleQtys, designs, product, color, style, toast, t]);

  // Handle Add to Cart - uses Shopify's cart/add URL to add to the REAL browser cart
  const handleAddToCart = useCallback(async () => {
    if (designs.length === 0) {
      toast({ title: t.noDesign, description: t.noDesignDesc });
      return;
    }

    // Text-only designs don't need AI processing; image designs do
    const allReady = designs.every(d => d.textContent || d.processedImages?.[d.style]);
    if (!allReady) {
      toast({ title: t.notReady, description: t.notReadyDesc });
      return;
    }

    setIsAddingToCart(true);
    try {
      // Get the correct variant ID based on product + color + size + style + placement.
      // Use the actual style of an existing photo design (front first, else back),
      // not the UI `style` state, so back-only designs map to the right variant.
      const photoFront = designs.find(d => d.view === "front" && !d.textContent);
      const photoBack  = designs.find(d => d.view === "back"  && !d.textContent);
      const hasFrontAndBack = !!photoFront && !!photoBack;
      const variantStyleRaw = (photoFront?.style || photoBack?.style || style);
      // Map car style to pet-head variants until car variants are created
      const variantStyle = variantStyleRaw === "car" ? "pet-head" : variantStyleRaw;
      const variantKey = hasFrontAndBack
        ? `${product}-${color}-${size}-${variantStyle}-fb`
        : `${product}-${color}-${size}-${variantStyle}`;
      const variantId = VARIANT_IDS[variantKey];
      
      if (!variantId) {
        throw new Error("Unknown product variant: " + variantKey);
      }

      // Build design specs for cart properties
      const designSpecs = designs.map(d => ({
        view: d.view,
        style: d.style,
        size: d.size,
        sizeMm: d.currentSizePx ? Math.round((d.currentSizePx / 780) * 700) : 100,
      }));

      // Build the cart/add URL with properties
      const params = new URLSearchParams();
      params.set("id", variantId);
      params.set("quantity", "1");
      // Use human-readable style names; text designs have no meaningful embroidery style
      const photoStyleNames = designs
        .filter(d => !d.textContent)
        .map(d => STYLES.find(s => s.id === d.style)?.name || d.style);
      if (photoStyleNames.length > 0) {
        params.set("properties[Embroidery Style]", photoStyleNames.join(", "));
      }
      params.set("properties[Embroidery Size]", designSpecs.map(d => `${d.size} (${d.sizeMm}mm)`).join(", "));
      params.set("properties[Placement]", designSpecs.map(d => d.view).join(", "));
      params.set("properties[Design Count]", String(designs.length));
      
      // Text designs - send content + font + size + view
      const textDesigns = designs.filter(d => !!d.textContent);
      if (textDesigns.length > 0) {
        params.set("properties[Text Embroidery]", textDesigns.map(d => {
          const fontName = (TEXT_FONTS.find(f => f.id === d.textFont) || TEXT_FONTS[0]).name;
          const sizeMm = d.currentSizePx ? Math.round((d.currentSizePx / 780) * 700) : 100;
          const colorEntry = TEXT_COLOR_PALETTE.find(c => c.hex && c.hex.toUpperCase() === (d.textColor || "").toUpperCase());
          const colorLabel = d.textColor ? (colorEntry?.label || d.textColor) : "Auto";
          return `"${d.textContent}" (font: ${fontName}, ${sizeMm}mm, color: ${colorLabel}, ${d.view})`;
        }).join(" | "));
      }
      
      // Garment refs for each side (set immediately — no async needed)
      const frontDesign = designs.find(d => d.view === "front");
      const backDesign = designs.find(d => d.view === "back");
      if (frontDesign) params.set("properties[_garment]", `${product}-${color}-front`);
      if (backDesign)  params.set("properties[_garment_back]", `${product}-${color}-back`);

      // License plate (car style only)
      const carPhotoDesign = designs.find(d => !d.textContent && d.style === "car");
      if (carPhotoDesign && carPhotoDesign.licensePlate !== undefined) {
        params.set("properties[License Plate]", carPhotoDesign.licensePlate || "Nav nepieciešama");
      }

      // _design_image / _design_image_back are set later after Blob upload (see below)

      // Send original photos to our API for the designer email (can't fit base64 in URL params)
      try {
        const originals: Record<string, string> = {};
        if (frontDesign?.originalImage) originals.front = frontDesign.originalImage;
        if (backDesign?.originalImage) originals.back = backDesign.originalImage;
        if (Object.keys(originals).length > 0) {
          fetch("/api/store-originals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderRef: `${Date.now()}`, originals }),
          }).catch(() => {});
        }
      } catch {}
      
      // _positions is set after blob uploads below (needs blobUrl per design)
      
      // --- Store original photos for the webhook to use later ---
      try {
        const orderRef = `order_${Date.now()}`;
        params.set("properties[_order_ref]", orderRef);

        const originals: Record<string, string> = {};
        const frontD = designs.find(d => d.view === "front");
        const backD = designs.find(d => d.view === "back");
        if (frontD?.originalImage) originals.front = frontD.originalImage;
        if (backD?.originalImage) originals.back = backD.originalImage;

        if (Object.keys(originals).length > 0) {
          // Store originals in shop metafield for webhook to retrieve
          fetch("/api/store-originals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderRef, originals }),
          }).catch(() => {});
        }
      } catch {}
      // --- End original photo storage ---
      
      params.set("return_to", "/?added=true");

      // --- Capture front+back screenshots for designer email ---
      // Uses native canvas API instead of html2canvas: works on iOS Safari, Android Chrome,
      // and any screen size without DOM manipulation or view-switching race conditions.
      // Produces a fixed 800×1000 composite using the same position/size math as the server.
      let screenshotFrontUrl: string | null = null;
      let screenshotBackUrl: string | null = null;
      let screenshotLeftSleeveUrl: string | null = null;
      let screenshotRightSleeveUrl: string | null = null;
      try {
        const SHOT_W = 800, SHOT_H = 1000;

        // Route replicate CDN URLs through our proxy so canvas can draw them (CORS)
        const proxyIfNeeded = (url: string) => {
          if (!url || url.startsWith("data:")) return url;
          if (url.includes("replicate.delivery") || url.includes("pbxt.replicate.delivery")) {
            return `/api/proxy-image?url=${encodeURIComponent(url)}`;
          }
          return url;
        };

        // Load an image, falling back to proxy if direct CORS load fails
        const loadImg = (src: string): Promise<HTMLImageElement> => {
          const tryLoad = (url: string): Promise<HTMLImageElement> =>
            new Promise((res, rej) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => res(img);
              img.onerror = () => rej(new Error("load failed: " + url));
              img.src = url;
            });
          return tryLoad(src).catch(() =>
            tryLoad(`/api/proxy-image?url=${encodeURIComponent(src)}`)
          );
        };

        // Ensure Google Fonts are fully loaded so canvas text matches the on-screen preview
        if (document.fonts?.ready) await document.fonts.ready;

        const captureView = async (targetView: View): Promise<string | null> => {
          const canvas = document.createElement("canvas");
          canvas.width = SHOT_W;
          canvas.height = SHOT_H;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;

          // 1. Garment background — white fill + object-contain draw so the garment
          //    is never stretched, matching the app preview's `object-contain` behaviour.
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, SHOT_W, SHOT_H);
          const garmentSrc = (GARMENT_IMAGES as Record<string, Record<string, Record<string, string>>>)
            [product]?.[color]?.[targetView];
          if (garmentSrc) {
            try {
              const gImg = await loadImg(garmentSrc);
              const ir = gImg.naturalWidth / gImg.naturalHeight;
              const cr = SHOT_W / SHOT_H;
              let gw: number, gh: number, gx: number, gy: number;
              if (ir > cr) {
                // image wider than canvas → letterbox top/bottom
                gw = SHOT_W; gh = Math.round(SHOT_W / ir);
                gx = 0;      gy = Math.round((SHOT_H - gh) / 2);
              } else {
                // image taller than canvas → pillarbox left/right
                gh = SHOT_H; gw = Math.round(SHOT_H * ir);
                gx = Math.round((SHOT_W - gw) / 2); gy = 0;
              }
              ctx.drawImage(gImg, gx, gy, gw, gh);
            } catch { /* skip garment if load fails */ }
          }

// 2. Design overlays — identical position formula to the DOM and server composite:
          //    left = SHOT_W * position.x / 100, top = SHOT_H * position.y / 100 (center-anchored)
          //    size = currentSizePx / 780 * SHOT_W  (780px reference space → 800px canvas)
          const viewDesigns = designs.filter(d => d.view === targetView);
          for (const design of viewDesigns) {
            const sizePx = Math.round((design.currentSizePx / 780) * SHOT_W);
            const cx = Math.round(SHOT_W * design.position.x / 100);
            const cy = Math.round(SHOT_H * design.position.y / 100);

            ctx.save();
            ctx.translate(cx, cy);
            if (design.rotation) ctx.rotate((design.rotation * Math.PI) / 180);

            if (design.textContent) {
              const fontDef = TEXT_FONTS.find(f => f.id === design.textFont) || TEXT_FONTS[0];
              const textColor = design.textColor || (color === "black" ? "#FFFFFF" : "#000000");
              const fontSize = Math.max(20, sizePx / 6);
              ctx.font = `700 ${fontSize}px ${fontDef.css}`;
              ctx.fillStyle = textColor;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(design.textContent, 0, 0, sizePx);
            } else {
              // processedImages are base64 data: URLs (bg-removed) — no CORS needed
              const imgSrc = proxyIfNeeded(
                design.processedImages?.[design.style] ||
                design.rawImageUrl ||
                design.generatedImages?.[design.style] ||
                ""
              );
              if (imgSrc) {
                try {
                  const dImg = await loadImg(imgSrc);
                  // object-contain within the sizePx square, matching CSS `object-contain`
                  const dir = dImg.naturalWidth / dImg.naturalHeight;
                  let dw: number, dh: number;
                  if (dir >= 1) { dw = sizePx; dh = Math.round(sizePx / dir); }
                  else          { dh = sizePx; dw = Math.round(sizePx * dir); }
                  ctx.drawImage(dImg, -dw / 2, -dh / 2, dw, dh);
                } catch { /* skip design image if load fails */ }
              }
            }

            ctx.restore();
          }

          try { return canvas.toDataURL("image/png"); } catch { return null; }
        };

        const uploadScreenshot = async (dataUrl: string | null, side: string): Promise<string | null> => {
          if (!dataUrl) return null;
          try {
            const res = await fetch("/api/store-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ base64Data: dataUrl, filename: `mockup_${side}_${Date.now()}.png` }),
            });
            const data = await res.json();
            return data.url || null;
          } catch { return null; }
        };

        const captureSleeveView = async (side: "left-sleeve" | "right-sleeve"): Promise<string | null> => {
          const canvas = document.createElement("canvas");
          canvas.width = SHOT_W; canvas.height = SHOT_H;
          const ctx = canvas.getContext("2d");
          if (!ctx) return null;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, SHOT_W, SHOT_H);
          // Draw the static sleeve photo as background using object-contain (same as DOM preview)
          try {
            const sleeveImg = await loadImg(`/sleeves/sleeve-${color === "white" ? "cream" : color}.jpg`);
            const ir = sleeveImg.naturalWidth / sleeveImg.naturalHeight;
            const cr = SHOT_W / SHOT_H;
            let gw: number, gh: number, gx: number, gy: number;
            if (ir > cr) {
              gw = SHOT_W; gh = Math.round(SHOT_W / ir);
              gx = 0;      gy = Math.round((SHOT_H - gh) / 2);
            } else {
              gh = SHOT_H; gw = Math.round(SHOT_H * ir);
              gx = Math.round((SHOT_W - gw) / 2); gy = 0;
            }
            ctx.save();
            if (side === "right-sleeve") { ctx.translate(SHOT_W, 0); ctx.scale(-1, 1); }
            ctx.drawImage(sleeveImg, gx, gy, gw, gh);
            ctx.restore();
          } catch { /* white background fallback already set */ }
          const viewDesigns = designs.filter(d => d.view === side);
          for (const design of viewDesigns) {
            const sizePx = Math.round((design.currentSizePx / 780) * SHOT_W);
            const cx = Math.round(SHOT_W * design.position.x / 100);
            const cy = Math.round(SHOT_H * design.position.y / 100);
            ctx.save();
            ctx.translate(cx, cy);
            if (design.rotation) ctx.rotate((design.rotation * Math.PI) / 180);
            if (design.textContent) {
              const fontDef = TEXT_FONTS.find(f => f.id === design.textFont) || TEXT_FONTS[0];
              const textColorVal = design.textColor || (color === "black" ? "#FFFFFF" : "#000000");
              const fontSize = Math.max(20, sizePx / 6);
              ctx.font = `700 ${fontSize}px ${fontDef.css}`;
              ctx.fillStyle = textColorVal;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(design.textContent, 0, 0, sizePx);
            } else {
              const imgSrc = proxyIfNeeded(design.processedImages?.[design.style] || design.rawImageUrl || design.generatedImages?.[design.style] || "");
              if (imgSrc) { try {
                const dImg = await loadImg(imgSrc);
                const dir = dImg.naturalWidth / dImg.naturalHeight;
                let dw: number, dh: number;
                if (dir >= 1) { dw = sizePx; dh = Math.round(sizePx / dir); }
                else          { dh = sizePx; dw = Math.round(sizePx * dir); }
                ctx.drawImage(dImg, -dw / 2, -dh / 2, dw, dh);
              } catch {} }
            }
            ctx.restore();
          }
          try { return canvas.toDataURL("image/png"); } catch { return null; }
        };

        const hasLeftSleeve = designs.some(d => d.view === "left-sleeve");
        const hasRightSleeve = designs.some(d => d.view === "right-sleeve");

        // All views composed in parallel
        const [frontDataUrl, backDataUrl, leftSleeveDataUrl, rightSleeveDataUrl] = await Promise.all([
          captureView("front").catch(() => null),
          product === "hoodie" ? captureView("back").catch(() => null) : Promise.resolve(null),
          hasLeftSleeve ? captureSleeveView("left-sleeve").catch(() => null) : Promise.resolve(null),
          hasRightSleeve ? captureSleeveView("right-sleeve").catch(() => null) : Promise.resolve(null),
        ]);

        [screenshotFrontUrl, screenshotBackUrl, screenshotLeftSleeveUrl, screenshotRightSleeveUrl] = await Promise.all([
          uploadScreenshot(frontDataUrl, "front"),
          uploadScreenshot(backDataUrl, "back"),
          uploadScreenshot(leftSleeveDataUrl, "left-sleeve"),
          uploadScreenshot(rightSleeveDataUrl, "right-sleeve"),
        ]);
      } catch (e) {
        console.error("[SCREENSHOT] Failed, continuing without screenshots:", e);
      }
      if (screenshotFrontUrl) params.set("properties[_screenshot_front]", screenshotFrontUrl);
      if (screenshotBackUrl)  params.set("properties[_screenshot_back]",  screenshotBackUrl);
      if (screenshotLeftSleeveUrl)  params.set("properties[_screenshot_left_sleeve]",  screenshotLeftSleeveUrl);
      if (screenshotRightSleeveUrl) params.set("properties[_screenshot_right_sleeve]", screenshotRightSleeveUrl);

      // --- Upload processed design images to Vercel Blob for permanent webhook access ---
      // Replicate URLs expire; base64 data URLs can't be fetched by the webhook.
      // Uploading to Blob gives the webhook a stable URL for generated-front/back.png.
      const uploadDesignToBlob = async (design: Design | undefined, side: string): Promise<string | null> => {
        if (!design || design.textContent) return null;
        const src = design.processedImages?.[design.style] || design.rawImageUrl || design.generatedImages?.[design.style] || null;
        if (!src) return null;
        try {
          const res = await fetch("/api/store-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              src.startsWith("data:")
                ? { base64Data: src, filename: `design_${side}_${Date.now()}.png` }
                : { imageUrl: src, filename: `design_${side}_${Date.now()}.png` }
            ),
          });
          const data = await res.json();
          return data.url || null;
        } catch { return null; }
      };
      // Upload ALL photo designs to blob (each design on each side gets its own stable URL)
      const singleBlobUrls = await Promise.all(
        designs.map((d, idx) => d.textContent ? Promise.resolve(null) : uploadDesignToBlob(d, `${d.view}_${idx}`))
      );
      // Set _positions with type and blobUrl so webhook can attach each design separately
      params.set("properties[_positions]", JSON.stringify(designs.map((d, idx) => ({
        view: d.view, x: d.position.x, y: d.position.y,
        size: d.currentSizePx || 150, rotation: d.rotation || 0,
        style: d.style,
        type: d.textContent ? "text" : "photo",
        ...(d.textContent ? {} : { blobUrl: singleBlobUrls[idx] || undefined }),
      }))));
      // Legacy single-design-per-view properties (backward compat)
      const s0F = designs.findIndex(d => d.view === "front"         && !d.textContent);
      const s0B = designs.findIndex(d => d.view === "back"          && !d.textContent);
      const s0L = designs.findIndex(d => d.view === "left-sleeve"   && !d.textContent);
      const s0R = designs.findIndex(d => d.view === "right-sleeve"  && !d.textContent);
      if (s0F >= 0 && singleBlobUrls[s0F]) params.set("properties[_design_image]",             singleBlobUrls[s0F]!);
      if (s0B >= 0 && singleBlobUrls[s0B]) params.set("properties[_design_image_back]",        singleBlobUrls[s0B]!);
      if (s0L >= 0 && singleBlobUrls[s0L]) params.set("properties[_design_image_left_sleeve]",  singleBlobUrls[s0L]!);
      if (s0R >= 0 && singleBlobUrls[s0R]) params.set("properties[_design_image_right_sleeve]", singleBlobUrls[s0R]!);

      // Sleeve embroidery info property
      const sleeveDesigns = designs.filter(d => isSleeveView(d.view));
      if (sleeveDesigns.length > 0) {
        params.set("properties[Sleeve Embroidery]", sleeveDesigns.map(d => {
          if (d.textContent) {
            const fontName = (TEXT_FONTS.find(f => f.id === d.textFont) || TEXT_FONTS[0]).name;
            const colorEntry = TEXT_COLOR_PALETTE.find(c => c.hex && c.hex.toUpperCase() === (d.textColor || "").toUpperCase());
            const colorLabel = d.textColor ? (colorEntry?.label || d.textColor) : "Auto";
            const sideLabel = d.view === "left-sleeve" ? "Left Sleeve" : "Right Sleeve";
            return `"${d.textContent}" (font: ${fontName}, 100mm, color: ${colorLabel}, ${sideLabel})`;
          } else {
            const styleName = STYLES.find(s => s.id === d.style)?.name || d.style;
            const sideLabel = d.view === "left-sleeve" ? "Left Sleeve" : "Right Sleeve";
            return `${styleName} (100×100mm, ${sideLabel})`;
          }
        }).join(" | "));
      }
      // --- End design image upload ---

      // --- Auto-save designs on purchase (fire and forget) ---
      console.log("[AUTO-SAVE] customer=", customer?.id ?? "null", "designs=", designs.length);
      if (customer) {
        // URLs already on Vercel Blob don't need re-uploading
        const isBlob = (url: string) =>
          url.startsWith("https://") && url.includes("vercel-storage.com");

        const uploadIfNeeded = async (src: string, filename: string): Promise<string> => {
          if (!src) return "";
          if (isBlob(src)) return src; // already stored — reuse the URL
          const res = await fetch("/api/store-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(
              src.startsWith("data:") || src.startsWith("/")
                ? { base64Data: src, filename }
                : { imageUrl: src, filename }
            ),
          });
          const data = await res.json();
          return data.url || "";
        };

        for (const design of designs) {
          // Text-only designs have no image to save; skip them
          if (design.textContent) continue;
          console.log("[AUTO-SAVE] saving design", design.id, "style=", design.style, "view=", design.view);
          try {
            const genSrc = design.processedImages?.[design.style] || design.rawImageUrl || "";
            console.log("[AUTO-SAVE] genSrc type=", genSrc ? (genSrc.startsWith("data:") ? "base64" : "url") : "empty");
            const permanentGenUrl = await uploadIfNeeded(
              genSrc, `auto_gen_${customer.id}_${Date.now()}.png`
            );

            // Upload original photo only if it's not already stored
            const permanentOrigUrl = await uploadIfNeeded(
              design.originalImage || "", `auto_orig_${customer.id}_${Date.now()}.jpg`
            );

            // Create thumbnail for grid
            const thumb = await createThumbnail(permanentGenUrl || genSrc);

            // Save to designs API
            const saveRes = await fetch("/api/designs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                customerId: customer.id,
                design: {
                  originalImageUrl: permanentOrigUrl,
                  generatedImageUrl: permanentGenUrl,
                  thumbnailUrl: thumb,
                  style: design.style,
                  product,
                  garmentColor: color,
                  size: design.size,
                  position: design.position,
                  sizePx: design.currentSizePx,
                  view: design.view,
                  autoSaved: true,
                },
              }),
            });
            const saveData = await saveRes.json();
            console.log("[AUTO-SAVE] API response status=", saveRes.status, JSON.stringify(saveData).slice(0, 150));
            if (saveData.design) setSavedDesigns(prev => [...prev, saveData.design]);
            console.log("[AUTO-SAVE] Saved design:", design.style, design.view);
          } catch (e) {
            console.error("[AUTO-SAVE] Failed for design", design.id, ":", e);
          }
        }
      }
      // --- End auto-save ---

      // If there are text/sleeve/additional-design add-ons, use cart/add.js multi-item add
      const regularTextCount2 = designs.filter(d => !!d.textContent && !isSleeveView(d.view)).length;
      const sleeveTextOnly2Count = designs.filter(d => isSleeveView(d.view) && !!d.textContent && !designs.some(o => o.view === d.view && !o.textContent)).length;
      const billableTextCount = regularTextCount2 + sleeveTextOnly2Count;
      const sleevePhotoCount = designs.filter(d => isSleeveView(d.view) && !d.textContent).length;
      const additionalPhotoDesigns: { design: (typeof designs)[0]; addSize: "S" | "M" }[] = [];
      for (const v of ["front", "back"] as View[]) {
        const photosOnSide = designs.filter(d => d.view === v && !d.textContent);
        for (let i = 1; i < photosOnSide.length; i++) {
          const d = photosOnSide[i];
          additionalPhotoDesigns.push({ design: d, addSize: (d.size === "L" ? "M" : d.size) as "S" | "M" });
        }
      }
      const needsMultiAdd = (billableTextCount > 0 && TEXT_ADDON_VARIANT_ID) || (sleevePhotoCount > 0 && SLEEVE_PHOTO_ADDON_VARIANT_ID) || additionalPhotoDesigns.length > 0;
      if (needsMultiAdd) {
        // Build items array for multi-add
        const propsObj: Record<string, string> = {};
        for (const [k, v] of params.entries()) {
          if (k.startsWith("properties[") && k.endsWith("]")) {
            propsObj[k.slice("properties[".length, -1)] = v;
          }
        }
        const items: { id: string; quantity: number; properties: Record<string, string> }[] = [
          { id: variantId, quantity: 1, properties: propsObj },
        ];
        console.log("[ADD TO CART] variantKey:", variantKey, "variantId:", variantId, "appPrice:", currentPrice);
        if (billableTextCount > 0 && TEXT_ADDON_VARIANT_ID) {
          items.push({ id: TEXT_ADDON_VARIANT_ID, quantity: billableTextCount, properties: { "_for_order_ref": propsObj["_order_ref"] || "" } });
        }
        if (sleevePhotoCount > 0 && SLEEVE_PHOTO_ADDON_VARIANT_ID) {
          items.push({ id: SLEEVE_PHOTO_ADDON_VARIANT_ID, quantity: sleevePhotoCount, properties: { "_for_order_ref": propsObj["_order_ref"] || "" } });
        }
        for (const { design: addDesign, addSize } of additionalPhotoDesigns) {
          const addVariantId = ADDITIONAL_DESIGN_VARIANT_IDS[addDesign.style]?.[addSize];
          if (addVariantId) {
            const styleName = STYLES.find(s => s.id === addDesign.style)?.name || addDesign.style;
            const sizeMm = Math.round((addDesign.currentSizePx / 780) * 700);
            items.push({ id: addVariantId, quantity: 1, properties: { "_for_order_ref": propsObj["_order_ref"] || "", "Style": styleName, "Size": `${addSize} (${sizeMm}mm)`, "Placement": addDesign.view } });
          }
        }
        try {
          console.log("[ADD TO CART] multi-add payload:", JSON.stringify(items.map(i => ({ id: i.id, qty: i.quantity })), null, 2));
          const addRes = await fetch("https://tinythread.shop/cart/add.js", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            credentials: "include",
            body: JSON.stringify({ items }),
          });
          if (addRes.ok) {
            window.location.href = "https://tinythread.shop/cart";
            return;
          }
          // Fallback to single-item add if the multi-add fails (e.g. CORS)
          console.warn("[ADD TO CART] Multi-add failed, falling back to single-item URL");
        } catch (e) {
          console.warn("[ADD TO CART] Multi-add error, falling back:", e);
        }
      }

      // Redirect to Shopify cart/add — this adds to the REAL browser cart (single item)
      console.log("[ADD TO CART] single-item variantKey:", variantKey, "variantId:", variantId, "appPrice:", currentPrice);
      window.location.href = "https://tinythread.shop/cart/add?" + params.toString();

    } catch (error: unknown) {
      console.error("[ADD TO CART] Error:", error);
      const errorMessage = error instanceof Error ? error.message : t.errorGeneric;
      toast({ 
        title: t.errorCart, 
        description: errorMessage,
        variant: "destructive"
      });
      setIsAddingToCart(false);
    }
  }, [designs, product, color, size, style, view, toast, customer]);

  const designLabels = designs.map(design => {
    if (design.textContent) return `${t.textOnly}: "${design.textContent}"`;
    const pi = design.processedImages;
    let s = design.style;
    if (!pi[s]) {
      const k = Object.keys(pi).find(k2 => !!pi[k2]);
      if (k) s = k as typeof s;
    }
    if (s === "standard") return t.styleStandard;
    if (s === "outline") return t.styleOutline;
    if (s === "pet-head") return t.stylePetHead;
    return t.styleCar;
  });

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row", theme === "dark" ? "dark" : "")}>
      {/* Garment Preview - First on mobile, Second on desktop */}
      <div className={cn(
        "w-full md:flex-1 h-[50vh] md:h-screen order-1 md:order-2 flex flex-col relative",
        theme === "dark" ? "bg-[#1e1b18]" : "bg-gray-50"
      )}>
        {/* Top Controls - Original/Stitched toggle */}
        <div className="flex justify-end p-2 md:p-4">
          {designs.length > 0 && (
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", theme === "dark" ? "bg-neutral-800" : "bg-white shadow-sm")}>
              <span className={cn("text-xs", !showStitched ? "text-[#3e92cc]" : theme === "dark" ? "text-neutral-400" : "text-gray-500")}>{t.original}</span>
              <Switch
                checked={showStitched}
                onCheckedChange={setShowStitched}
              />
              <span className={cn("text-xs", showStitched ? "text-[#3e92cc]" : theme === "dark" ? "text-neutral-400" : "text-gray-500")}>{t.stitched}</span>
            </div>
          )}
        </div>

        {/* Garment Preview */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden p-4 md:p-6"
        >
          {/* Zoom Button */}
          <button
            type="button"
            onClick={() => setZoom(z => z >= 2 ? 1 : z + 0.5)}
            className="absolute bottom-6 right-6 z-30 w-10 h-10 rounded-full flex items-center justify-center shadow-lg bg-black hover:bg-black/80 text-white transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              {zoom < 2 && <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 7.5v6m3-3h-6" />}
            </svg>
          </button>

          <div
            ref={previewRef}
            data-testid="garment-preview"
            className="relative w-auto max-h-[85vh] mx-auto transition-transform duration-150 bg-white rounded-lg shadow-sm aspect-[4/5]"
            style={{ cursor: designs.length === 0 ? 'pointer' : 'default', transform: `scale(${zoom})`, transformOrigin: 'center center' }}
            onClick={(e) => {
              if (designs.length > 0 && (e.target === e.currentTarget || e.target instanceof HTMLImageElement)) {
                setSelectedDesignId(null);
              }
            }}
          >
            {isSleeveView(view) ? (
              <img
                src={`/sleeves/sleeve-${color === "white" ? "cream" : color}.jpg`}
                alt={`Hoodie ${view === "left-sleeve" ? "left" : "right"} sleeve`}
                className="w-full h-full object-contain"
                style={view === "right-sleeve" ? { transform: "scaleX(-1)" } : undefined}
                data-testid="garment-mockup"
              />
            ) : (
              <img
                src={getGarmentImage()!}
                alt={`${product} ${color} ${view}`}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                data-testid="garment-mockup"
              />
            )}

{/* Design Overlays */}
            {currentDesignsForView.map(design => {
              // Helper to proxy cross-origin images for html2canvas
              const getDisplayUrl = (url: string) => {
                if (!url) return url;
                if (url.startsWith("data:")) return url; // already base64
                if (url.includes("replicate.delivery") || url.includes("pbxt.replicate.delivery")) {
                  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
                }
                return url;
              };
              
              const rawImageToShow = showStitched
                ? (design.processedImages?.[design.style] || design.originalImage)
                : design.originalImage;

              const imageToShow = getDisplayUrl(rawImageToShow);
              const isText = !!design.textContent;
              if (!isText && !imageToShow) return null;

              const fontDef = TEXT_FONTS.find(f => f.id === design.textFont) || TEXT_FONTS[0];
              // Thread color: explicit color from design, else auto (white on black, black on white)
              const textColor = design.textColor || (color === "black" ? "#FFFFFF" : "#000000");

              return (
                <div
                  key={design.id}
                  style={{
                    position: "absolute",
                    left: `${design.position.x}%`,
                    top: `${design.position.y}%`,
                    transform: `translate(-50%, -50%) rotate(${design.rotation || 0}deg)`,
                    width: design.currentSizePx * sizeScale,
                    height: design.currentSizePx * sizeScale,
                  }}
                  className={cn(
                    "cursor-move group",
                    selectedDesignId === design.id && "ring-2 ring-[#3e92cc]"
                  )}
                  onMouseDown={(e) => handleMouseDown(e, design.id)}
                  onTouchStart={(e) => handlePointerDown(e, design.id)}
                  // Prevent page scroll when dragging design on mobile
                  onTouchMove={(e) => e.preventDefault()}
                  onDoubleClick={(e) => { if (isText) { e.stopPropagation(); handleEditText(design); } }}
                >
                  {isText ? (
                    <div
                      className="w-full h-full flex items-center justify-center pointer-events-none px-1 text-center"
                      style={{
                        fontFamily: fontDef.css,
                        fontVariant: fontDef.fontVariant,
                        color: textColor,
                        fontWeight: 700,
                        fontSize: Math.max(14, (design.currentSizePx * sizeScale) / 6),
                        lineHeight: 1.1,
                        wordBreak: "break-word",
                        textShadow: color === "black" ? "0 0 2px rgba(0,0,0,0.3)" : "0 0 2px rgba(255,255,255,0.3)",
                      }}
                    >
                      {design.textContent}
                    </div>
                  ) : (
                    <img
                      src={imageToShow!}
                      alt="Design"
                      className="w-full h-full object-contain pointer-events-none"
                      draggable={false}
                      crossOrigin="anonymous"
                    />
                  )}
                  
                  {selectedDesignId === design.id && (
                    <>
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDesign(design.id);
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Rotate Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDesigns(prev => prev.map(d => 
                            d.id === design.id ? { ...d, rotation: (d.rotation || 0) + 90 } : d
                          ));
                        }}
                        onTouchEnd={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setDesigns(prev => prev.map(d => 
                            d.id === design.id ? { ...d, rotation: (d.rotation || 0) + 90 } : d
                          ));
                        }}
                        className="absolute -top-2 -left-2 w-6 h-6 bg-[#3e92cc] rounded-full flex items-center justify-center text-black hover:bg-[#3e92cc]"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>

                      {/* Text-specific: Font cycle + always-visible color bar (only for text designs) */}
                      {isText && (() => {
                        const cycleFont = () => {
                          const currentIdx = TEXT_FONTS.findIndex(f => f.id === (design.textFont || TEXT_FONTS[0].id));
                          const nextFont = TEXT_FONTS[(currentIdx + 1) % TEXT_FONTS.length];
                          setDesigns(prev => prev.map(d =>
                            d.id === design.id ? { ...d, textFont: nextFont.id } : d
                          ));
                        };
                        const applyColor = (hex: string) => {
                          setDesigns(prev => prev.map(d =>
                            d.id === design.id ? { ...d, textColor: hex || undefined } : d
                          ));
                        };
                        // Stop event + run action on pointer-down so action fires BEFORE the
                        // parent design wrapper's drag handler can consume the event.
                        const stopAndRun = (fn: () => void) => (e: React.SyntheticEvent) => {
                          e.stopPropagation();
                          e.preventDefault();
                          fn();
                        };
                        const blockEvent = (e: React.SyntheticEvent) => {
                          e.stopPropagation();
                          e.preventDefault();
                        };
                        return (
                          <>
                            {/* Font cycle button - above the text */}
                            <button
                              type="button"
                              onPointerDown={stopAndRun(cycleFont)}
                              onMouseDown={blockEvent}
                              onTouchStart={(e) => { e.stopPropagation(); }}
                              onClick={blockEvent}
                              title={t.textFont}
                              className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 h-7 bg-black/85 backdrop-blur-sm rounded text-white text-[11px] font-bold hover:bg-black flex items-center gap-1 whitespace-nowrap z-30 shadow-lg"
                              style={{ fontFamily: fontDef.css, fontVariant: fontDef.fontVariant }}
                            >
                              <span className="opacity-60 text-[9px]">Aa</span>
                              <span>{fontDef.name}</span>
                            </button>

                            {/* Always-visible color swatch bar below the text */}
                            <div
                              onPointerDown={(e) => { e.stopPropagation(); }}
                              onMouseDown={blockEvent}
                              onTouchStart={(e) => { e.stopPropagation(); }}
                              onClick={blockEvent}
                              className="absolute -bottom-12 left-1/2 -translate-x-1/2 z-30 bg-black/85 backdrop-blur-sm rounded-lg px-2 py-1.5 flex gap-1 items-center shadow-lg"
                              style={{ width: "max-content", maxWidth: "min(92vw, 360px)" }}
                            >
                              {TEXT_COLOR_PALETTE.map(c => {
                                const isActive = (c.hex || "") === (design.textColor || "");
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onPointerDown={stopAndRun(() => applyColor(c.hex))}
                                    onMouseDown={blockEvent}
                                    onTouchStart={(e) => { e.stopPropagation(); }}
                                    onClick={blockEvent}
                                    title={c.label}
                                    className={cn(
                                      "rounded-full border-2 transition-all cursor-pointer flex-shrink-0",
                                      isActive
                                        ? "w-6 h-6 border-white ring-2 ring-[#3e92cc]"
                                        : "w-5 h-5 border-white/40 hover:border-white hover:scale-110"
                                    )}
                                    style={{
                                      background: c.hex || "conic-gradient(from 0deg, #d8315b, #f5c518, #2e7d32, #3e92cc, #d8315b)",
                                    }}
                                  >
                                    <span className="sr-only">{c.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        );
                      })()}

                      {/* Resize Handle — hidden for fixed-size sleeve designs */}
                      {!isSleeveView(design.view) && (
                        <div
                          onMouseDown={(e) => handleResizeMouseDown(e, design.id)}
                          onTouchStart={(e) => handleResizePointerDown(e, design.id)}
                          className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#3e92cc] rounded-sm cursor-se-resize flex items-center justify-center"
                        >
                          <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l16-16M12 20h8v-8" />
                          </svg>
                        </div>
                      )}

                      {/* Size Indicator */}
                      <div className={cn(
                        "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded whitespace-nowrap",
                        theme === "dark" ? "bg-neutral-800 text-neutral-300" : "bg-white text-gray-700 shadow-sm"
                      )}>
                        {isSleeveView(design.view) ? t.sleeveSizeFixed : `~${getSizeInMm(design.currentSizePx, design.size)}mm`}
                      </div>
                      
                      {/* Regenerate & History Controls - Below Design */}
                      {design.generatedImages[design.style] && (
                        <div 
                          className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm"
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          {/* Regenerate Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRegenerate();
                            }}
                            disabled={cooldown > 0 || isGenerating || design.regenerationCount >= 4}
                            className={cn(
                              "flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all",
                              cooldown > 0 || isGenerating || design.regenerationCount >= 4
                                ? "opacity-50 cursor-not-allowed text-neutral-400"
                                : "hover:bg-white/10 text-neutral-200"
                            )}
                          >
                            {isGenerating ? (
                              <Spinner className="w-3 h-3" />
                            ) : (
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            )}
                            <span>
                              {design.regenerationCount >= 4 
                                ? t.maxReached 
                                : cooldown > 0 
                                  ? `${cooldown}s` 
                                  : `(${4 - design.regenerationCount} ${t.regenLeft})`}
                            </span>
                          </button>
                          
                          {/* History Navigation */}
                          {(() => {
                            const history = design.generationHistory[design.style] || [];
                            const currentIndex = design.currentHistoryIndex[design.style] ?? 0;
                            
                            if (history.length <= 1) return null;
                            
                            return (
                              <>
                                <div className="w-px h-4 bg-neutral-600" />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateHistory("prev", design.id);
                                  }}
                                  disabled={currentIndex === 0}
                                  className={cn(
                                    "p-1 rounded transition-all",
                                    currentIndex === 0
                                      ? "opacity-30 cursor-not-allowed"
                                      : "hover:bg-white/10"
                                  )}
                                >
                                  <svg className="w-3 h-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                  </svg>
                                </button>
                                <span className="text-sm text-neutral-400 min-w-[28px] text-center">
                                  {currentIndex + 1}/{history.length}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigateHistory("next", design.id);
                                  }}
                                  disabled={currentIndex === history.length - 1}
                                  className={cn(
                                    "p-1 rounded transition-all",
                                    currentIndex === history.length - 1
                                      ? "opacity-30 cursor-not-allowed"
                                      : "hover:bg-white/10"
                                  )}
                                >
                                  <svg className="w-3 h-3 text-neutral-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}

          {/* Upload Prompt Overlay — only when view has no designs at all */}
            {currentDesignsForView.length === 0 && (
              <div 
                className="absolute inset-0 flex items-center justify-center z-10 group cursor-pointer transition-all"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                {/* Dark overlay that appears on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg" />
                
                {/* Upload prompt - subtle by default, prominent on hover */}
                <div className="relative flex flex-col items-center gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                  <div className="w-16 h-16 rounded-full bg-[#3e92cc]/20 group-hover:bg-[#3e92cc]/30 flex items-center justify-center transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#3e92cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    {designs.filter(d => !d.textContent).length === 0 ? (
                      <>
                        <p className="text-white font-semibold text-sm group-hover:text-[#3e92cc] transition-colors">{t.clickToUpload}</p>
                        <p className="text-white/40 text-xs mt-1">{t.maxFileSize}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-white font-semibold text-sm group-hover:text-[#3e92cc] transition-colors">
                          {view === "back" ? t.addToBack : view === "left-sleeve" ? t.addToLeftSleeve : view === "right-sleeve" ? t.addToRightSleeve : t.addToFront} {isSleeveView(view) ? `(+€${SLEEVE_PRICE})` : `(+€${BACK_SURCHARGE[style] || 20})`}
                        </p>
                        <p className="text-white/40 text-xs mt-1">{t.maxFileSize}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-[#3e92cc]" />
                  <span className="text-white text-sm">{t.generating}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Badges - Hidden on mobile */}
        <div className="hidden md:flex justify-center gap-4 p-4">
          <div className={cn(
            "px-3 py-1.5 rounded text-sm font-semibold uppercase tracking-wide",
            theme === "dark" ? "bg-neutral-800 text-neutral-400" : "bg-white text-gray-500 shadow-sm"
          )}>
            {product.toUpperCase()} · {color.toUpperCase()} · {view.toUpperCase()}
          </div>
          {selectedDesign && (
            <div className={cn(
              "px-3 py-1.5 rounded text-xs font-medium",
              theme === "dark" ? "bg-neutral-800 text-neutral-400" : "bg-white text-gray-500 shadow-sm"
            )}>
              {selectedDesign.style === "outline" ? t.styleOutline : selectedDesign.style === "standard" ? t.styleStandard : selectedDesign.style === "pet-head" ? t.stylePetHead : t.styleCar} · {selectedDesign.size}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Controls - Second on mobile, First on desktop */}
      <div className={cn(
        "w-full md:w-80 lg:w-[360px] xl:w-[400px] md:min-w-[320px] flex-shrink-0 order-2 md:order-1 overflow-y-auto border-t md:border-t-0 md:border-r pb-32 md:pb-0 md:h-screen md:sticky md:top-0",
        theme === "dark" ? "bg-[#1e1b18] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <a href="https://tinythread.shop" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full border-2 border-[#3e92cc] flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#3e92cc]" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <span className={cn("font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>TinyThread</span>
              <span className="text-[#3e92cc] text-xs font-medium">STUDIO</span>
            </a>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLangChange(lang === "lv" ? "en" : "lv")}
                className={cn(
                  "px-2 py-1 rounded-md text-xs font-semibold border transition-colors",
                  theme === "dark"
                    ? "border-neutral-700 text-neutral-300 hover:border-[#3e92cc] hover:text-[#3e92cc]"
                    : "border-gray-300 text-gray-600 hover:border-[#3e92cc] hover:text-[#3e92cc]"
                )}
                aria-label="Language"
              >
                {lang === "lv" ? "EN" : "LV"}
              </button>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className={cn("p-2 rounded-lg", theme === "dark" ? "hover:bg-neutral-800 text-neutral-400" : "hover:bg-gray-100 text-gray-500")}
              >
                {theme === "dark" ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Customer Login Status & My Designs */}
          {customer ? (
            <div className="space-y-2">
              <div className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                theme === "dark" ? "bg-[#3e92cc]/20 text-[#3e92cc]" : "bg-[#3e92cc]/10 text-[#3e92cc]"
              )}>
                <span>{customer.firstName}</span>
                <button
                  onClick={() => setShowSavedDesigns(!showSavedDesigns)}
                  className={cn(
                    "text-xs px-2 py-1 rounded transition-colors",
                    theme === "dark" ? "bg-neutral-800 hover:bg-neutral-700" : "bg-white hover:bg-gray-100"
                  )}
                >
                  {t.myDesigns} ({savedDesigns.length})
                </button>
              </div>

              {showSavedDesigns && (
                <div className={cn(
                  "rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto",
                  theme === "dark" ? "bg-neutral-900 border border-neutral-800" : "bg-gray-50 border border-gray-200"
                )}>
                  <p className={cn("text-xs font-semibold", theme === "dark" ? "text-white/60" : "text-gray-500")}>
                    {"SAGLAB\u0100TIE DIZAINI"}
                  </p>
                  {isLoadingSaved ? (
                    <p className="text-xs text-center py-4 opacity-50">{t.loading}</p>
                  ) : savedDesigns.length === 0 ? (
                    <p className="text-xs text-center py-4 opacity-50">{"Nav saglab\u0101tu dizainu"}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {savedDesigns.map((saved) => {
                        const thumbSrc = saved.thumbnailUrl || saved.generatedImageUrl || saved.originalImageUrl || "";
                        return (
                          <div
                            key={saved.id}
                            className={cn(
                              "rounded-lg overflow-hidden border-2 transition-all",
                              theme === "dark" ? "border-neutral-700 hover:border-[#3e92cc]" : "border-gray-200 hover:border-[#3e92cc]"
                            )}
                          >
                            <div
                              className="w-full aspect-[4/3] cursor-pointer overflow-hidden flex items-center justify-center"
                              style={thumbSrc.startsWith("data:") || thumbSrc.startsWith("http") ? { backgroundImage: `url(${thumbSrc})`, backgroundSize: "cover", backgroundPosition: "center" } : {}}
                              onClick={() => {
                                console.log("[SAVED] Clicked design:", saved.id, saved.style);
                                applySavedDesign(saved);
                              }}
                            >
                              {!thumbSrc && <span className="text-xs opacity-30">{saved.style}</span>}
                            </div>
                            <div className="flex items-center justify-between px-2 py-1" style={{ background: theme === "dark" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.9)" }}>
                              <span
                                className={cn("text-[10px] truncate flex-1 cursor-pointer", theme === "dark" ? "text-white/70" : "text-gray-600")}
                                onClick={() => { applySavedDesign(saved); }}
                              >
                                {saved.style} - {saved.view}
                              </span>
                              <span
                                className="text-red-400 hover:text-red-300 p-0.5 cursor-pointer"
                                onClick={() => {
                                  if (customer) {
                                    fetch("/api/designs", {
                                      method: "DELETE",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ customerId: customer.id, designId: saved.id }),
                                    })
                                      .then(() => loadSavedDesigns(customer.id))
                                      .catch(() => {});
                                  }
                                }}
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {/* How It Works Button */}
          <button
            onClick={() => setShowGuide(true)}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
              theme === "dark" 
                ? "bg-[#3e92cc]/10 text-[#3e92cc]/70 hover:bg-[#3e92cc]/20 hover:text-[#3e92cc]"
                : "bg-[#3e92cc]/10 text-[#3e92cc] hover:bg-[#3e92cc]/20"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.howItWorks}
          </button>

          {/* Product Selection */}
          <div className="space-y-2">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              {t.product}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["hoodie", "cap"] as Product[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    setProduct(p);
                    if (p === "cap") setView("front");
                  }}
                  className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    product === p
                      ? "border-[#3e92cc] bg-[#3e92cc]/10 text-[#3e92cc]"
                      : theme === "dark"
                        ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                        : "border-gray-200 text-gray-700 hover:border-gray-300"
                  )}
                >
                  {p === "hoodie" ? t.hoodie : t.cap}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              {t.color}
            </label>
            <div className="flex gap-3">
              {(["black", "white"] as Color[]).map(c => {
                const colorLabel = c === "black"
                  ? (lang === "lv" ? "Melna" : "Black")
                  : (lang === "lv" ? "Krēma krāsa" : "Cream");
                return (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-all",
                      color === c ? "ring-2 ring-[#3e92cc] ring-offset-2" : "",
                      theme === "dark" ? "ring-offset-[#0d0d0d]" : "ring-offset-white",
                      c === "black" ? "bg-black border-neutral-600" : "border-gray-300"
                    )}
                    style={c === "white" ? { background: "#F4ECD8" } : undefined}
                    title={colorLabel}
                  />
                );
              })}
            </div>
          </div>

          {/* View Selection */}
          {product === "hoodie" && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.view}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["front", "back", "left-sleeve", "right-sleeve"] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "py-2 px-3 rounded-lg border text-sm font-medium transition-all",
                      view === v
                        ? "border-[#3e92cc] bg-[#3e92cc]/10 text-[#3e92cc]"
                        : theme === "dark"
                          ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {v === "front" ? t.front : v === "back" ? t.back : v === "left-sleeve" ? t.leftSleeve : t.rightSleeve}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection — hidden for sleeve views (fixed 100mm) */}
          {isSleeveView(view) ? (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.size}
              </label>
              <div className={cn(
                "px-4 py-3 rounded-lg border text-center text-sm font-semibold",
                theme === "dark" ? "border-neutral-700 text-neutral-300 bg-neutral-800/50" : "border-gray-200 text-gray-600 bg-gray-50"
              )}>
                {t.sleeveSizeFixed}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.size}
              </label>
              <div className={cn("grid gap-2", (product === "cap" || selectedIsAdditional) ? "grid-cols-2" : "grid-cols-3")}>
                {(product === "cap" || selectedIsAdditional ? ["S", "M"] as Size[] : ["S", "M", "L"] as Size[]).map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      const { min, max } = SIZE_CONSTRAINTS[s];
                      const mid = Math.round(min + (max - min) / 2);
                      setDesigns(prev => {
                        // Build the set of primary design IDs (first photo per view) for the fallback case
                        const primaryIds = new Set(
                          ["front", "back", "left-sleeve", "right-sleeve"]
                            .map(v => prev.find(d => d.view === v && !d.textContent)?.id)
                            .filter(Boolean) as string[]
                        );
                        return prev.map(d => {
                          if (isSleeveView(d.view) || d.textContent) return d;
                          const targeted = selectedDesignId
                            ? d.id === selectedDesignId
                            : primaryIds.has(d.id);
                          if (!targeted) return d;
                          return { ...d, size: s, currentSizePx: mid };
                        });
                      });
                      if (!selectedIsAdditional) setSize(s);
                    }}
                    className={cn(
                      "py-2 px-2 rounded-lg border text-center transition-all",
                      (selectedDesign?.size ?? size) === s
                        ? "border-[#3e92cc] bg-[#3e92cc]/10"
                        : theme === "dark"
                          ? "border-neutral-700 hover:border-neutral-600"
                          : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <div className={cn("text-lg font-semibold", (selectedDesign?.size ?? size) === s ? "text-[#3e92cc]" : theme === "dark" ? "text-white" : "text-gray-900")}>{s}</div>
                    <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>{SIZE_CONSTRAINTS[s].label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* What to Expect - Before/After Example */}
          {!designs.length && (style === "pet-head" || style === "car" || style === "standard" || style === "outline") && (
            <div className={cn("rounded-xl overflow-hidden border", theme === "dark" ? "border-neutral-800 bg-neutral-900/50" : "border-gray-200 bg-gray-50")}>
              <div className={cn("px-3 py-2 text-center", theme === "dark" ? "bg-neutral-800/50" : "bg-gray-100")}>
                <p className={cn("text-xs font-semibold uppercase tracking-wider", theme === "dark" ? "text-neutral-400" : "text-gray-500")}>
                  {t.fromPhotoToStitch}
                </p>
              </div>
              <div className="flex items-center gap-2 p-3">
                <div className="flex-1 relative">
                  <img src={style === "car" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/car_before.jpg" : style === "standard" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/logo_before_final.jpg" : style === "outline" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/outline_before.jpg" : "https://guhctceu21hc4orl.public.blob.vercel-storage.com/example_before.jpg"} alt="Before" className="w-full aspect-square object-cover rounded-lg" />
                  <div className={cn("absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold", theme === "dark" ? "bg-black/70 text-white/70" : "bg-white/80 text-gray-600")}>
                    {t.photoLabel}
                  </div>
                </div>
                <div className={cn("text-lg flex-shrink-0", theme === "dark" ? "text-neutral-600" : "text-gray-300")}>→</div>
                <div className="flex-1 relative">
                  <img src={style === "car" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/car_after.jpg" : style === "standard" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/logo_after_final.jpg" : style === "outline" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/outline_after.jpg" : "https://guhctceu21hc4orl.public.blob.vercel-storage.com/example_after.jpg"} alt="After" className="w-full aspect-square object-cover rounded-lg" />
                  <div className={cn("absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold", theme === "dark" ? "bg-black/70 text-[#3e92cc]" : "bg-white/80 text-[#3e92cc]")}>
                    {t.resultLabel}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Style Selection */}
          <div className="space-y-2">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              {t.style}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStyleChange(s.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    style === s.id
                      ? "border-[#3e92cc] bg-[#3e92cc]/10"
                      : theme === "dark"
                        ? "border-neutral-700 hover:border-neutral-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("font-medium text-sm", style === s.id ? "text-[#3e92cc]" : theme === "dark" ? "text-white" : "text-gray-900")}>
                    {s.id === "outline" ? t.styleOutline : s.id === "standard" ? t.styleStandard : s.id === "pet-head" ? t.stylePetHead : t.styleCar}
                  </div>
                  <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                    {s.id === "outline" ? t.outlineDesc : s.id === "standard" ? t.standardDesc : s.id === "pet-head" ? t.petHeadDesc : t.carDesc}
                  </div>
                  <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                    {t.bestFor}: {s.id === "outline" ? t.outlineBest : s.id === "standard" ? t.standardBest : s.id === "pet-head" ? t.petHeadBest : t.carBest}
                  </div>
                </button>
              ))}
            </div>
            {style === "pet-head" && (
              <div className="p-2 rounded-lg bg-[#3e92cc]/10 border border-[#3e92cc]/20">
                <p className="text-xs text-[#3e92cc]">{t.petHeadHint}</p>
              </div>
            )}
            <div className="text-center text-sm mt-2">
              <span className={theme === "dark" ? "text-white/40" : "text-gray-500"}>{t.price}: </span>
              <span className="text-[#3e92cc] font-bold text-xl">
                {currentPrice > 0 ? `€${currentPrice}` : "—"}
              </span>
              {backSurcharge > 0 && (
                <span className="text-[#3e92cc]/60 text-xs ml-1">({t.inclBack} +€{backSurcharge})</span>
              )}
              {sleeveSurcharge > 0 && (
                <span className="text-[#3e92cc]/60 text-xs ml-1">({t.inclSleeve} +€{sleeveSurcharge})</span>
              )}
              {textSurcharge > 0 && (
                <span className="text-[#3e92cc]/60 text-xs ml-1">({t.textPrice} +€{textSurcharge})</span>
              )}
              {additionalDesignSurcharge > 0 && (
                <span className="text-[#3e92cc]/60 text-xs ml-1">({t.additionalDesign} +€{additionalDesignSurcharge})</span>
              )}
            </div>
          </div>

          {/* Remove Background Toggle */}
          <div className="flex items-center justify-between">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              {t.removeBackground}
            </label>
            <Switch
              checked={removeBackground}
              onCheckedChange={setRemoveBackground}
              disabled={designs.length > 0}
            />
          </div>

          {/* Upload Photo — visible whenever the current view has no photo design */}
          {!currentDesignsForView.some(d => !d.textContent) && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.uploadPhoto}
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                className={cn(
                  "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all",
                  theme === "dark"
                    ? "border-neutral-700 hover:border-neutral-600"
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <svg className={cn("w-8 h-8 mx-auto mb-2", theme === "dark" ? "text-neutral-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={cn("text-sm", theme === "dark" ? "text-neutral-400" : "text-gray-600")}>
                  {t.dropImageBrowse} <span className="text-[#3e92cc] hover:underline">{t.browse}</span>
                </p>
                <p className={cn("text-xs mt-1", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                  {t.maxFileSize}
                </p>
              </div>
            </div>
          )}

          {/* File input - always in DOM so hoodie click works */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
              e.target.value = "";
            }}
            className="hidden"
          />

          {/* Design Layers */}
          {designs.length > 0 && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.designLayers}
              </label>
              <div className="space-y-2">
                {designs.map((design, designIdx) => (
                  <div
                    key={design.id}
                    onClick={() => {
                      setSelectedDesignId(design.id);
                      // Sync style selector to this design so the user sees which style is active
                      if (!design.textContent) setStyle(design.style);
                    }}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                      selectedDesignId === design.id
                        ? "border-[#3e92cc] bg-[#3e92cc]/10"
                        : theme === "dark"
                          ? "border-neutral-700 hover:border-neutral-600"
                          : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {design.textContent ? (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-[10px] font-bold text-center px-1 leading-tight overflow-hidden"
                        style={{
                          background: color === "black" ? "#1a1a1a" : "#f5f5f5",
                          color: design.textColor || (color === "black" ? "#fff" : "#000"),
                          fontFamily: (TEXT_FONTS.find(f => f.id === design.textFont) || TEXT_FONTS[0]).css,
                          fontVariant: (TEXT_FONTS.find(f => f.id === design.textFont) || TEXT_FONTS[0]).fontVariant,
                        }}
                      >
                        {design.textContent.slice(0, 6)}
                      </div>
                    ) : (
                      <img
                        src={design.originalImage}
                        alt="Design"
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium truncate", theme === "dark" ? "text-white" : "text-gray-900")}>
                        {design.textContent
                          ? `${t.textOnly}: "${design.textContent}"`
                          : designLabels[designIdx]}
                      </div>
                      <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                        {design.view === "front" ? t.front : design.view === "back" ? t.back : design.view === "left-sleeve" ? t.leftSleeve : t.rightSleeve}{design.textContent || isSleeveView(design.view) ? "" : ` · ${design.size}`}
                      </div>
                    </div>
                    {design.textContent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditText(design);
                        }}
                        className="p-1 rounded hover:bg-[#3e92cc]/20 text-[#3e92cc]"
                        title={t.addText}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                    )}
                    {customer && !design.textContent && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveDesign(design);
                        }}
                        disabled={isSavingDesign}
                        className={cn("p-1 rounded transition-colors", isSavingDesign ? "opacity-50" : "hover:bg-[#3e92cc]/20 text-[#3e92cc]")}
                        title={"Saglab\u0101t dizainu"}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDesign(design.id);
                      }}
                      className={cn("p-1 rounded hover:bg-red-500/20 text-red-400")}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
              {/* Show "Add to back/front" button only for hoodies, max 1 photo design per side */}
              {product === "hoodie" && (() => {
                const photoDesigns = designs.filter(d => !d.textContent);
                if (photoDesigns.length !== 1) return null;
                const existingView = photoDesigns[0]?.view;
                const otherView = existingView === "front" ? "back" : "front";
                const hasPhotoOnOtherSide = photoDesigns.some(d => d.view === otherView);
                if (hasPhotoOnOtherSide) return null;
                const surcharge = BACK_SURCHARGE[style] || 20;
                return (
                  <button
                    onClick={() => {
                      setView(otherView as "front" | "back");
                      setTimeout(() => fileInputRef.current?.click(), 100);
                    }}
                    className={cn(
                      "w-full py-2 text-sm border border-dashed rounded-lg transition-all",
                      theme === "dark"
                        ? "border-[#3e92cc]/50 text-[#3e92cc] hover:border-[#3e92cc] hover:bg-[#3e92cc]/20"
                        : "border-[#3e92cc]/60 text-[#3e92cc] hover:border-[#3e92cc] hover:bg-[#3e92cc]/10"
                    )}
                  >
                    + {otherView === "back" ? t.addToBack : t.addToFront}
                  </button>
                );
              })()}
              {/* Add another design to current side (2nd or 3rd photo on front/back) */}
              {!isSleeveView(view) && (() => {
                const photosOnCurrentView = designs.filter(d => d.view === view && !d.textContent).length;
                if (photosOnCurrentView < 1 || photosOnCurrentView >= MAX_DESIGNS_PER_SIDE) return null;
                const eff = (size === "L" ? "M" : size) as "S" | "M";
                const addPrice = ADDITIONAL_DESIGN_PRICING[style]?.[eff] || 0;
                return (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "w-full py-2 text-sm border border-dashed rounded-lg transition-all",
                      theme === "dark"
                        ? "border-[#3e92cc]/50 text-[#3e92cc] hover:border-[#3e92cc] hover:bg-[#3e92cc]/20"
                        : "border-[#3e92cc]/60 text-[#3e92cc] hover:border-[#3e92cc] hover:bg-[#3e92cc]/10"
                    )}
                  >
                    + {t.addAnotherDesign}
                  </button>
                );
              })()}
            </div>
          )}

          {/* Add Text Button (only if there's no text on current side) */}
          {!designs.some(d => d.view === view && !!d.textContent) && (() => {
            const sleeveHasPhoto = isSleeveView(view) && designs.some(d => d.view === view && !d.textContent);
            const label = sleeveHasPhoto ? t.addTextFree : t.addTextCta;
            return (
              <button
                onClick={() => setShowTextModal(true)}
                className={cn(
                  "w-full py-2.5 text-sm font-medium rounded-lg border border-dashed transition-all flex items-center justify-center gap-2",
                  sleeveHasPhoto
                    ? (theme === "dark" ? "border-green-500/50 text-green-400 hover:bg-green-500/10" : "border-green-500/60 text-green-600 hover:bg-green-500/10")
                    : (theme === "dark" ? "border-[#3e92cc]/40 text-[#3e92cc] hover:bg-[#3e92cc]/10" : "border-[#3e92cc]/60 text-[#3e92cc] hover:bg-[#3e92cc]/10")
                )}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
                {label}
              </button>
            );
          })()}

          {/* Save Design Button */}
          {customer && designs.length > 0 && (
            <button
              onClick={() => {
                const activeDesign = designs.find(d => d.id === selectedDesignId) || designs[0];
                if (activeDesign) handleSaveDesign(activeDesign);
              }}
              disabled={isSavingDesign}
              className={cn(
                "w-full py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2",
                isSavingDesign ? "opacity-50" : "",
                theme === "dark"
                  ? "border-[#3e92cc]/50 text-[#3e92cc] hover:bg-[#3e92cc]/20"
                  : "border-[#3e92cc]/60 text-[#3e92cc] hover:bg-[#3e92cc]/10"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isSavingDesign
                ? ("Saglab\u0101...")
                : ("Saglab\u0101t dizainu")
              }
            </button>
          )}

          {/* Add to Cart Button - Desktop (in sidebar flow) */}
          <div className="hidden md:block space-y-1.5">
            <Button
              data-testid="add-to-cart"
              onClick={handleAddToCartClick}
              disabled={designs.length === 0 || isAddingToCart}
              className="w-full bg-[#d8315b] hover:bg-[#c02850] text-white font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.addingToCart}
                </>
              ) : (
                <>{t.addToCart} — €{currentPrice}</>
              )}
            </Button>
            {/* Order multiple identical */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setMultipleQtys({ S: 0, M: 0, L: 0, XL: 0 }); setShowMultipleModal(true); }}
                disabled={designs.length === 0}
                className={cn(
                  "flex-1 py-2 text-xs font-medium rounded-lg border border-dashed transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                  theme === "dark"
                    ? "border-white/20 text-white/50 hover:border-white/40 hover:text-white/80 hover:bg-white/5"
                    : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700 hover:bg-gray-50"
                )}
              >
                {t.orderMultiple}
              </button>
              <div className="relative shrink-0">
                <button
                  onMouseEnter={() => setShowMultipleTooltip(true)}
                  onMouseLeave={() => setShowMultipleTooltip(false)}
                  onClick={() => setShowMultipleTooltip(v => !v)}
                  className={cn(
                    "w-5 h-5 rounded-full border text-xs flex items-center justify-center transition-colors",
                    theme === "dark"
                      ? "border-white/25 text-white/40 hover:border-white/50 hover:text-white/70"
                      : "border-gray-300 text-gray-400 hover:border-gray-500 hover:text-gray-600"
                  )}
                  aria-label="Info"
                >ℹ</button>
                {showMultipleTooltip && (
                  <div className={cn(
                    "absolute bottom-full right-0 mb-2 px-3 py-2 text-xs rounded-lg w-64 z-50 shadow-lg pointer-events-none",
                    theme === "dark"
                      ? "bg-neutral-800 border border-white/10 text-white/80"
                      : "bg-white border border-gray-200 text-gray-700"
                  )}>
                    {t.orderMultipleTooltip}
                  </div>
                )}
              </div>
            </div>
            <p className={cn("text-xs text-center", theme === "dark" ? "text-white/30" : "text-gray-400")}>
              {t.designFilesSent}
            </p>
          </div>
        </div>
      </div>

      {/* Add to Cart Button - Mobile (sticky at bottom) */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 p-3 border-t z-50",
        theme === "dark" ? "bg-[#1e1b18] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <Button
          data-testid="add-to-cart-mobile"
          onClick={handleAddToCartClick}
          disabled={designs.length === 0 || isAddingToCart}
          className="w-full bg-[#d8315b] hover:bg-[#c02850] text-white font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t.addingToCart}
            </>
          ) : (
            <>{t.addToCart} — €{currentPrice}</>
          )}
        </Button>
        <div className="flex items-center gap-2 mt-1.5">
          <button
            onClick={() => { setMultipleQtys({ S: 0, M: 0, L: 0, XL: 0 }); setShowMultipleModal(true); }}
            disabled={designs.length === 0}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg border border-dashed transition-all disabled:opacity-40 disabled:cursor-not-allowed",
              theme === "dark"
                ? "border-white/20 text-white/50 hover:border-white/40 hover:text-white/70"
                : "border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
            )}
          >
            {t.orderMultiple}
          </button>
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMultipleTooltip(v => !v)}
              className={cn(
                "w-5 h-5 rounded-full border text-xs flex items-center justify-center",
                theme === "dark"
                  ? "border-white/25 text-white/40"
                  : "border-gray-300 text-gray-400"
              )}
              aria-label="Info"
            >ℹ</button>
            {showMultipleTooltip && (
              <div className={cn(
                "absolute bottom-full right-0 mb-2 px-3 py-2 text-xs rounded-lg w-64 z-50 shadow-lg",
                theme === "dark"
                  ? "bg-neutral-800 border border-white/10 text-white/80"
                  : "bg-white border border-gray-200 text-gray-700"
              )}>
                {t.orderMultipleTooltip}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Welcome Popup - First Visit */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🧵</div>
            <h2 className="text-xl font-bold text-white mb-2">{t.welcome}</h2>
            <p className="text-white/50 text-sm mb-6">{t.welcomeDesc}</p>
            
            <p className="text-white/70 text-sm mb-6">{t.welcomePrompt}</p>
            
            <div className="flex gap-3 justify-center mb-4">
              <button
                onClick={() => { setShowWelcome(false); setShowGuide(true); localStorage.setItem("tinythread_visited", "1"); }}
                className="px-6 py-3 bg-[#3e92cc] text-white font-bold rounded-lg hover:bg-[#2f7bb0] transition-colors"
              >
                {t.showGuide}
              </button>
            </div>
            
            <button
              onClick={() => { setShowWelcome(false); localStorage.setItem("tinythread_visited", "1"); }}
              className="text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              {t.skipGuide}
            </button>
          </div>
        </div>
      )}

      {/* Max Designs Popup */}
      {showMaxDesignsPopup && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className={cn("rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl", theme === "dark" ? "bg-[#1e1b18] border border-white/10" : "bg-white border border-gray-200")}>
            <div className="text-4xl mb-4">🧵</div>
            <h2 className={cn("text-lg font-bold mb-3", theme === "dark" ? "text-white" : "text-gray-900")}>{t.maxDesignsTitle}</h2>
            <p className={cn("text-sm mb-6", theme === "dark" ? "text-white/60" : "text-gray-500")}>{t.maxDesignsBody}</p>
            <button
              onClick={() => setShowMaxDesignsPopup(false)}
              className="px-8 py-3 bg-[#3e92cc] text-white font-bold rounded-lg hover:bg-[#2f7bb0] transition-colors"
            >
              {t.maxDesignsOk}
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
        >
          <div className="bg-[#0f0f0f] border border-white/8 rounded-t-3xl sm:rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">

            {/* Step icon hero */}
            <div className="relative flex flex-col items-center justify-center px-6 pt-8 pb-6 text-center"
              style={{ background: "linear-gradient(160deg, #1a1f2e 0%, #0f0f0f 100%)" }}
            >
              <button
                onClick={() => { setShowGuide(false); setGuideStep(0); }}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-white/30 hover:text-white/70 transition-colors text-xs"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >✕</button>

              {/* Large icon box */}
              <div
                className="w-24 h-24 flex items-center justify-center rounded-2xl mb-5"
                style={{ background: "linear-gradient(135deg, rgba(62,146,204,0.18) 0%, rgba(62,146,204,0.04) 100%)", border: "1px solid rgba(62,146,204,0.2)" }}
              >
                <span className="text-5xl leading-none select-none">{GUIDE_CONTENT[guideLang][guideStep].icon}</span>
              </div>

              <h3 className="text-xl font-bold text-white leading-snug tracking-tight">
                {GUIDE_CONTENT[guideLang][guideStep].title}
              </h3>
            </div>

            {/* Body */}
            <div className="px-7 py-5">
              <p className="text-white/55 text-sm leading-relaxed">
                {GUIDE_CONTENT[guideLang][guideStep].text}
              </p>
            </div>

            {/* Footer */}
            <div
              className="px-7 pb-7 pt-3 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-xs font-semibold text-white/25 tabular-nums tracking-wide">
                {guideStep + 1} / {GUIDE_CONTENT[guideLang].length}
              </span>

              <div className="flex items-center gap-2">
                {guideStep > 0 && (
                  <button
                    onClick={() => setGuideStep(guideStep - 1)}
                    className="px-4 py-2 text-sm text-white/40 hover:text-white/70 rounded-xl transition-colors"
                    style={{ background: "transparent" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    {t.back_btn}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (guideStep < GUIDE_CONTENT[guideLang].length - 1) {
                      setGuideStep(guideStep + 1);
                    } else {
                      setShowGuide(false);
                      setGuideStep(0);
                    }
                  }}
                  className="px-5 py-2 bg-[#3e92cc] text-white font-bold rounded-xl text-sm hover:bg-[#2f7bb0] transition-colors"
                >
                  {guideStep < GUIDE_CONTENT[guideLang].length - 1 ? t.next : t.startCreating}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Text Input Modal */}
      {showTextModal && (() => {
        const activeMaxChars = isSleeveView(view) ? SLEEVE_TEXT_MAX_CHARS : TEXT_MAX_CHARS;
        return (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">{t.addText}</h2>
              <button
                onClick={() => { setShowTextModal(false); setTextInput(""); setEditingTextId(null); setTextColorInput(""); }}
                className="text-white/40 hover:text-white/70"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value.slice(0, activeMaxChars))}
                  placeholder={t.textPlaceholder}
                  rows={2}
                  maxLength={activeMaxChars}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#3e92cc]/60 resize-none"
                  autoFocus
                />
                <p className="text-white/40 text-xs mt-1.5 text-right">
                  {activeMaxChars - textInput.length} {t.textCharsLeft}
                </p>
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                  {t.textFont}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TEXT_FONTS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setTextFontInput(f.id)}
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm transition-colors text-left",
                        textFontInput === f.id
                          ? "border-[#3e92cc] bg-[#3e92cc]/10 text-white"
                          : "border-white/10 text-white/60 hover:border-white/30"
                      )}
                      style={{ fontFamily: f.css, fontVariant: f.fontVariant }}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wider mb-2">
                  {t.textColor}
                </label>
                <div className="flex flex-wrap gap-2">
                  {TEXT_COLOR_PALETTE.map(c => {
                    const isActive = (c.hex || "") === textColorInput;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setTextColorInput(c.hex || "")}
                        title={c.label}
                        className={cn(
                          "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                          isActive ? "border-white ring-2 ring-[#3e92cc]" : "border-white/20"
                        )}
                        style={{
                          background: c.hex || "linear-gradient(135deg, #d8315b 0%, #f5c518 33%, #2e7d32 66%, #3e92cc 100%)",
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Live preview */}
              {textInput.trim() && (
                <div className="rounded-lg border border-white/10 p-4 text-center" style={{ background: color === "black" ? "#1a1a1a" : "#f5f5f5" }}>
                  <p
                    style={{
                      fontFamily: (TEXT_FONTS.find(f => f.id === textFontInput) || TEXT_FONTS[0]).css,
                      fontVariant: (TEXT_FONTS.find(f => f.id === textFontInput) || TEXT_FONTS[0]).fontVariant,
                      color: textColorInput || (color === "black" ? "#FFFFFF" : "#000000"),
                      fontWeight: 700,
                      fontSize: 24,
                      lineHeight: 1.1,
                      wordBreak: "break-word",
                    }}
                  >
                    {textInput.trim()}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => { setShowTextModal(false); setTextInput(""); setEditingTextId(null); setTextColorInput(""); }}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-[#d8315b] hover:bg-[#c02850] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingTextId ? t.addText : (isSleeveView(view) && designs.some(d => d.view === view && !d.textContent)) ? t.addTextFree : t.addTextCta}
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Order Multiple Identical Modal */}
      {showMultipleModal && (() => {
        const hoodieSizes = [
          { key: "S",  label: "S"    },
          { key: "M",  label: "M"    },
          { key: "L",  label: "L"    },
          { key: "XL", label: "XL"   },
        ];
        const capSizes = [
          { key: "S", label: "S/M"  },
          { key: "M", label: "L/XL" },
        ];
        const sizes = product === "hoodie" ? hoodieSizes : capSizes;
        const pricingTable = (PRICING[product] || {})[primaryPhotoStyle] || {};
        const photoFrontForModal = designs.find(d => d.view === "front" && !d.textContent);
        const photoBackForModal  = designs.find(d => d.view === "back"  && !d.textContent);
        const hasFBModal = !!photoFrontForModal && !!photoBackForModal;
        const variantStyleForModal = ((photoFrontForModal?.style || photoBackForModal?.style || style) === "car" ? "pet-head" : (photoFrontForModal?.style || photoBackForModal?.style || style));

        return (
          <div
            className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowMultipleModal(false); }}
          >
            <div className={cn(
              "rounded-2xl p-6 w-full max-w-sm shadow-2xl",
              theme === "dark" ? "bg-[#1e1b18] border border-white/10" : "bg-white border border-gray-200"
            )}>
              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className={cn("text-base font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
                  {t.orderMultipleTitle}
                </h2>
                <button
                  onClick={() => setShowMultipleModal(false)}
                  className={cn(
                    "w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors",
                    theme === "dark" ? "text-white/40 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                  )}
                >✕</button>
              </div>

              {/* Size columns */}
              <div className={cn("grid gap-2 mb-5", product === "hoodie" ? "grid-cols-4" : "grid-cols-2")}>
                {sizes.map(({ key, label }) => {
                  const price = pricingTable[key] as number | undefined;
                  const vKey = hasFBModal
                    ? `${product}-${color}-${key}-${variantStyleForModal}-fb`
                    : `${product}-${color}-${key}-${variantStyleForModal}`;
                  const hasVariant = !!VARIANT_IDS[vKey];
                  const qty = multipleQtys[key] || 0;

                  return (
                    <div
                      key={key}
                      className={cn(
                        "flex flex-col items-center gap-2 p-2.5 rounded-xl border",
                        theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50",
                        !hasVariant && "opacity-40"
                      )}
                    >
                      <span className={cn("font-bold text-sm", theme === "dark" ? "text-white" : "text-gray-900")}>{label}</span>
                      {price != null && hasVariant ? (
                        <span className={cn("text-xs", theme === "dark" ? "text-white/45" : "text-gray-400")}>€{price}</span>
                      ) : (
                        <span className={cn("text-xs", theme === "dark" ? "text-white/30" : "text-gray-400")}>{t.orderMultipleSizeNA}</span>
                      )}
                      {hasVariant ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setMultipleQtys(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))}
                            disabled={qty === 0}
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30",
                              theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            )}
                          >−</button>
                          <span className={cn("w-5 text-center text-sm font-bold tabular-nums", theme === "dark" ? "text-white" : "text-gray-900")}>{qty}</span>
                          <button
                            onClick={() => setMultipleQtys(prev => ({ ...prev, [key]: Math.min(10, (prev[key] || 0) + 1) }))}
                            disabled={qty === 10}
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors disabled:opacity-30",
                              theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                            )}
                          >+</button>
                        </div>
                      ) : (
                        <span className={cn("text-sm", theme === "dark" ? "text-white/20" : "text-gray-300")}>—</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live total */}
              <div className={cn(
                "flex items-center justify-between py-3 border-t mb-4",
                theme === "dark" ? "border-white/10" : "border-gray-200"
              )}>
                <span className={cn("text-sm", theme === "dark" ? "text-white/50" : "text-gray-500")}>{t.orderMultipleTotal}</span>
                <span className={cn("font-bold text-lg", theme === "dark" ? "text-white" : "text-gray-900")}>€{multipleOrderTotal}</span>
              </div>

              {/* Add to Cart */}
              <Button
                onClick={handleAddMultipleToCart}
                disabled={multipleOrderTotalQty === 0 || isAddingMultiple}
                className="w-full bg-[#d8315b] hover:bg-[#c02850] text-white font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isAddingMultiple ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t.orderMultipleAdding}
                  </>
                ) : (
                  <>{t.orderMultipleAddBtn}{multipleOrderTotal > 0 ? ` — €${multipleOrderTotal}` : ""}</>
                )}
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Car License Plate Popup */}
      {showCarPlatePopup && carPlatePending && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-sm w-full">
            {carPlateStep === "ask" ? (
              <>
                <h2 className="text-lg font-bold text-white mb-6 text-center">{t.carPlateQuestion}</h2>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      setShowCarPlatePopup(false);
                      const { designId, base64, sleevePlacement } = carPlatePending;
                      setCarPlatePending(null);
                      const success = await generateEmbroidery(designId, base64, "car", false, "");
                      if (success && sleevePlacement) toast({ description: t.sleeveTextReminder, duration: 7000 });
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
                  >
                    {t.carPlateNo}
                  </button>
                  <button
                    onClick={() => setCarPlateStep("input")}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#d8315b] hover:bg-[#c02850] text-white text-sm font-bold"
                  >
                    {t.carPlateYes}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-white mb-4 text-center">{t.carPlateInputLabel}</h2>
                <input
                  type="text"
                  value={carPlateInput}
                  onChange={e => setCarPlateInput(e.target.value.toUpperCase())}
                  placeholder={t.carPlateInputPlaceholder}
                  maxLength={10}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 text-white text-center text-lg font-bold placeholder-white/30 border border-white/10 focus:border-white/30 outline-none mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setCarPlateStep("ask")}
                    className="flex-1 px-4 py-3 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/15"
                  >
                    {t.back}
                  </button>
                  <button
                    disabled={!carPlateInput.trim()}
                    onClick={async () => {
                      const plate = carPlateInput.trim();
                      setShowCarPlatePopup(false);
                      const { designId, base64, sleevePlacement } = carPlatePending;
                      setCarPlatePending(null);
                      const success = await generateEmbroidery(designId, base64, "car", false, plate);
                      if (success && sleevePlacement) toast({ description: t.sleeveTextReminder, duration: 7000 });
                    }}
                    className="flex-1 px-4 py-3 rounded-lg bg-[#d8315b] hover:bg-[#c02850] text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {t.carPlateConfirm}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Popup Before Add to Cart */}
      {showConfirmCart && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🧵</div>
            <h2 className="text-xl font-bold text-white mb-2">{t.confirmTitle}</h2>
            <p className="text-white/50 text-sm mb-6">{t.confirmDesc}</p>

            {/* Show option to add back design if only front exists */}
            {designs.length === 1 && (
              <p className="text-[#3e92cc]/70 text-xs mb-6">{t.confirmAddBack}</p>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowConfirmCart(false);
                  handleAddToCart();
                }}
                className="w-full px-6 py-3 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold rounded-lg transition-colors"
              >
                {t.confirmYes}
              </button>
              
              <button
                onClick={() => setShowConfirmCart(false)}
                className="w-full px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
              >
                {t.confirmNo}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
