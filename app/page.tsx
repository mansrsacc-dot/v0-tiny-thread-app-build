"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GARMENT_IMAGES, SIZE_CONSTRAINTS, STYLES, type Product, type Color, type View, type Size, type Style } from "@/lib/garment-images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Translations
const T: Record<string, Record<string, string>> = {
  en: {
    product: "PRODUCT",
    color: "COLOR",
    view: "VIEW",
    front: "Front",
    back: "Back",
    size: "SIZE",
    style: "STYLE",
    price: "Price",
    uploadPhoto: "UPLOAD PHOTO",
    dropImage: "Drop image or browse",
    maxFileSize: "JPG, PNG - max 10MB",
    clickToUpload: "Click to upload your photo",
    fileFormats: "JPG, PNG - max 10MB",
    generating: "Generating embroidery...",
    regenerate: "Regenerate",
    left: "left",
    addToCart: "Add to Cart",
    addToBack: "Add embroidery to the back",
    addToFront: "Add embroidery to the front",
    designLayers: "DESIGN LAYERS",
    removeBackground: "Remove background",
    original: "Original",
    stitched: "Stitched",
    howItWorks: "How It Works",
    outline: "Outline",
    outlineDesc: "Elegant line-art style",
    outlineBest: "Best for: portraits, minimalist designs, signatures",
    standard: "Standard Logo",
    standardDesc: "Clean, sharp embroidery",
    standardBest: "Best for: logos, text, badges",
    photoStitch: "Photo Stitch",
    photoStitchDesc: "Ultra-detailed thread painting",
    photoStitchBest: "Best for: portraits, pets, cars",
    petHead: "Pet Head",
    petHeadDesc: "Embroidered pet face portrait",
    petHeadBest: "Best for: single pet close-up",
    inclBack: "incl. back",
    welcome: "Welcome to TinyThread Studio",
    welcomeDesc: "Create your custom embroidered garment in minutes",
    welcomeLang: "Want to learn how the studio works? Choose your language:",
    englishGuide: "English Guide",
    latvianGuide: "Latvie\u0161u ce\u013Cvedis",
    skipGuide: "Skip - I'll figure it out",
    hoodie: "Hoodie",
    cap: "Cap",
  },
  lv: {
    product: "PRODUKTS",
    color: "KR\u0100SA",
    view: "SKATS",
    front: "Priek\u0161a",
    back: "Aizmugure",
    size: "IZM\u0112RS",
    style: "STILS",
    price: "Cena",
    uploadPhoto: "AUGŠUPIELĀDĒ FOTO",
    dropImage: "Ievelc vai izvēlies failu",
    maxFileSize: "JPG, PNG - maks. 10MB",
    clickToUpload: "Nospied, lai augšupielādētu foto",
    fileFormats: "JPG, PNG - maks. 10MB",
    generating: "Ģenerē izšuvumu...",
    regenerate: "Ģenerēt vēlreiz",
    left: "atlicis",
    addToCart: "Pievienot grozam",
    addToBack: "Pievienot izšuvumu aizmugurē",
    addToFront: "Pievienot izšuvumu priekšā",
    designLayers: "DIZAINA SLĀŅI",
    removeBackground: "Noņemt fonu",
    original: "Oriģināls",
    stitched: "Izšuvums",
    howItWorks: "Kā tas strādā",
    outline: "Kontūra",
    outlineDesc: "Elegants līniju stils",
    outlineBest: "Piemērots: portreti, minimālistiski dizaini",
    standard: "Standarta Logo",
    standardDesc: "Tīrs, ass izšuvums",
    standardBest: "Piemērots: logo, teksts, emblēmas",
    photoStitch: "Foto Izšuvums",
    photoStitchDesc: "Detalizēts diegu gleznojums",
    photoStitchBest: "Piemērots: portreti, mājdzīvnieki, auto",
    petHead: "Mīluļa Portrets",
    petHeadDesc: "Izšūts mājdzīvnieka portrets",
    petHeadBest: "Piemērots: viena mājdzīvnieka tuvplāns",
    inclBack: "iekļ. aizmugure",
    welcome: "Laipni lūgti TinyThread Studijā",
    welcomeDesc: "Izveido savu pielāgoto izšuvumu dažu minūšu laikā",
    welcomeLang: "Gribi uzzināt, kā studija strādā? Izvēlies valodu:",
    englishGuide: "English Guide",
    latvianGuide: "Latvie\u0161u ce\u013Cvedis",
    skipGuide: "Izlaist",
    hoodie: "Džemperis",
    cap: "Cepure",
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
    outline:        { S: 59, M: 69, L: 99 },
    standard:       { S: 69, M: 79, L: 109 },
    "photo-stitch": { S: 79, M: 89, L: 129 },
    "pet-head":     { S: 79, M: 89, L: 129 },
  },
  cap: {
    outline:        { S: 39, M: 49 },
    standard:       { S: 45, M: 55 },
    "photo-stitch": { S: 55, M: 65 },
    "pet-head":     { S: 55, M: 65 },
  }
};

// Back embroidery surcharge by style
const BACK_SURCHARGE: Record<string, number> = {
  outline: 20,
  standard: 25,
  "photo-stitch": 35,
  "pet-head": 35,
};

