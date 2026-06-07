"use client";
import React, { useCallback } from "react";
import type { Product, Color, View, Size, Style } from "@/lib/garment-images";
import type { Design } from "@/lib/types";
import type { Lang } from "@/lib/translations";
import {
  VARIANT_IDS, TEXT_FONTS, TEXT_COLOR_PALETTE, TEXT_ADDON_VARIANT_ID,
  SLEEVE_PHOTO_ADDON_VARIANT_ID, ADDITIONAL_DESIGN_VARIANT_IDS,
} from "@/lib/constants";
import { GARMENT_IMAGES, STYLES } from "@/lib/garment-images";
import { submitCartForm, createThumbnail } from "@/lib/image-utils";

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

interface CartActionsParams {
  designs: Design[];
  product: Product;
  color: Color;
  viewSizes: Record<string, Size>;
  style: Style;
  view: View;
  customer: { id: string; firstName: string; lastName: string; email: string } | null;
  lang: Lang;
  t: Record<string, string>;
  multipleQtys: Record<string, number>;
  size: Size;
  currentPrice: number;
  cartQuantity: number;
  garmentSize: "S" | "M" | "L" | "XL";
  setIsAddingToCart: (v: boolean) => void;
  setIsAddingMultiple: React.Dispatch<React.SetStateAction<boolean>>;
  setSavedDesigns: React.Dispatch<React.SetStateAction<any[]>>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toast: (opts: any) => void;
}

