"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { GARMENT_IMAGES, SIZE_CONSTRAINTS, type Product, type Color, type View, type Size, type Style } from "@/lib/garment-images";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

import { useToast } from "@/hooks/use-toast";

import { T, type Lang } from "@/lib/translations";
import {
  TEXT_FONTS, TEXT_SIZE_PX, TEXT_SIZE_CONSTRAINTS,
  TEXT_MAX_CHARS, TEXT_MAX_CHARS_MULTIROW,
  SLEEVE_TEXT_MAX_CHARS, SLEEVE_DESIGN_SIZE_PX,
  SLEEVE_SIZE_CONSTRAINTS, MAX_DESIGNS_PER_SIDE, dupDiscountedTotal,
} from "@/lib/constants";
import type { Design, AddingMode } from "@/lib/types";
import { calculatePrice } from "@/hooks/use-price-calculator";
import { cropTransparentPadding, compressImage, createThumbnail, removeImageBackground } from "@/lib/image-utils";
import { useCartActions } from "@/hooks/use-cart-actions";
import { TextModal } from "@/components/tinythread/TextModal";
import { DesignLayersPanel } from "@/components/tinythread/DesignLayersPanel";
import { SizeStyleSelector } from "@/components/tinythread/SizeStyleSelector";
import { GuideModal } from "@/components/tinythread/GuideModal";
import { WelcomePopup } from "@/components/tinythread/WelcomePopup";
import { MaxDesignsPopup } from "@/components/tinythread/MaxDesignsPopup";
import { ConfirmCartModal } from "@/components/tinythread/ConfirmCartModal";
import { LicensePlateModal } from "@/components/tinythread/LicensePlateModal";
import { OrderMultipleModal } from "@/components/tinythread/OrderMultipleModal";
import { GarmentCanvas } from "@/components/tinythread/GarmentCanvas";
import { CartButtons } from "@/components/tinythread/CartButtons";
import { SavedDesignsPanel } from "@/components/tinythread/SavedDesignsPanel";
import { LoginGate } from "@/components/tinythread/LoginGate";

declare global {
  interface Window {
    __tinyThreadOrder?: unknown;
  }
}

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