// Guide content in English and Latvian
const GUIDE_CONTENT = {
  en: [
    { title: "Choose Your Product & Color", text: "Start by selecting your garment — Hoodie or Cap — and pick your color. Your embroidery will be crafted onto this exact piece.", icon: "👕" },
    { title: "Pick Your Embroidery Size", text: "S (45–100mm) — Small and subtle, perfect for chest logos.\nM (100–150mm) — Standard size, most popular choice.\nL (150–250mm) — Large and bold, a statement piece.\n\nYou can resize within your selected range by dragging the corner handle.", icon: "📐" },
    { title: "Understand the Styles", text: "Outline — Clean minimal line art. Best with clear subjects, strong silhouettes. Avoid busy backgrounds.\n\nStandard Logo — Bold flat-color graphic like a sticker. Best for logos, text, badges. Avoid detailed photos.\n\nPhoto Stitch — Ultra-detailed thread painting. Best with clear well-lit photos of any subject. Avoid blurry or dark images.\n\nPet Head — Embroidered pet face portrait. Use a close-up of ONE pet's face looking at the camera. Avoid multiple pets or full body shots.", icon: "🎨" },
    { title: "Upload Your Photo", text: "Click on the garment or the upload area to add your photo. The better your photo quality, the better your embroidery will look.\n\nTip: Use clear, well-lit images where the subject is clearly visible.", icon: "📸" },
    { title: "Preview & Adjust", text: "See how your embroidery will look on the garment. Toggle between Original and Stitched view to compare.\n\nNot happy? Click Regenerate for a new variation (up to 4 times). Drag to reposition, resize within your selected range.", icon: "✨" },
    { title: "Front & Back Embroidery", text: "You can add embroidery to both the front and back of your hoodie. Each side is a separate design with its own style, size, and placement.\n\nThis is completely optional — most customers start with just the front. If you'd like both sides, simply create your front design first, then add another design for the back.", icon: "↔️" },
    { title: "Add to Cart & Order", text: "Happy with your design? Click 'Add to Cart' to place your order. We'll handcraft your unique piece in our Riga studio using professional equipment and premium thread.", icon: "🛒" },
    { title: "Important to Know", text: "The preview you see in the studio is a digital approximation of your embroidery. The final handcrafted result may vary slightly in color, detail, and texture.\n\nThis is the beauty of real embroidery — each piece is unique, crafted with care by our artists in Riga. No two pieces are exactly alike, just like real craftsmanship should be.\n\nIf you have any questions, contact us at info@tinythread.shop", icon: "💎" }
  ],
  lv: [
    { title: "Izvēlies produktu un krāsu", text: "Sāc ar apģērba izvēli — Hoodie vai Cepure — un izvēlies krāsu. Tavs izšuvums tiks veidots tieši uz šī izstrādājuma.", icon: "👕" },
    { title: "Izvēlies izšuvuma izmēru", text: "S (45–100mm) — Mazs un neuzkrītošs, ideāls krūšu logotipam.\nM (100–150mm) — Standarta izmērs, populārākā izvēle.\nL (150–250mm) — Liels un izteiksmīgs, pamanāms akcents.\n\nTu vari mainīt izmēru izvēlētajā diapazonā, velkot stūra rokturi.", icon: "📐" },
    { title: "Izproti stilus", text: "Outline — Tīrs minimāls līniju zīmējums. Labākās bildes: skaidri objekti ar izteiktu siluetu. Izvairīties no aizņemtiem foniem.\n\nStandard Logo — Spilgta plakana grafika kā uzlīme. Labākās bildes: logo, teksts, nozīmītes. Izvairīties no detalizētām fotogrāfijām.\n\nPhoto Stitch — Ļoti detalizēta diegu glezna. Labākās bildes: skaidras, labi apgaismotas fotogrāfijas. Izvairīties no izplūdušām bildēm.\n\nPet Head — Mājdzīvnieka sejas portrets. Izmanto viena dzīvnieka sejas tuvplānu. Izvairīties no vairākiem dzīvniekiem vai pilna ķermeņa foto.", icon: "🎨" },
    { title: "Augšupielādē fotogrāfiju", text: "Klikšķini uz apģērba vai augšupielādes zonas, lai pievienotu bildi. Jo labāka fotogrāfijas kvalitāte, jo labāk izskatīsies izšuvums.\n\nPadoms: Izmanto skaidrus, labi apgaismotus attēlus.", icon: "📸" },
    { title: "Priekšskatījums un pielāgošana", text: "Apskati, kā izšuvums izskatīsies uz apģērba. Pārslēdzies starp Oriģinālu un Izšūto skatu.\n\nNeapmierina? Klikšķini Reģenerēt jaunam variantam (līdz 4 reizēm). Velc, lai pārvietotu un mainītu izmēru.", icon: "✨" },
    { title: "Priekšas un aizmugures izšuvums", text: "Tu vari pievienot izšuvumu gan hoodie priekšā, gan aizmugurē. Katra puse ir atsevišķs dizains ar savu stilu, izmēru un izvietojumu.\n\nTā ir pilnīgi brīvprātīga iespēja — lielākā daļa klientu sāk tikai ar priekšpusi. Ja vēlies abas puses, vienkārši izveido vispirms priekšpuses dizainu, tad pievieno otru dizainu aizmugurē.", icon: "↔️" },
    { title: "Pievieno grozam un pasūti", text: "Apmierināts ar dizainu? Klikšķini 'Pievienot grozam', lai veiktu pasūtījumu. Mēs ar rokām izgatavosim tavu unikālo izstrādājumu Rīgas studijā, izmantojot profesionālu aprīkojumu un augstākās kvalitātes diegus.", icon: "🛒" },
    { title: "Svarīgi zināt", text: "Priekšskatījums, ko redzi studijā, ir digitāls tuvinājums tavam izšuvumam. Galīgais ar rokām izgatavotais rezultāts var nedaudz atšķirties krāsā, detaļās un tekstūrā.\n\nTā ir īsta izšuvuma burvība — katrs izstrādājums ir unikāls, rūpīgi izgatavots mūsu meistaru rokās Rīgā. Nav divu vienādu darbu, tieši tā, kā tam jābūt īstam roku darbam.\n\nJa tev ir kādi jautājumi, sazinies ar mums: info@tinythread.shop", icon: "💎" }
  ]
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
  currentHistoryIndex: Record<string, number>;
  regenerationCount: number;
  rawImageUrl: string | null;
  rotation: number;
}