export function useCartActions({
  designs, product, color, viewSizes, style, view,
  customer, lang, t, multipleQtys, size, currentPrice, cartQuantity, garmentSize,
  setIsAddingToCart, setIsAddingMultiple, setSavedDesigns, toast,
}: CartActionsParams) {
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

    const isLVm = lang === "lv";

    const sharedProps: Record<string, string> = {
      "_order_ref": orderRef,
      "_design_count": String(designs.length),
      "_placement": designs.map(d => d.view).join(", "),
      "_order_type": "Multiple",
      "_positions": JSON.stringify(designs.map((d, idx) => ({
        view: d.view, x: d.position.x, y: d.position.y,
        size: d.currentSizePx || 150, rotation: d.rotation || 0,
        type: d.textContent ? "text" : "photo",
        ...(d.textContent ? {} : { blobUrl: designBlobUrls[idx] || undefined }),
      }))),
    };
    if (photoStyleNames.length > 0) sharedProps["_embroidery_style"] = photoStyleNames.join(", ");
    if (frontD) sharedProps["_garment"] = `${product}-${color}-front`;
    if (backD)  sharedProps["_garment_back"] = `${product}-${color}-back`;
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
      sharedProps["_license_plate"] = carPhotoDesignMulti.licensePlate || "Nav nepiecieama";
    }
    if (textDesigns.length > 0) {
      sharedProps["_text_detail"] = textDesigns.map(d => {
        const fontName = (TEXT_FONTS.find(f => f.id === d.textFont) || TEXT_FONTS[0]).name;
        const sizeMm = d.currentSizePx ? Math.round(d.currentSizePx * (700 / 780)) : 20;
        const colorEntry = TEXT_COLOR_PALETTE.find(c => c.hex && c.hex.toUpperCase() === (d.textColor || "").toUpperCase());
        const colorLabel = d.textColor ? (colorEntry?.label || d.textColor) : "Auto";
        return `"${d.textContent}" (font: ${fontName}, ${sizeMm}mm, color: ${colorLabel}, ${d.view})`;
      }).join(" | ");
      sharedProps[isLVm ? "Teksts" : "Text"] = textDesigns.map(d => `"${d.textContent}"`).join(" | ");
    }

    const designSizeMm = designs.map(d => d.currentSizePx ? Math.round((d.currentSizePx / 780) * 700) : 100);
    const items = cartItems.map(({ id, quantity, size: itemSize }) => ({
      id,
      quantity,
      properties: {
        ...sharedProps,
        "_embroidery_size": designs.map((d, i) => `${d.size} (${designSizeMm[i]}mm)`).join(", "),
        "_garment_size": garmentSize,
        [isLVm ? "Džempera izmērs" : "Garment Size"]: garmentSize,
        [isLVm ? "Izmērs (izšuvums)" : "Size (embroidery)"]: itemSize,
      },
    }));

    submitCartForm(items);
  } catch (e) {
    console.error("[MULTIPLE ORDER] Failed:", e);
    toast({ title: t.errorCart, description: t.errorGeneric });
  } finally {
    setIsAddingMultiple(false);
  }
}, [multipleQtys, designs, product, color, style, toast, t, lang]);

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
    const cartSize = photoFront?.size || photoBack?.size || size;
    const variantKey = hasFrontAndBack
      ? `${product}-${color}-${cartSize}-${variantStyle}-fb`
      : `${product}-${color}-${cartSize}-${variantStyle}`;
    const variantId = VARIANT_IDS[variantKey];
    
    if (!variantId) {
      throw new Error(t.errorGeneric);
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
    params.set("quantity", String(cartQuantity > 0 ? cartQuantity : 1));

    // Hidden designer-only properties (underscore prefix = hidden in Shopify customer view)
    const photoStyleNames = designs
      .filter(d => !d.textContent)
      .map(d => STYLES.find(s => s.id === d.style)?.name || d.style);
    if (photoStyleNames.length > 0) {
      params.set("properties[_embroidery_style]", photoStyleNames.join(", "));
    }
    params.set("properties[_embroidery_size]", designSpecs.map(d => `${d.size} (${d.sizeMm}mm)`).join(", "));
    params.set("properties[_placement]", designSpecs.map(d => d.view).join(", "));
    params.set("properties[_design_count]", String(designs.length));

    // Text designs: full detail for designer (hidden), clean content for customer
    const textDesigns = designs.filter(d => !!d.textContent);
    if (textDesigns.length > 0) {
      params.set("properties[_text_detail]", textDesigns.map(d => {
        const fontName = (TEXT_FONTS.find(f => f.id === d.textFont) || TEXT_FONTS[0]).name;
        const sizeMm = d.currentSizePx ? Math.round(d.currentSizePx * (700 / 780)) : 20;
        const colorEntry = TEXT_COLOR_PALETTE.find(c => c.hex && c.hex.toUpperCase() === (d.textColor || "").toUpperCase());
        const colorLabel = d.textColor ? (colorEntry?.label || d.textColor) : "Auto";
        return `"${d.textContent}" (font: ${fontName}, ${sizeMm}mm, color: ${colorLabel}, ${d.view})`;
      }).join(" | "));
    }

    // Garment refs for each side
    const frontDesign = designs.find(d => d.view === "front");
    const backDesign = designs.find(d => d.view === "back");
    if (frontDesign) params.set("properties[_garment]", `${product}-${color}-front`);
    if (backDesign)  params.set("properties[_garment_back]", `${product}-${color}-back`);

    // License plate (car style, hidden from customer)
    const carPhotoDesign = designs.find(d => !d.textContent && d.style === "car");
    if (carPhotoDesign && carPhotoDesign.licensePlate !== undefined) {
      params.set("properties[_license_plate]", carPhotoDesign.licensePlate || "Nav nepiecieama");
    }

    // Clean customer-facing properties (language-aware)
    const isLV = lang === "lv";
    // Visible "Size" = the wearable garment size the customer picks in the app
    // (moved here after removing the Shopify size variant picker). Embroidery
    // dimensions remain in the hidden _embroidery_size property for the designer.
    params.set(`properties[${isLV ? "Izmērs" : "Size"}]`, garmentSize);
    params.set("properties[_garment_size]", garmentSize);
    if (textDesigns.length > 0) {
      params.set(`properties[${isLV ? "Teksts" : "Text"}]`, textDesigns.map(d => `"${d.textContent}"`).join(" | "));
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
    // Produces a fixed 800--1000 composite using the same position/size math as the server.
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

        // 1. Garment background -- white fill + object-contain draw so the garment
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
              // image wider than canvas -- letterbox top/bottom
              gw = SHOT_W; gh = Math.round(SHOT_W / ir);
              gx = 0;      gy = Math.round((SHOT_H - gh) / 2);
            } else {
              // image taller than canvas -- pillarbox left/right
              gh = SHOT_H; gw = Math.round(SHOT_H * ir);
              gx = Math.round((SHOT_W - gw) / 2); gy = 0;
            }
            ctx.drawImage(gImg, gx, gy, gw, gh);
          } catch { /* skip garment if load fails */ }
        }

        // 2. Design overlays: identical position formula to the DOM and server composite:
        //    left = SHOT_W * position.x / 100, top = SHOT_H * position.y / 100 (center-anchored)
        //    size = currentSizePx / 780 * SHOT_W  (780px reference space -- 800px canvas)
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
            // Font size is a vertical (height) measurement: use SHOT_H not SHOT_W.
            // Formula: textMm * (SHOT_H / garmentMm) = (currentSizePx/780) * SHOT_H
            const fontSize = Math.round((design.currentSizePx / 780) * SHOT_H);
            ctx.fillStyle = textColor;
            ctx.textBaseline = "middle";
            const lines = design.textMultiRow ? design.textContent.split("\n") : [design.textContent];
            const lineH = fontSize * 1.2;
            const totalTextH = lines.length * lineH;
            ctx.font = `700 ${fontSize}px ${fontDef.css}`;
            ctx.textAlign = "center";
            lines.forEach((line, i) => ctx.fillText(line, 0, -totalTextH / 2 + lineH * i + lineH / 2, sizePx));
          } else {
            // processedImages are base64 data: URLs (bg-removed) -- no CORS needed
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
            // Font size is a vertical measurement: use SHOT_H not SHOT_W.
            const fontSize = Math.round((design.currentSizePx / 780) * SHOT_H);
            ctx.fillStyle = textColorVal;
            ctx.textBaseline = "middle";
            const lines = design.textMultiRow ? design.textContent.split("\n") : [design.textContent];
            const lineH = fontSize * 1.2;
            const totalTextH = lines.length * lineH;
            ctx.font = `700 ${fontSize}px ${fontDef.css}`;
            ctx.textAlign = "center";
            lines.forEach((line, i) => ctx.fillText(line, 0, -totalTextH / 2 + lineH * i + lineH / 2, sizePx));
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
    // _preview_image: Shopify convention for cart line item image override (theme must support it)
    if (screenshotFrontUrl) params.set("properties[_preview_image]", screenshotFrontUrl);
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
      params.set(`properties[${isLV ? "Piedurknes izuvums" : "Sleeve Embroidery"}]`, sleeveDesigns.map(d => {
        if (d.textContent) {
          const fontName = (TEXT_FONTS.find(f => f.id === d.textFont) || TEXT_FONTS[0]).name;
          const colorEntry = TEXT_COLOR_PALETTE.find(c => c.hex && c.hex.toUpperCase() === (d.textColor || "").toUpperCase());
          const colorLabel = d.textColor ? (colorEntry?.label || d.textColor) : "Auto";
          const sideLabel = d.view === "left-sleeve" ? "Left Sleeve" : "Right Sleeve";
          return `"${d.textContent}" (font: ${fontName}, 100mm, color: ${colorLabel}, ${sideLabel})`;
        } else {
          const styleName = STYLES.find(s => s.id === d.style)?.name || d.style;
          const sideLabel = d.view === "left-sleeve" ? "Left Sleeve" : "Right Sleeve";
          return `${styleName} (100100mm, ${sideLabel})`;
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
        if (isBlob(src)) return src; // already stored  reuse the URL
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

    // Build full items array (main variant + all add-ons) and submit via form POST.
    // Form POST is a browser navigation: no CORS, session cookies sent automatically.
    const propsObj: Record<string, string> = {};
    for (const [k, v] of params.entries()) {
      if (k.startsWith("properties[") && k.endsWith("]")) {
        propsObj[k.slice("properties[".length, -1)] = v;
      }
    }
    const cartItems: { id: string; quantity: number; properties: Record<string, string> }[] = [
      { id: variantId, quantity: 1, properties: propsObj },
    ];
    const orderRef = propsObj["_order_ref"] || "";

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

    if (billableTextCount > 0 && TEXT_ADDON_VARIANT_ID) {
      cartItems.push({ id: TEXT_ADDON_VARIANT_ID, quantity: billableTextCount, properties: { "_for_order_ref": orderRef } });
    }
    if (sleevePhotoCount > 0 && SLEEVE_PHOTO_ADDON_VARIANT_ID) {
      cartItems.push({ id: SLEEVE_PHOTO_ADDON_VARIANT_ID, quantity: sleevePhotoCount, properties: { "_for_order_ref": orderRef } });
    }
    for (const { design: addDesign, addSize } of additionalPhotoDesigns) {
      const addVariantId = ADDITIONAL_DESIGN_VARIANT_IDS[addDesign.style]?.[addSize];
      if (addVariantId) {
        const styleName = STYLES.find(s => s.id === addDesign.style)?.name || addDesign.style;
        const sizeMm = Math.round((addDesign.currentSizePx / 780) * 700);
        cartItems.push({ id: addVariantId, quantity: 1, properties: { "_for_order_ref": orderRef, "_style": styleName, "_size": `${addSize} (${sizeMm}mm)`, "_placement": addDesign.view } });
      }
    }
    console.log("[ADD TO CART] variantKey:", variantKey, "variantId:", variantId, "appPrice:", currentPrice);
    console.log("[ADD TO CART] cart-add payload:", JSON.stringify(cartItems.map(i => ({ id: i.id, qty: i.quantity })), null, 2));
    submitCartForm(cartItems);

  } catch (error: unknown) {
    console.error("[ADD TO CART] Error:", error);
    toast({
      title: t.errorCart,
      description: t.errorGeneric,
      variant: "destructive"
    });
    setIsAddingToCart(false);
  }
}, [designs, product, color, viewSizes, style, view, toast, customer, lang]);


  return { handleAddToCart, handleAddMultipleToCart };
}