export default function TinyThreadStudio() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [lang, setLang] = useState<Lang>("lv");
  const t = T[lang];
  const [product, setProduct] = useState<Product>("hoodie");
  const [color, setColor] = useState<Color>("black");
  // Wearable garment size (S/M/L/XL) — moved into the app after removing the Shopify size variant picker.
  // Does NOT affect price (all garment sizes cost the same); passed to cart as a line-item property.
  const [garmentSize, setGarmentSize] = useState<"S" | "M" | "L" | "XL">("M");
  const [view, setView] = useState<View>("front");
  const [viewSizes, setViewSizes] = useState<Record<string, Size>>({
    front: "S", back: "M", "left-sleeve": "M", "right-sleeve": "M",
  });
  const size: Size = viewSizes[view] ?? "M";
  const [style, setStyle] = useState<Style>("outline");
  const [removeBackground, setRemoveBackground] = useState(true);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showStitched, setShowStitched] = useState(false);
  const [dragState, setDragState] = useState<{ isDragging: boolean; startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const [resizeState, setResizeState] = useState<{ isResizing: boolean; startX: number; startY: number; startSize: number } | null>(null);
  const [pinchState, setPinchState] = useState<{ startDist: number; startSize: number; designId: string } | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const guideLang = lang;
  const [guideStep, setGuideStep] = useState(0);
  const [showConfirmCart, setShowConfirmCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [textFontInput, setTextFontInput] = useState(TEXT_FONTS[0].id);
  const [textColorInput, setTextColorInput] = useState<string>(""); // "" = auto
  const [textMultiRowInput, setTextMultiRowInput] = useState(false);
  const [textSizeInput, setTextSizeInput] = useState<"S" | "M" | "L">("M");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [showMultipleModal, setShowMultipleModal] = useState(false);
  const [multipleQtys, setMultipleQtys] = useState<Record<string, number>>({ S: 0, M: 0, L: 0, XL: 0 });
  const [isAddingMultiple, setIsAddingMultiple] = useState(false);
  const [showMultipleTooltip, setShowMultipleTooltip] = useState(false);
  const [addingMode, setAddingMode] = useState<AddingMode>(null);
  const [showCarPlatePopup, setShowCarPlatePopup] = useState(false);
  const [showMaxDesignsPopup, setShowMaxDesignsPopup] = useState(false);
  const [carPlatePending, setCarPlatePending] = useState<{ designId: string; base64: string; sleevePlacement: boolean } | null>(null);
  const [carPlateStep, setCarPlateStep] = useState<"ask" | "input">("ask");
  const [carPlateInput, setCarPlateInput] = useState("");

  // Customer & saved designs state
  const [customer, setCustomer] = useState<{ id: string; firstName: string; lastName: string; email: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [savedDesigns, setSavedDesigns] = useState<any[]>([]);
  const [showSavedDesigns, setShowSavedDesigns] = useState(false);
  const [isSavingDesign, setIsSavingDesign] = useState(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const generationLockRef = useRef(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const sidebarTopRef = useRef<HTMLDivElement>(null);
  const prevColorRef = useRef(color);
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

  // When the garment color changes, existing generated images are stale (wrong color context).
  // Clear them and auto-regenerate the selected design so it always matches the current color.
  useEffect(() => {
    if (prevColorRef.current === color) return;
    prevColorRef.current = color;
    // Capture selected design before clearing (designs snapshot from closure is intentional here)
    const designToRegen = designs.find(d => d.id === selectedDesignId && !d.textContent && !!d.originalImage);
    setDesigns(prev => prev.map(d => d.textContent ? d : {
      ...d,
      generatedImages: {},
      processedImages: {},
      generationHistory: {},
      processedHistory: {},
      currentHistoryIndex: {},
      rawImageUrl: null,
      generatedForColor: undefined,
    }));
    setShowStitched(false);
    if (designToRegen) {
      generateEmbroidery(designToRegen.id, designToRegen.originalImage, designToRegen.style);
    }
  }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

  // Visual scale: reduce on-screen size so designs match real-life embroidery proportions
  // on the hoodie (max 250mm on a ~550mm chest = ~45% of body width). Stored sizePx and
  // mm calculations stay unchanged -- this only affects visual rendering.
  // 2026-06-08: bumped 0.55 -> 0.6325 (+15%) so generated designs render larger on canvas.
  // Affects generated image designs only (text uses its own font-size formula); applies to
  // all views. Size is still driven by S/M/L + px-per-mm — this is purely the render multiplier.
  const RENDER_SCALE = 0.6325;
  const sizeScale = (previewWidth / 400) * RENDER_SCALE;

  const selectedDesign = designs.find(d => d.id === selectedDesignId);
  const currentDesignsForView = designs.filter(d => d.view === view);
  // Is the selected design a 2nd/3rd photo on its side? (L size not available, size changes independent)
  const selectedIsAdditional = !!selectedDesign && !selectedDesign.textContent &&
    designs.filter(d => d.view === selectedDesign.view && !d.textContent).indexOf(selectedDesign) > 0;
  // Base price uses the primary photo design's style (front first, else back, else currently selected)
  const photoFrontDesign = designs.find(d => d.view === "front" && !d.textContent);
  const photoBackDesign = designs.find(d => d.view === "back" && !d.textContent);
  // Use the actual stored size of the primary design, not the global UI size state.
  // Global `size` only serves as a default for the next design to be added.
  const primaryDesignSize = (photoFrontDesign?.size || photoBackDesign?.size || size) as Size;
  const { currentPrice } = calculatePrice(designs, product, style, size);

  // Multiple-order modal: garment size is fit-only and flat-priced, so every unit costs
  // the full per-unit price of the finished canvas design. Total = full price × qty.
  // (Phase 1: full price only — no multi-unit discount until a real Shopify mechanism exists.)
  const multipleOrderTotalQty = Object.values(multipleQtys).reduce((a, b) => a + b, 0);
  // Discounted total: one full unit + (qty-1) at -35% (applied at checkout by Regios), so the
  // popup total matches what the customer is actually charged.
  const multipleOrderTotal = dupDiscountedTotal(currentPrice, multipleOrderTotalQty);

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

  // Read URL parameters to pre-select product and color; handle all auth paths
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlProduct = params.get("product");
    const urlColor = params.get("color");

    if (urlProduct === "hoodie" || urlProduct === "cap") setProduct(urlProduct);
    if (urlColor === "black" || urlColor === "white") setColor(urlColor);

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
            localStorage.setItem("tinythread_session", JSON.stringify(data));
            loadSavedDesigns(data.id);
          }
        })
        .catch(e => console.error("[AUTH] Auto-login error:", e))
        .finally(() => setAuthChecked(true));
      return;
    }

    // No URL params — restore session from localStorage
    const stored = localStorage.getItem("tinythread_session");
    if (stored) {
      try {
        const session = JSON.parse(stored);
        if (session.accessToken) {
          // Validate the stored token with Shopify
          fetch("/api/customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accessToken: session.accessToken }),
          })
            .then(r => r.json())
            .then(data => {
              if (data.id) {
                setCustomer(data);
                localStorage.setItem("tinythread_session", JSON.stringify(data));
                loadSavedDesigns(data.id);
              } else {
                localStorage.removeItem("tinythread_session");
              }
            })
            .catch(() => localStorage.removeItem("tinythread_session"))
            .finally(() => setAuthChecked(true));
        } else {
          // Email+sig session (no token) — restore directly
          setCustomer(session);
          loadSavedDesigns(session.id);
          setAuthChecked(true);
        }
      } catch {
        localStorage.removeItem("tinythread_session");
        setAuthChecked(true);
      }
    } else {
      setAuthChecked(true);
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
      } else {
      }
    } catch (e) {
    }
    setIsLoadingSaved(false);
  };

  // Save current design - uploads full images to permanent storage
  const handleSaveDesign = async (design: Design) => {
    if (!customer) {
      toast({ title: t.pleaseLogin, description: t.pleaseLoginDesc });
      return;
    }

    // Toggle: if already saved, remove it
    if (design.savedDesignId) {
      setIsSavingDesign(true);
      try {
        const res = await fetch("/api/designs", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ customerId: customer.id, designId: design.savedDesignId }),
        });
        const data = await res.json();
        if (data.success) {
          setDesigns(prev => prev.map(d => d.id === design.id ? { ...d, savedDesignId: undefined } : d));
          setSavedDesigns(prev => prev.filter(s => s.id !== design.savedDesignId));
          toast({ title: t.designRemoved });
        }
      } catch {
        toast({ title: t.error, description: t.failedSave });
      } finally {
        setIsSavingDesign(false);
      }
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
      // FAIL SAFE: don't persist a gallery record with a missing image if the Blob upload failed.
      if (generatedSrc && !permanentGeneratedUrl) throw new Error("image_upload_failed");

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
            licensePlate: design.licensePlate,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: t.designSaved });
        const savedId = data.design?.id;
        if (data.design) {
          setSavedDesigns(prev => [...prev, data.design]);
        } else {
          await loadSavedDesigns(customer.id);
        }
        if (savedId) {
          setDesigns(prev => prev.map(d => d.id === design.id ? { ...d, savedDesignId: savedId } : d));
        }
      } else {
        toast({ title: t.error, description: data.error || t.failedSave });
      }
    } catch (e) {
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
      if (!isSleeveView(targetView) && saved.size && ["S", "M", "L"].includes(saved.size)) {
        setViewSizes(prev => ({ ...prev, [targetView]: saved.size as Size }));
      }
      setShowStitched(true);
      setShowSavedDesigns(false);
      toast({ title: t.designApplied });
    } catch (e) {
    }
  };

  const getGarmentImage = () => {
    if (product === "cap") {
      return GARMENT_IMAGES.cap[color]?.front || GARMENT_IMAGES.cap.black.front;
    }
    if (isSleeveView(view)) return null;
    return GARMENT_IMAGES.hoodie[color][view as "front" | "back"];
  };

  const generateEmbroidery = useCallback(async (designId: string, imageBase64: string, styleType: Style, isRegenerate = false, licensePlate?: string): Promise<boolean> => {
    if (generationLockRef.current) {
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
        toast({ title: t.error, description: data.error || t.failedGenerateStitched });
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

        processed = await cropTransparentPadding(processed);

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
              generatedForColor: color,
              ...(licensePlate !== undefined && { licensePlate }),
            };
          }
          return d;
        }));

        setShowStitched(true);
        return true;
      }
      return false;
    } catch (error) {
      toast({ title: t.error, description: t.failedGenerateStitched });
      return false;
    } finally {
      setIsGenerating(false);
      generationLockRef.current = false;
    }
  }, [color, toast, t]);

  const handleFileUpload = useCallback((file: File) => {
    if (file.type !== "image/jpeg" && file.type !== "image/png") {
      toast({ title: t.error, description: t.uploadFormatError });
      return;
    }
    setAddingMode(null);
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
      
      if (base64.length < 1000) {
        alert("Error: Image data too small");
        return;
      }

      const sleevePlacement = isSleeveView(view);
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

      // On mobile, scroll canvas into view after upload so garment preview is visible
      if (window.innerWidth < 768) {
        setTimeout(() => {
          previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }

      if (style === "car") {
        setCarPlatePending({ designId: newDesign.id, base64, sleevePlacement });
        setCarPlateStep("ask");
        setCarPlateInput("");
        setShowCarPlatePopup(true);
      } else {
        const success = await generateEmbroidery(newDesign.id, base64, style);

        if (success && sleevePlacement) {
          toast({ description: t.sleeveTextReminder, duration: 7000 });
        }
      }
    };
    reader.readAsDataURL(file);
  }, [designs.length, style, view, viewSizes, removeBackground, generateEmbroidery, toast, t]);

  const handleAddText = useCallback(() => {
    const trimmed = textInput.trim();
    const isSleeve = isSleeveView(view);
    const maxChars = isSleeve ? SLEEVE_TEXT_MAX_CHARS : (textMultiRowInput ? TEXT_MAX_CHARS_MULTIROW : TEXT_MAX_CHARS);
    if (!trimmed || trimmed.length > maxChars) return;

    const resetModal = () => {
      setEditingTextId(null);
      setTextInput("");
      setTextColorInput("");
      setTextMultiRowInput(false);
      setTextSizeInput("M");
      setShowTextModal(false);
    };

    // If we are editing an existing text design, just update it
    if (editingTextId) {
      setDesigns(prev => prev.map(d =>
        d.id === editingTextId
          ? {
              ...d,
              textContent: trimmed,
              textFont: textFontInput,
              textColor: textColorInput || undefined,
              textMultiRow: isSleeve ? false : textMultiRowInput,
              size: textSizeInput as Size,
              currentSizePx: TEXT_SIZE_PX[textSizeInput],
            }
          : d
      ));
      resetModal();
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
      size: textSizeInput as Size,
      currentSizePx: TEXT_SIZE_PX[textSizeInput],
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
      textMultiRow: isSleeve ? false : textMultiRowInput,
    };

    setDesigns(prev => [...prev, newDesign]);
    setSelectedDesignId(newDesign.id);
    resetModal();
  }, [textInput, textFontInput, textColorInput, textMultiRowInput, textSizeInput, editingTextId, designs, view, style]);

  const handleEditText = useCallback((design: Design) => {
    if (!design.textContent) return;
    setEditingTextId(design.id);
    setTextInput(design.textContent);
    setTextFontInput(design.textFont || TEXT_FONTS[0].id);
    setTextColorInput(design.textColor || "");
    setTextMultiRowInput(design.textMultiRow || false);
    const px = design.currentSizePx || TEXT_SIZE_PX.M;
    const inferredSize: "S" | "M" | "L" = px < TEXT_SIZE_CONSTRAINTS.M.min ? "S" : px < TEXT_SIZE_CONSTRAINTS.L.min ? "M" : "L";
    setTextSizeInput(inferredSize);
    // Self-heal old designs where size was hardcoded "M" or SLEEVE_DESIGN_SIZE_PX
    if (design.size !== inferredSize) {
      setDesigns(prev => prev.map(d => d.id === design.id ? { ...d, size: inferredSize } : d));
    }
    setShowTextModal(true);
  }, []);

  const handleStyleChange = useCallback((newStyle: Style) => {
    setStyle(newStyle);
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }

    // Only update + regenerate the selected design if it lives on the current view.
    // If the current view is empty, changing style should never touch designs on other views.
    if (selectedDesign && selectedDesign.view === view && !selectedDesign.textContent) {
      setDesigns(prev => prev.map(d =>
        d.id === selectedDesign.id ? { ...d, style: newStyle } : d
      ));

      if (selectedDesign.originalImage) {
        if (newStyle === "car") {
          // Car style always requires the license-plate question before generating.
          // Show the popup on every switch TO car (regardless of an existing car render),
          // mirroring the upload flow — the popup's handlers drive generateEmbroidery.
          setShowStitched(false);
          setCarPlatePending({ designId: selectedDesign.id, base64: selectedDesign.originalImage, sleevePlacement: isSleeveView(view) });
          setCarPlateStep("ask");
          setCarPlateInput("");
          setShowCarPlatePopup(true);
        } else if (!selectedDesign.generatedImages[newStyle]) {
          // No stitched image yet for this style — show original upload as safe fallback
          // while generation runs, so a stale image from another style never appears.
          setShowStitched(false);
          generateEmbroidery(selectedDesign.id, selectedDesign.originalImage, newStyle);
        }
      }
    }
  }, [selectedDesign, view, generateEmbroidery]);

  const handleDeleteDesign = useCallback((designId: string) => {
    setDesigns(prev => prev.filter(d => d.id !== designId));
    if (selectedDesignId === designId) setSelectedDesignId(null);
    setAddingMode(null);
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
    if (design && !design.textContent) setStyle(design.style);
    // Two-finger touch: start pinch-to-resize
    if ('touches' in e && e.touches.length >= 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setPinchState({ startDist: dist, startSize: design?.currentSizePx ?? 130, designId });
      return;
    }
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
      // Two-finger pinch-to-resize
      if (pinchState && 'touches' in e && e.touches.length >= 2) {
        e.preventDefault();
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const ratio = dist / pinchState.startDist;
        setDesigns(prev => prev.map(d => {
          if (d.id !== pinchState.designId) return d;
          const constraints = d.textContent
            ? TEXT_SIZE_CONSTRAINTS[d.size as "S" | "M" | "L"]
            : isSleeveView(d.view)
              ? SLEEVE_SIZE_CONSTRAINTS
              : SIZE_CONSTRAINTS[d.size];
          const newSize = Math.max(constraints.min, Math.min(constraints.max, Math.round(pinchState.startSize * ratio)));
          return { ...d, currentSizePx: newSize };
        }));
        return;
      }

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
          // Divide delta by the on-screen scale so the resize handle tracks the cursor 1:1.
          // Images render at currentSizePx * sizeScale * imgBoost, where M/L (non-sleeve)
          // get an extra +15% boost (kept in sync with GarmentCanvas).
          const imgBoost = (!design.textContent && !isSleeveView(design.view) && (design.size === "M" || design.size === "L")) ? 1.15 : 1;
          const delta = (pos.x - resizeState.startX) / ((sizeScale * imgBoost) || 1);
          const constraints = design.textContent
            ? TEXT_SIZE_CONSTRAINTS[design.size as "S" | "M" | "L"]
            : isSleeveView(design.view)
              ? SLEEVE_SIZE_CONSTRAINTS
              : SIZE_CONSTRAINTS[design.size];
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
      setPinchState(null);
    };

    if (dragState?.isDragging || resizeState?.isResizing || pinchState) {
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
  }, [dragState, resizeState, pinchState, selectedDesignId, designs, sizeScale]);

  const getSizeInMm = (sizePx: number, sizeCategory: Size, isText = false) => {
    if (isText) {
      // currentSizePx maps to canvas via (px/780)*800; garment=700mm, canvas=800px -- mm = px*(700/780)
      return Math.round(sizePx * (700 / 780));
    }
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
    // Pre-fill the confirm popup's per-size grid with 1 of the current garment size (hoodie) or
    // the first cap fit, so a single-garment order is one click; the customer can adjust sizes.
    setMultipleQtys(product === "cap" ? { S: 1, M: 0 } : { S: 0, M: 0, L: 0, XL: 0, [garmentSize]: 1 });
    setShowConfirmCart(true);
  }, [designs.length, toast, t, product, garmentSize]);

  const { handleAddMultipleToCart } = useCartActions({
    designs, product, color, viewSizes, style, view,
    customer, lang, t, multipleQtys, size, currentPrice, cartQuantity, garmentSize,
    setIsAddingToCart, setIsAddingMultiple, setSavedDesigns, toast,
  });

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

  // Auth loading state — blank screen while checking localStorage/token
  if (!authChecked) {
    return <div className="min-h-screen bg-[#0f0e0d]" />;
  }

  // Login gate — shown when no authenticated customer
  if (!customer) {
    return (
      <LoginGate
        lang={lang}
        onLangChange={handleLangChange}
      />
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col md:flex-row", theme === "dark" ? "dark" : "")}>
      {/* Garment Preview */}
      <GarmentCanvas
        view={view}
        product={product}
        color={color}
        theme={theme}
        designs={designs}
        currentDesignsForView={currentDesignsForView}
        selectedDesignId={selectedDesignId}
        selectedDesign={selectedDesign}
        showStitched={showStitched}
        setShowStitched={setShowStitched}
        zoom={zoom}
        setZoom={setZoom}
        previewRef={previewRef}
        sizeScale={sizeScale}
        previewWidth={previewWidth}
        isGenerating={isGenerating}
        cooldown={cooldown}
        t={t}
        setSelectedDesignId={setSelectedDesignId}
        setDesigns={setDesigns}
        setStyle={setStyle}
        fileInputRef={fileInputRef}
        getGarmentImage={getGarmentImage}
        getSizeInMm={getSizeInMm}
        handlePointerDown={handlePointerDown}
        handleResizePointerDown={handleResizePointerDown}
        handleDeleteDesign={handleDeleteDesign}
        handleEditText={handleEditText}
        handleRegenerate={handleRegenerate}
        navigateHistory={navigateHistory}
      />

      {/* Sidebar Controls - Second on mobile, First on desktop */}
      <div className={cn(
        "w-full md:w-80 lg:w-[360px] xl:w-[400px] md:min-w-[320px] flex-shrink-0 order-2 md:order-1 border-t md:border-t-0 md:border-r pb-32 md:pb-0 md:h-screen md:sticky md:top-0 md:flex md:flex-col",
        theme === "dark" ? "bg-[#1e1b18] border-neutral-800" : "bg-white border-gray-200"
      )}>
        <div ref={sidebarTopRef} className="p-5 space-y-5 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between">
            <a href="https://tinythread.lv" className="flex items-center gap-2 no-underline hover:opacity-80 transition-opacity">
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


          {/* Customer Saved Designs */}
          <SavedDesignsPanel
            customer={customer}
            savedDesigns={savedDesigns}
            showSavedDesigns={showSavedDesigns}
            setShowSavedDesigns={setShowSavedDesigns}
            isLoadingSaved={isLoadingSaved}
            theme={theme}
            color={color}
            t={t}
            onApply={applySavedDesign}
            onDelete={(id) => {
              if (customer) {
                fetch("/api/designs", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ customerId: customer.id, designId: id }) })
                  .then(() => loadSavedDesigns(customer.id))
                  .catch(() => {});
              }
            }}
          />

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
                  : (lang === "lv" ? "Krma krsa" : "Cream");
                return (
                  <button
                    key={c}
                    onClick={() => {
                      setColor(c);
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
                      }
                    }}
                    className={cn(
                      "w-11 h-11 rounded-full border-2 transition-all",
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

          {/* Garment Size Selection (wearable size) — hoodies only; caps are one-size */}
          {product === "hoodie" && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.garmentSize}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(["S", "M", "L", "XL"] as const).map(gs => (
                  <button
                    key={gs}
                    onClick={() => setGarmentSize(gs)}
                    className={cn(
                      "py-3 rounded-lg border text-sm font-bold transition-all",
                      garmentSize === gs
                        ? "border-[#3e92cc] bg-[#3e92cc]/10 text-[#3e92cc]"
                        : theme === "dark"
                          ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300"
                    )}
                  >
                    {gs}
                  </button>
                ))}
              </div>
              <p className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-400")}>{t.garmentSizeHint}</p>
            </div>
          )}

          {/* View Selection */}
          {product === "hoodie" && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {t.view}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["front", "back", "left-sleeve", "right-sleeve"] as View[]).map(v => {
                  // Lock view switching while an add/edit-embroidery flow is open, so the
                  // user must confirm or press Atcelt before starting a design elsewhere.
                  const locked = !!addingMode;
                  return (
                  <button
                    key={v}
                    disabled={locked}
                    title={locked ? t.viewLocked : undefined}
                    onClick={() => { if (locked) return; setView(v); setSelectedDesignId(null); }}
                    className={cn(
                      "py-3 px-3 rounded-lg border text-sm font-medium transition-all",
                      view === v
                        ? "border-[#3e92cc] bg-[#3e92cc]/10 text-[#3e92cc]"
                        : theme === "dark"
                          ? "border-neutral-700 text-neutral-300 hover:border-neutral-600"
                          : "border-gray-200 text-gray-700 hover:border-gray-300",
                      locked && "cursor-not-allowed",
                      locked && view !== v && "opacity-40"
                    )}
                  >
                    {v === "front" ? t.front : v === "back" ? t.back : v === "left-sleeve" ? t.leftSleeve : t.rightSleeve}
                  </button>
                  );
                })}
              </div>
              {!!addingMode && (
                <p className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-400")}>
                  {t.viewLocked}
                </p>
              )}
            </div>
          )}

          <SizeStyleSelector
            view={view}
            product={product}
            color={color}
            style={style}
            theme={theme}
            t={t}
            addingMode={addingMode}
            setAddingMode={setAddingMode}
            viewSizes={viewSizes}
            setViewSizes={setViewSizes}
            designs={designs}
            setDesigns={setDesigns}
            selectedDesignId={selectedDesignId}
            selectedDesign={selectedDesign}
            selectedIsAdditional={selectedIsAdditional}
            currentDesignsForView={currentDesignsForView}
            onStyleChange={handleStyleChange}
            onScrollToPreview={() => {
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
              }
            }}
          />
          {/* Cancel adding mode button */}
          {addingMode && (
            <button
              onClick={() => setAddingMode(null)}
              className={cn(
                "w-full py-2 text-sm rounded-lg border transition-all",
                theme === "dark"
                  ? "border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-white"
                  : "border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
              )}
            > {t.cancelAdding}
            </button>
          )}

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

          {/* Upload Photo -- visible when view has no photo design, OR in adding mode upload step */}
          {((!addingMode && !currentDesignsForView.some(d => !d.textContent)) || addingMode?.step === "upload") && (
            <div className="space-y-2">
              <label className={cn("text-sm font-semibold uppercase tracking-wide",
                addingMode?.step === "upload" ? "text-[#3e92cc]" : theme === "dark" ? "text-neutral-500" : "text-gray-500"
              )}>
                {addingMode?.step === "upload" ? t.uploadHint : t.uploadPhoto}
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
                  addingMode?.step === "upload"
                    ? "border-[#3e92cc]/60 hover:border-[#3e92cc] hover:bg-[#3e92cc]/5"
                    : theme === "dark"
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-gray-300 hover:border-gray-400"
                )}
              >
                <svg className={cn("w-8 h-8 mx-auto mb-2", addingMode?.step === "upload" ? "text-[#3e92cc]" : theme === "dark" ? "text-neutral-600" : "text-gray-400")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className={cn("text-sm", addingMode?.step === "upload" ? "text-[#3e92cc]" : theme === "dark" ? "text-neutral-400" : "text-gray-600")}>
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
            <DesignLayersPanel
              designs={designs}
              designLabels={designLabels}
              selectedDesignId={selectedDesignId}
              setSelectedDesignId={setSelectedDesignId}
              setStyle={setStyle}
              onDeleteDesign={handleDeleteDesign}
              onEditText={handleEditText}
              onSaveDesign={handleSaveDesign}
              customer={customer}
              isSavingDesign={isSavingDesign}
              product={product}
              view={view}
              setView={setView}
              addingMode={addingMode}
              setAddingMode={setAddingMode}
              theme={theme}
              color={color}
              t={t}
              onScrollToUpload={() => sidebarTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            />
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
              {isSavingDesign ? t.savingDesign : t.saveDesign}
            </button>
          )}

        </div>
        {/* Cart Buttons - Desktop sticky footer: always visible at sidebar bottom */}
        <div className={cn(
          "hidden md:block shrink-0 p-4 border-t",
          theme === "dark" ? "border-neutral-800" : "border-gray-200"
        )}>
          <CartButtons
            mobile={false}
            designs={designs}
            isAddingToCart={isAddingToCart}
            currentPrice={currentPrice}
            theme={theme}
            t={t}
            showMultipleTooltip={showMultipleTooltip}
            setShowMultipleTooltip={setShowMultipleTooltip}
            onAddToCart={handleAddToCartClick}
            onOpenMultiple={() => { setMultipleQtys({ S: 0, M: 0, L: 0, XL: 0 }); setShowMultipleModal(true); }}
          />
        </div>
      </div>

      {/* Cart Buttons - Mobile */}
      <CartButtons
        mobile={true}
        designs={designs}
        isAddingToCart={isAddingToCart}
        currentPrice={currentPrice}
        theme={theme}
        t={t}
        showMultipleTooltip={showMultipleTooltip}
        setShowMultipleTooltip={setShowMultipleTooltip}
        onAddToCart={handleAddToCartClick}
        onOpenMultiple={() => { setMultipleQtys({ S: 0, M: 0, L: 0, XL: 0 }); setShowMultipleModal(true); }}
      />

      {/* Modals */}
      {showWelcome && (
        <WelcomePopup
          t={t}
          lang={lang}
          onLangChange={handleLangChange}
          onShowGuide={() => { setShowWelcome(false); setShowGuide(true); localStorage.setItem("tinythread_visited", "1"); }}
          onClose={() => { setShowWelcome(false); localStorage.setItem("tinythread_visited", "1"); }}
        />
      )}

      {showMaxDesignsPopup && (
        <MaxDesignsPopup theme={theme} t={t} onClose={() => setShowMaxDesignsPopup(false)} />
      )}

      {showGuide && (
        <GuideModal
          lang={lang}
          guideStep={guideStep}
          setGuideStep={setGuideStep}
          t={t}
          onClose={() => { setShowGuide(false); setGuideStep(0); }}
        />
      )}

      {showTextModal && (
        <TextModal
          view={view}
          color={color}
          t={t}
          editingTextId={editingTextId}
          textInput={textInput}
          setTextInput={setTextInput}
          textFontInput={textFontInput}
          setTextFontInput={setTextFontInput}
          textColorInput={textColorInput}
          setTextColorInput={setTextColorInput}
          textMultiRowInput={textMultiRowInput}
          setTextMultiRowInput={setTextMultiRowInput}
          textSizeInput={textSizeInput}
          setTextSizeInput={setTextSizeInput}
          sleeveHasPhoto={isSleeveView(view) && designs.some(d => d.view === view && !d.textContent)}
          onEditSizeChange={(s) => {
            if (editingTextId) {
              setDesigns(prev => prev.map(d =>
                d.id === editingTextId ? { ...d, size: s as Size, currentSizePx: TEXT_SIZE_PX[s] } : d
              ));
            }
          }}
          onClose={() => {
            setShowTextModal(false);
            setTextInput("");
            setEditingTextId(null);
            setTextColorInput("");
            setTextMultiRowInput(false);
            setTextSizeInput("M");
          }}
          onConfirm={handleAddText}
        />
      )}

      {showMultipleModal && (
        <OrderMultipleModal
          product={product}
          flatUnitPrice={currentPrice}
          multipleQtys={multipleQtys}
          setMultipleQtys={setMultipleQtys}
          multipleOrderTotal={multipleOrderTotal}
          multipleOrderTotalQty={multipleOrderTotalQty}
          isAddingMultiple={isAddingMultiple}
          onAddToCart={handleAddMultipleToCart}
          onClose={() => setShowMultipleModal(false)}
          theme={theme}
          t={t}
        />
      )}

      {showCarPlatePopup && carPlatePending && (
        <LicensePlateModal
          carPlateStep={carPlateStep}
          setCarPlateStep={setCarPlateStep}
          carPlateInput={carPlateInput}
          setCarPlateInput={setCarPlateInput}
          t={t}
          onNoPlate={async () => {
            setShowCarPlatePopup(false);
            const { designId, base64, sleevePlacement } = carPlatePending;
            setCarPlatePending(null);
            const success = await generateEmbroidery(designId, base64, "car", false, "");
            if (success && sleevePlacement) toast({ description: t.sleeveTextReminder, duration: 7000 });
          }}
          onYesPlate={() => setCarPlateStep("input")}
          onConfirmPlate={async () => {
            const plate = carPlateInput.trim();
            setShowCarPlatePopup(false);
            const { designId, base64, sleevePlacement } = carPlatePending;
            setCarPlatePending(null);
            const success = await generateEmbroidery(designId, base64, "car", false, plate);
            if (success && sleevePlacement) toast({ description: t.sleeveTextReminder, duration: 7000 });
          }}
        />
      )}

      {showConfirmCart && (
        <ConfirmCartModal
          hasOnlyFrontDesign={designs.length === 1}
          product={product}
          flatUnitPrice={currentPrice}
          multipleQtys={multipleQtys}
          setMultipleQtys={setMultipleQtys}
          multipleOrderTotal={multipleOrderTotal}
          multipleOrderTotalQty={multipleOrderTotalQty}
          isAddingMultiple={isAddingMultiple}
          t={t}
          onConfirm={() => { setShowConfirmCart(false); handleAddMultipleToCart(); }}
          onClose={() => setShowConfirmCart(false)}
        />
      )}
    </div>
  );
}