export default function TinyThreadStudio() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<"en" | "lv">("en");
  const t = T[lang] || T.en;
  const [product, setProduct] = useState<Product>("hoodie");
  const [color, setColor] = useState<Color>("black");
  const [view, setView] = useState<View>("front");
  const [size, setSize] = useState<Size>("S");
  const [style, setStyle] = useState<Style>("photo-stitch");
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
  const [guideLang, setGuideLang] = useState<"en" | "lv">("en");
  const [guideStep, setGuideStep] = useState(0);
  const [showConfirmCart, setShowConfirmCart] = useState(false);
  
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

  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  const currentDesignsForView = designs.filter(d => d.view === view);
  const basePrice = PRICING[product]?.[style]?.[size] || 0;
  const hasBackDesign = designs.some(d => d.view === "back");
  const backSurcharge = hasBackDesign ? (BACK_SURCHARGE[designs.find(d => d.view === "back")?.style || style] || 0) : 0;
  const currentPrice = basePrice + backSurcharge;

  // Check if first visit and show welcome popup
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("tinythread_visited")) {
      setShowWelcome(true);
    }
  }, []);

  // Read URL parameters to pre-select product and color
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get("lang");
    if (urlLang === "lv" || urlLang === "en") setLang(urlLang);
    // Also detect from referrer or document language
    if (!urlLang && typeof document !== "undefined") {
      const htmlLang = document.documentElement.lang;
      if (htmlLang?.startsWith("lv")) setLang("lv");
    }
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
    setIsLoadingSaved(true);
    try {
      const res = await fetch(`/api/designs?customerId=${customerId}`);
      const data = await res.json();
      if (data.designs) {
        setSavedDesigns(data.designs);
        console.log("[DESIGNS] Loaded", data.designs.length, "saved designs");
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
    if (!customer) {
      toast({ title: lang === "lv" ? "L\u016bdzu, ielogojies" : "Please log in", description: lang === "lv" ? "Lai saglab\u0101tu dizainu, nepiecie\u0161ams konts" : "You need an account to save designs" });
      return;
    }
    setIsSavingDesign(true);
    try {
      // Upload the generated design to Vercel Blob (permanent URL)
      // Prefer processedImages (background removed) over rawImageUrl
      let permanentGeneratedUrl = "";
      const generatedSrc = design.processedImages?.[design.style] || design.rawImageUrl || "";
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
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: lang === "lv" ? "Dizains saglab\u0101ts!" : "Design saved!" });
        await loadSavedDesigns(customer.id);
      } else {
        toast({ title: lang === "lv" ? "K\u013c\u016bda" : "Error", description: data.error || "Failed to save" });
      }
    } catch (e) {
      console.error("[DESIGNS] Save error:", e);
      toast({ title: "Error", description: "Failed to save design" });
    }
    setIsSavingDesign(false);
  };

  // Apply a saved design to the current garment
  const applySavedDesign = (saved: any) => {
    try {
      const savedStyle = saved.style || style;
      const savedView = saved.view || view;
      const fullUrl = saved.generatedImageUrl || saved.thumbnailUrl || saved.originalImageUrl || "";
      const newDesign: Design = {
        id: `saved_${Date.now()}`,
        style: savedStyle,
        size: saved.size || size,
        view: savedView,
        position: saved.position || { x: 50, y: 40 },
        currentSizePx: saved.sizePx || 150,
        generatedImages: fullUrl ? { [savedStyle]: fullUrl } : {},
        processedImages: fullUrl ? { [savedStyle]: fullUrl } : {},
        removeBackground: false,
        originalImage: saved.originalImageUrl || fullUrl,
        generationHistory: {},
        currentHistoryIndex: {},
        regenerationCount: 0,
        rawImageUrl: null,
        rotation: 0,
      };

      setDesigns(prev => {
        const existing = prev.filter(d => d.view !== savedView);
        return [...existing, newDesign];
      });
      setSelectedDesignId(newDesign.id);
      if (savedView === "front" || savedView === "back") setView(savedView);
      if (["outline", "standard", "photo-stitch", "pet-head"].includes(savedStyle)) setStyle(savedStyle as Style);
      if (saved.size && ["S", "M", "L"].includes(saved.size)) setSize(saved.size as Size);
      setShowStitched(true); // Show the generated design, not the original photo
      setShowSavedDesigns(false);
      toast({ title: lang === "lv" ? "Dizains pielietots!" : "Design applied!" });
    } catch (e) {
      console.error("[DESIGNS] Apply error:", e);
    }
  };

  const getGarmentImage = () => {
    if (product === "cap") {
      return GARMENT_IMAGES.cap[color]?.front || GARMENT_IMAGES.cap.black.front;
    }
    return GARMENT_IMAGES[product][color][view];
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
        if (!ctx) {
          resolve(imageUrl);
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const threshold = 40;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          if (styleType === "outline") {
            if (garmentColor === "black") {
              if (r < threshold && g < threshold && b < threshold) {
                data[i + 3] = 0;
              }
            } else {
              if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
                data[i + 3] = 0;
              }
            }
          } else if (styleType === "standard") {
            if (r > 255 - threshold && g > 255 - threshold && b > 255 - threshold) {
              data[i + 3] = 0;
            }
          } else if (styleType === "photo-stitch" || styleType === "pet-head") {
            if (r < threshold && g < threshold && b < threshold) {
              data[i + 3] = 0;
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

  const generateEmbroidery = useCallback(async (designId: string, imageBase64: string, styleType: Style, isRegenerate = false) => {
    if (generationLockRef.current) return;
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
        }),
      });

      const data = await response.json();
      
      if (data.imageUrl) {
        // Save the raw Replicate URL before background removal (for vectorization webhook)
        const rawReplicateUrl = data.imageUrl;
        // Skip background removal for Standard Logo - bg already matches garment color
        const skipBgRemoval = styleType === "standard";
        const processed = skipBgRemoval ? data.imageUrl : await removeImageBackground(data.imageUrl, styleType, color);
        
        setDesigns(prev => prev.map(d => {
          if (d.id === designId) {
            const currentHistory = d.generationHistory[styleType] || [];
            const newHistory = [...currentHistory, data.imageUrl];
            const newIndex = newHistory.length - 1;
            
            return {
              ...d,
              generatedImages: { ...d.generatedImages, [styleType]: data.imageUrl },
              processedImages: { ...d.processedImages, [styleType]: processed },
              generationHistory: { ...d.generationHistory, [styleType]: newHistory },
              currentHistoryIndex: { ...d.currentHistoryIndex, [styleType]: newIndex },
              rawImageUrl: rawReplicateUrl,
            };
          }
          return d;
        }));

        setShowStitched(true);
      }
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }, [color, removeImageBackground]);

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
    if (designs.length >= 2) {
      alert("Maximum 2 designs allowed");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const rawBase64 = reader.result as string;
      const base64 = await compressImage(rawBase64, 1024);
      console.log("[UPLOAD] Base64 length:", base64.length, "(compressed from", rawBase64.length, ")");
      
      if (base64.length < 1000) {
        alert("Error: Image data too small");
        return;
      }

      const newDesign: Design = {
        id: `design-${Date.now()}`,
        originalImage: base64,
        style: style,
        view: view,
        size: size,
        currentSizePx: SIZE_CONSTRAINTS[size].min + (SIZE_CONSTRAINTS[size].max - SIZE_CONSTRAINTS[size].min) / 2,
        position: { x: 50, y: 40 },
        generatedImages: {},
        processedImages: {},
        removeBackground: removeBackground,
        generationHistory: {},
        currentHistoryIndex: {},
        regenerationCount: 0,
        rawImageUrl: null,
        rotation: 0,
      };

      setDesigns(prev => [...prev, newDesign]);
      setSelectedDesignId(newDesign.id);
      
      generateEmbroidery(newDesign.id, base64, style);
    };
    reader.readAsDataURL(file);
  }, [designs.length, style, view, size, removeBackground, generateEmbroidery]);

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
          const delta = pos.x - resizeState.startX;
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
  }, [dragState, resizeState, selectedDesignId, designs]);

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
    
    generateEmbroidery(selectedDesign.id, selectedDesign.originalImage, selectedDesign.style, true);
  }, [cooldown, isGenerating, selectedDesign, generateEmbroidery]);

  const navigateHistory = useCallback(async (direction: "prev" | "next") => {
    if (!selectedDesign) return;
    
    const styleType = selectedDesign.style;
    const history = selectedDesign.generationHistory[styleType] || [];
    const currentIndex = selectedDesign.currentHistoryIndex[styleType] ?? 0;
    
    let newIndex: number;
    if (direction === "prev") {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(history.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== currentIndex && history[newIndex]) {
      const newImageUrl = history[newIndex];
      const processed = await removeImageBackground(newImageUrl, styleType, color);
      
      setDesigns(prev => prev.map(d => {
        if (d.id === selectedDesign.id) {
          return {
            ...d,
            generatedImages: { ...d.generatedImages, [styleType]: newImageUrl },
            processedImages: { ...d.processedImages, [styleType]: processed },
            currentHistoryIndex: { ...d.currentHistoryIndex, [styleType]: newIndex },
          };
        }
        return d;
      }));
    }
  }, [selectedDesign, removeImageBackground, color]);

  // Show confirmation popup before adding to cart
  const handleAddToCartClick = useCallback(() => {
    if (designs.length === 0) {
      toast({ title: "No design", description: "Please upload and generate a design first." });
      return;
    }
    setShowConfirmCart(true);
  }, [designs.length, toast]);

  // Handle Add to Cart - uses Shopify's cart/add URL to add to the REAL browser cart
  const handleAddToCart = useCallback(async () => {
    if (designs.length === 0) {
      toast({ title: "No design", description: "Please upload and generate a design first." });
      return;
    }

    const hasStitched = designs.some(d => d.processedImages[d.style]);
    if (!hasStitched) {
      toast({ title: "Not ready", description: "Please wait for the embroidery preview to generate." });
      return;
    }

    setIsAddingToCart(true);
    try {
      // Get the correct variant ID based on product + color + size + style + placement
      const hasFrontAndBack = designs.some(d => d.view === "front") && designs.some(d => d.view === "back");
      const variantKey = hasFrontAndBack
        ? `${product}-${color}-${size}-${style}-fb`
        : `${product}-${color}-${size}-${style}`;
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
      params.set("properties[Embroidery Style]", designSpecs.map(d => d.style).join(", "));
      params.set("properties[Embroidery Size]", designSpecs.map(d => `${d.size} (${d.sizeMm}mm)`).join(", "));
      params.set("properties[Placement]", designSpecs.map(d => d.view).join(", "));
      params.set("properties[Design Count]", String(designs.length));
      
      // Add design image URLs for each side
      const frontDesign = designs.find(d => d.view === "front");
      const backDesign = designs.find(d => d.view === "back");
      
      if (frontDesign?.rawImageUrl) {
        params.set("properties[_design_image]", frontDesign.rawImageUrl);
        params.set("properties[_garment]", `${product}-${color}-front`);
        // Store original photo as a shortened base64 reference (Shopify has URL length limits)
        // We'll send it via the placement email API instead
      }
      if (backDesign?.rawImageUrl) {
        params.set("properties[_design_image_back]", backDesign.rawImageUrl);
        params.set("properties[_garment_back]", `${product}-${color}-back`);
      }

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
      
      // Pass design position info for the designer
      const positionInfo = designs.map(d => ({
        view: d.view,
        x: d.position.x,
        y: d.position.y,
        size: d.currentSizePx || 150,
        rotation: d.rotation || 0
      }));
      params.set("properties[_positions]", JSON.stringify(positionInfo));
      
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

      // --- Auto-save designs on purchase (fire and forget) ---
      if (customer) {
        for (const design of designs) {
          try {
            const genSrc = design.processedImages?.[design.style] || design.rawImageUrl || "";
            // Upload generated image to permanent storage
            const uploadRes = await fetch("/api/store-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                genSrc.startsWith("data:") || genSrc.startsWith("/")
                  ? { base64Data: genSrc, filename: `auto_gen_${customer.id}_${Date.now()}.png` }
                  : { imageUrl: genSrc, filename: `auto_gen_${customer.id}_${Date.now()}.png` }
              ),
            });
            const uploadData = await uploadRes.json();
            const permanentGenUrl = uploadData.url || "";

            // Upload original photo
            let permanentOrigUrl = "";
            if (design.originalImage) {
              const origRes = await fetch("/api/store-image", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ base64Data: design.originalImage, filename: `auto_orig_${customer.id}_${Date.now()}.jpg` }),
              });
              const origData = await origRes.json();
              permanentOrigUrl = origData.url || "";
            }

            // Create thumbnail for grid
            const thumb = await createThumbnail(permanentGenUrl || genSrc);

            // Save to designs API
            await fetch("/api/designs", {
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
            console.log("[AUTO-SAVE] Saved design:", design.style, design.view);
          } catch (e) {
            console.error("[AUTO-SAVE] Failed:", e);
          }
        }
      }
      // --- End auto-save ---

      // Redirect to Shopify cart/add — this adds to the REAL browser cart
      window.location.href = "https://tinythread.shop/cart/add?" + params.toString();

    } catch (error: unknown) {
      console.error("[ADD TO CART] Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Something went wrong. Please try again.";
      toast({ 
        title: "Error adding to cart", 
        description: errorMessage,
        variant: "destructive"
      });
      setIsAddingToCart(false);
    }
  }, [designs, product, color, size, style, view, toast]);

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row", theme === "dark" ? "dark" : "")}>
      {/* Garment Preview - First on mobile, Second on desktop */}
      <div className={cn(
        "w-full md:flex-1 h-[50vh] md:h-screen order-1 md:order-2 flex flex-col relative",
        theme === "dark" ? "bg-[#111]" : "bg-gray-50"
      )}>
        {/* Top Controls - Original/Stitched toggle */}
        <div className="flex justify-end p-2 md:p-4">
          {designs.length > 0 && (
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg", theme === "dark" ? "bg-neutral-800" : "bg-white shadow-sm")}>
              <span className={cn("text-xs", !showStitched ? "text-amber-400" : theme === "dark" ? "text-neutral-400" : "text-gray-500")}>Original</span>
              <Switch
                checked={showStitched}
                onCheckedChange={setShowStitched}
              />
              <span className={cn("text-xs", showStitched ? "text-amber-400" : theme === "dark" ? "text-neutral-400" : "text-gray-500")}>Stitched</span>
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
            <img
              src={getGarmentImage()}
              alt={`${product} ${color} ${view}`}
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
              data-testid="garment-mockup"
            />

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
              if (!imageToShow) return null;

              return (
                <div
                  key={design.id}
                  style={{
                    position: "absolute",
                    left: `${design.position.x}%`,
                    top: `${design.position.y}%`,
                    transform: `translate(-50%, -50%) rotate(${design.rotation || 0}deg)`,
                    width: design.currentSizePx,
                    height: design.currentSizePx,
                  }}
                  className={cn(
                    "cursor-move group",
                    selectedDesignId === design.id && "ring-2 ring-amber-400"
                  )}
                  onMouseDown={(e) => handleMouseDown(e, design.id)}
                  onTouchStart={(e) => handlePointerDown(e, design.id)}
                  // Prevent page scroll when dragging design on mobile
                  onTouchMove={(e) => e.preventDefault()}
                >
                  <img
                    src={imageToShow}
                    alt="Design"
                    className="w-full h-full object-contain pointer-events-none"
                    draggable={false}
                    crossOrigin="anonymous"
                  />
                  
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
                        className="absolute -top-2 -left-2 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center text-black hover:bg-amber-300"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>

                      {/* Resize Handle */}
                      <div
                        onMouseDown={(e) => handleResizeMouseDown(e, design.id)}
                        onTouchStart={(e) => handleResizePointerDown(e, design.id)}
                        className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-sm cursor-se-resize flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 20l16-16M12 20h8v-8" />
                        </svg>
                      </div>
                      
                      {/* Size Indicator */}
                      <div className={cn(
                        "absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs px-2 py-0.5 rounded whitespace-nowrap",
                        theme === "dark" ? "bg-neutral-800 text-neutral-300" : "bg-white text-gray-700 shadow-sm"
                      )}>
                        ~{getSizeInMm(design.currentSizePx, design.size)}mm
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
                                ? "Max reached" 
                                : cooldown > 0 
                                  ? `${cooldown}s` 
                                  : `(${4 - design.regenerationCount} left)`}
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
                                    navigateHistory("prev");
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
                                    navigateHistory("next");
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

          {/* Upload Prompt Overlay */}
            {designs.length === 0 && (
              <div 
                className="absolute inset-0 flex items-center justify-center z-10 group cursor-pointer transition-all"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              >
                {/* Dark overlay that appears on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 rounded-lg" />
                
                {/* Upload prompt - subtle by default, prominent on hover */}
                <div className="relative flex flex-col items-center gap-3 opacity-60 group-hover:opacity-100 transition-all duration-300 group-hover:scale-105">
                  <div className="w-16 h-16 rounded-full bg-amber-400/20 group-hover:bg-amber-400/30 flex items-center justify-center transition-all duration-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm group-hover:text-amber-400 transition-colors">{t.clickToUpload}</p>
                    <p className="text-white/40 text-xs mt-1">JPG, PNG — max 10MB</p>
                  </div>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="flex flex-col items-center gap-3">
                  <Spinner className="w-8 h-8 text-amber-400" />
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
              {STYLES.find(s => s.id === selectedDesign.style)?.name} · {selectedDesign.size}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Controls - Second on mobile, First on desktop */}
      <div className={cn(
        "w-full md:w-80 lg:w-[360px] xl:w-[400px] md:min-w-[320px] flex-shrink-0 order-2 md:order-1 overflow-y-auto border-t md:border-t-0 md:border-r pb-32 md:pb-0 md:h-screen md:sticky md:top-0",
        theme === "dark" ? "bg-[#0d0d0d] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <a href="https://tinythread.shop" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <span className={cn("font-semibold", theme === "dark" ? "text-white" : "text-gray-900")}>TinyThread</span>
              <span className="text-amber-400 text-xs font-medium">STUDIO</span>
            </a>
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

          {/* Customer Login Status & My Designs */}
          {customer ? (
            <div className="space-y-2">
              <div className={cn(
                "flex items-center justify-between px-3 py-2 rounded-lg text-sm",
                theme === "dark" ? "bg-amber-900/20 text-amber-400" : "bg-amber-50 text-amber-700"
              )}>
                <span>{customer.firstName}</span>
                <button
                  onClick={() => setShowSavedDesigns(!showSavedDesigns)}
                  className={cn(
                    "text-xs px-2 py-1 rounded transition-colors",
                    theme === "dark" ? "bg-neutral-800 hover:bg-neutral-700" : "bg-white hover:bg-gray-100"
                  )}
                >
                  {lang === "lv" ? "Mani dizaini" : "My Designs"} ({savedDesigns.length})
                </button>
              </div>

              {showSavedDesigns && (
                <div className={cn(
                  "rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto",
                  theme === "dark" ? "bg-neutral-900 border border-neutral-800" : "bg-gray-50 border border-gray-200"
                )}>
                  <p className={cn("text-xs font-semibold", theme === "dark" ? "text-white/60" : "text-gray-500")}>
                    {lang === "lv" ? "SAGLAB\u0100TIE DIZAINI" : "SAVED DESIGNS"}
                  </p>
                  {isLoadingSaved ? (
                    <p className="text-xs text-center py-4 opacity-50">{lang === "lv" ? "Iel\u0101d\u0113..." : "Loading..."}</p>
                  ) : savedDesigns.length === 0 ? (
                    <p className="text-xs text-center py-4 opacity-50">{lang === "lv" ? "Nav saglab\u0101tu dizainu" : "No saved designs yet"}</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {savedDesigns.map((saved) => {
                        const thumbSrc = saved.thumbnailUrl || saved.generatedImageUrl || saved.originalImageUrl || "";
                        return (
                          <div
                            key={saved.id}
                            className={cn(
                              "rounded-lg overflow-hidden border-2 transition-all",
                              theme === "dark" ? "border-neutral-700 hover:border-amber-400" : "border-gray-200 hover:border-amber-500"
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
                ? "bg-amber-400/10 text-amber-400/70 hover:bg-amber-400/20 hover:text-amber-400"
                : "bg-amber-50 text-amber-600 hover:bg-amber-100"
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
              Product
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
                      ? "border-amber-400 bg-amber-400/10 text-amber-400"
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
              Color
            </label>
            <div className="flex gap-3">
              {(["black", "white"] as Color[]).map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    color === c ? "ring-2 ring-amber-400 ring-offset-2" : "",
                    theme === "dark" ? "ring-offset-[#0d0d0d]" : "ring-offset-white",
                    c === "black" ? "bg-black border-neutral-600" : "bg-white border-gray-300"
                  )}
                  title={c.charAt(0).toUpperCase() + c.slice(1)}
                />
              ))}
            </div>
          </div>

          {/* View Selection */}
          {product === "hoodie" && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                View
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["front", "back"] as View[]).map(v => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "py-2 px-4 rounded-lg border text-sm font-medium transition-all",
                      view === v
                        ? "border-amber-400 bg-amber-400/10 text-amber-400"
                        : theme === "dark"
                          ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div className="space-y-2">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Size
            </label>
            <div className={cn("grid gap-2", product === "cap" ? "grid-cols-2" : "grid-cols-3")}>
              {(product === "cap" ? ["S", "M"] as Size[] : ["S", "M", "L"] as Size[]).map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSize(s);
                    if (selectedDesign) {
                      setDesigns(prev => prev.map(d => {
                        if (d.id === selectedDesign.id) {
                          const constraints = SIZE_CONSTRAINTS[s];
                          return {
                            ...d,
                            size: s,
                            currentSizePx: constraints.min + (constraints.max - constraints.min) / 2,
                          };
                        }
                        return d;
                      }));
                    }
                  }}
                  className={cn(
                    "py-2 px-2 rounded-lg border text-center transition-all",
                    size === s
                      ? "border-amber-400 bg-amber-400/10"
                      : theme === "dark"
                        ? "border-neutral-700 hover:border-neutral-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("text-lg font-semibold", size === s ? "text-amber-400" : theme === "dark" ? "text-white" : "text-gray-900")}>{s}</div>
                  <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>{SIZE_CONSTRAINTS[s].label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Style
            </label>
            <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleStyleChange(s.id)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition-all",
                    style === s.id
                      ? "border-amber-400 bg-amber-400/10"
                      : theme === "dark"
                        ? "border-neutral-700 hover:border-neutral-600"
                        : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className={cn("font-medium text-sm", style === s.id ? "text-amber-400" : theme === "dark" ? "text-white" : "text-gray-900")}>
                    {s.name}
                  </div>
                  <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                    {s.description}
                  </div>
                  <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                    Best for: {s.bestFor}
                  </div>
                </button>
              ))}
            </div>
            {style === "pet-head" && (
              <div className="p-2 rounded-lg bg-amber-400/10 border border-amber-400/20">
                <p className="text-xs text-amber-400">This style works best with a single pet face in the photo</p>
              </div>
            )}
            <div className="text-center text-sm mt-2">
              <span className={theme === "dark" ? "text-white/40" : "text-gray-500"}>Price: </span>
              <span className="text-amber-400 font-bold text-xl">
                {currentPrice > 0 ? `€${currentPrice}` : "—"}
              </span>
              {backSurcharge > 0 && (
                <span className="text-amber-400/60 text-xs ml-1">(incl. back +€{backSurcharge})</span>
              )}
            </div>
          </div>

          {/* Remove Background Toggle */}
          <div className="flex items-center justify-between">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              Remove Background
            </label>
            <Switch
              checked={removeBackground}
              onCheckedChange={setRemoveBackground}
              disabled={designs.length > 0}
            />
          </div>

          {/* Upload Photo */}
          {designs.length === 0 && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                Upload Photo
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
                  Drop image or <span className="text-amber-400 hover:underline">browse</span>
                </p>
                <p className={cn("text-xs mt-1", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                  JPG, PNG — max 10MB
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
                Design Layers
              </label>
              <div className="space-y-2">
                {designs.map(design => (
                  <div
                    key={design.id}
                    onClick={() => setSelectedDesignId(design.id)}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
                      selectedDesignId === design.id
                        ? "border-amber-400 bg-amber-400/10"
                        : theme === "dark"
                          ? "border-neutral-700 hover:border-neutral-600"
                          : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    <img
                      src={design.originalImage}
                      alt="Design"
                      className="w-10 h-10 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={cn("text-sm font-medium truncate", theme === "dark" ? "text-white" : "text-gray-900")}>
                        {STYLES.find(s => s.id === design.style)?.name}
                      </div>
                      <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                        {design.view} · {design.size}
                      </div>
                    </div>
                    {customer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveDesign(design);
                        }}
                        disabled={isSavingDesign}
                        className={cn("p-1 rounded transition-colors", isSavingDesign ? "opacity-50" : "hover:bg-amber-500/20 text-amber-400")}
                        title={lang === "lv" ? "Saglab\u0101t dizainu" : "Save design"}
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
              {/* Show "Add to back/front" button only for hoodies, max 1 per side */}
              {product === "hoodie" && designs.length === 1 && (() => {
                const existingView = designs[0]?.view;
                const otherView = existingView === "front" ? "back" : "front";
                const hasOtherSide = designs.some(d => d.view === otherView);
                if (hasOtherSide) return null;
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
                        ? "border-amber-700/50 text-amber-400 hover:border-amber-600 hover:bg-amber-900/20"
                        : "border-amber-300 text-amber-600 hover:border-amber-400 hover:bg-amber-50"
                    )}
                  >
                    + Add embroidery to the {otherView} (+€{surcharge})
                  </button>
                );
              })()}
            </div>
          )}

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
                  ? "border-amber-700/50 text-amber-400 hover:bg-amber-900/20"
                  : "border-amber-300 text-amber-600 hover:bg-amber-50"
              )}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {isSavingDesign
                ? (lang === "lv" ? "Saglab\u0101..." : "Saving...")
                : (lang === "lv" ? "Saglab\u0101t dizainu" : "Save Design")
              }
            </button>
          )}

          {/* Add to Cart Button - Desktop (in sidebar flow) */}
          <div className="hidden md:block space-y-1">
            <Button
              data-testid="add-to-cart"
              onClick={handleAddToCartClick}
              disabled={designs.length === 0 || isAddingToCart}
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>Add to Cart — €{currentPrice}</>
              )}
            </Button>
            <p className={cn("text-xs text-center", theme === "dark" ? "text-white/30" : "text-gray-400")}>
              Your design files will be sent to our embroidery artists
            </p>
          </div>
        </div>
      </div>

      {/* Add to Cart Button - Mobile (sticky at bottom) */}
      <div className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 p-3 border-t z-50",
        theme === "dark" ? "bg-[#0d0d0d] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <Button
          data-testid="add-to-cart-mobile"
          onClick={handleAddToCartClick}
          disabled={designs.length === 0 || isAddingToCart}
          className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAddingToCart ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Adding to Cart...
            </>
          ) : (
            <>Add to Cart — €{currentPrice}</>
          )}
        </Button>
      </div>

      {/* Welcome Popup - First Visit */}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🧵</div>
            <h2 className="text-xl font-bold text-white mb-2">Welcome to TinyThread Studio</h2>
            <p className="text-white/50 text-sm mb-6">Create your custom embroidered garment in minutes</p>
            
            <p className="text-white/70 text-sm mb-6">Want to learn how the studio works? Choose your language:</p>
            
            <div className="flex gap-3 justify-center mb-4">
              <button
                onClick={() => { setGuideLang("en"); setShowWelcome(false); setShowGuide(true); localStorage.setItem("tinythread_visited", "1"); }}
                className="px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                English Guide
              </button>
              <button
                onClick={() => { setGuideLang("lv"); setShowWelcome(false); setShowGuide(true); localStorage.setItem("tinythread_visited", "1"); }}
                className="px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                Latviešu ceļvedis
              </button>
            </div>
            
            <button
              onClick={() => { setShowWelcome(false); localStorage.setItem("tinythread_visited", "1"); }}
              className="text-white/40 text-sm hover:text-white/60 transition-colors"
            >
              Skip — I&apos;ll figure it out
            </button>
          </div>
        </div>
      )}

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/80 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div className="flex gap-2">
                <button onClick={() => setGuideLang("en")} className={cn("text-xs px-3 py-1 rounded-full font-medium", guideLang === "en" ? "bg-amber-400 text-black" : "bg-white/10 text-white/50")}>EN</button>
                <button onClick={() => setGuideLang("lv")} className={cn("text-xs px-3 py-1 rounded-full font-medium", guideLang === "lv" ? "bg-amber-400 text-black" : "bg-white/10 text-white/50")}>LV</button>
              </div>
              <button onClick={() => setShowGuide(false)} className="text-white/30 hover:text-white/60 text-sm">✕ Close</button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="text-center mb-4">
                <span className="text-4xl">{GUIDE_CONTENT[guideLang][guideStep].icon}</span>
              </div>
              <h3 className="text-lg font-bold text-white text-center mb-3">
                {GUIDE_CONTENT[guideLang][guideStep].title}
              </h3>
              <p className="text-white/60 text-sm whitespace-pre-line leading-relaxed">
                {GUIDE_CONTENT[guideLang][guideStep].text}
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-6 pb-5 pt-2 flex items-center justify-between">
              <div className="flex gap-1.5">
                {GUIDE_CONTENT[guideLang].map((_, i) => (
                  <div key={i} className={cn("w-2 h-2 rounded-full transition-colors", i === guideStep ? "bg-amber-400" : "bg-white/20")} />
                ))}
              </div>
              <div className="flex gap-2">
                {guideStep > 0 && (
                  <button onClick={() => setGuideStep(guideStep - 1)} className="px-4 py-2 text-sm text-white/50 hover:text-white/70">Back</button>
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
                  className="px-5 py-2 bg-amber-500 text-black font-bold rounded-lg text-sm hover:bg-amber-400"
                >
                  {guideStep < GUIDE_CONTENT[guideLang].length - 1 
                    ? (guideLang === "en" ? "Next" : "Tālāk") 
                    : (guideLang === "en" ? "Get Started!" : "Sāksim!")
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Popup Before Add to Cart */}
      {showConfirmCart && (
        <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
            <div className="text-4xl mb-4">🧵</div>
            <h2 className="text-xl font-bold text-white mb-2">
              {guideLang === "lv" ? "Vai esi pabeidzis?" : "Are you done?"}
            </h2>
            <p className="text-white/50 text-sm mb-6">
              {guideLang === "lv" 
                ? "Pārliecinies, ka tavs dizains izskatās tieši tā, kā vēlies. Pēc pasūtīšanas izmaiņas nav iespējamas."
                : "Make sure your design looks exactly how you want it. Changes are not possible after ordering."
              }
            </p>
            
            {/* Show option to add back design if only front exists */}
            {designs.length === 1 && (
              <p className="text-amber-400/70 text-xs mb-6">
                {guideLang === "lv"
                  ? "💡 Tu vēl vari pievienot izšuvumu aizmugurē pirms pasūtīšanas"
                  : "💡 You can still add embroidery to the back before ordering"
                }
              </p>
            )}
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowConfirmCart(false);
                  handleAddToCart();
                }}
                className="w-full px-6 py-3 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors"
              >
                {guideLang === "lv" ? "Jā, pievienot grozam" : "Yes, add to cart"}
              </button>
              
              <button
                onClick={() => setShowConfirmCart(false)}
                className="w-full px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
              >
                {guideLang === "lv" ? "Nē, vēlos vēl pielāgot" : "No, I want to adjust more"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
