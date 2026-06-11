"use client";
import React, { useCallback } from "react";
import type { Product, Color, View, Size, Style } from "@/lib/garment-images";
import type { Design } from "@/lib/types";
import type { Lang } from "@/lib/translations";
import {
  VARIANT_IDS, TEXT_FONTS, TEXT_COLOR_PALETTE, TEXT_ADDON_VARIANT_ID,
  SLEEVE_PHOTO_ADDON_VARIANT_ID, ADDITIONAL_DESIGN_VARIANT_IDS, BACK_DESIGN_VARIANT_IDS,
  DUP_DISCOUNT_PROP_KEY, DUP_DISCOUNT_PROP_VALUE,
} from "@/lib/constants";
import { STYLES } from "@/lib/garment-images";
import { submitCartForm, createThumbnail } from "@/lib/image-utils";
import { captureCartScreenshots } from "@/lib/screenshot-capture";

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

  // Embroidery size (from the canvas design) drives the variant — identical for every
  // unit. Garment size only changes the fit and is sent as a line-item property below,
  // never as the variant. Mirrors the single Add-to-Cart flow.
  // Front-Only base for every unit; the back (if any) is a separate back-design add-on
  // scaled by total units below, so display (currentPrice × qty) equals the charge.
  const cartSize = photoFront?.size || photoBack?.size || size;
  const baseVariantKey = `${product}-${color}-${cartSize}-${variantStyle}`;
  const baseVariantId = VARIANT_IDS[baseVariantKey];
  if (!baseVariantId) {
    toast({ title: t.errorCart, description: t.errorGeneric });
    return;
  }

  // Garment-size columns = fit only, flat price. Hoodie: S/M/L/XL (XL now selectable).
  // Cap: two fit groups. The label is what we send to Shopify as the visible size.
  const garmentCols: { key: string; label: string }[] = product === "hoodie"
    ? [{ key: "S", label: "S" }, { key: "M", label: "M" }, { key: "L", label: "L" }, { key: "XL", label: "XL" }]
    : [{ key: "S", label: "S/M" }, { key: "M", label: "L/XL" }];
  const selectedCols = garmentCols.filter(c => (multipleQtys[c.key] || 0) > 0);
  const totalUnits = selectedCols.reduce((s, c) => s + (multipleQtys[c.key] || 0), 0);
  if (totalUnits === 0) {
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
    const embroiderySizeDetail = designs.map((d, i) => `${d.size} (${designSizeMm[i]}mm)`).join(", ");

    // Composite mockups (front/back/sleeves) for the designer email — same helper the single
    // Add-to-Cart flow uses. Stamped on the anchor line only (the design-bearing line the
    // webhook processes), so the email renders every side identically to single orders.
    const shots = await captureCartScreenshots(designs, product, color);
    const screenshotProps: Record<string, string> = {};
    if (shots.front) { screenshotProps["_screenshot_front"] = shots.front; screenshotProps["_preview_image"] = shots.front; }
    if (shots.back) screenshotProps["_screenshot_back"] = shots.back;
    if (shots.leftSleeve) screenshotProps["_screenshot_left_sleeve"] = shots.leftSleeve;
    if (shots.rightSleeve) screenshotProps["_screenshot_right_sleeve"] = shots.rightSleeve;

    // Duplicate discount across the whole group (N = totalUnits): exactly ONE unit stays full
    // price. The first selected garment size hosts that full unit on a line carrying the heavy
    // design props + _group_units; its remaining units and every other size are flagged
    // (Regios -35%) and lightweight (_for_order_ref) so the webhook renders the design once.
    const N = totalUnits;
    const dupFlag: Record<string, string> = N > 1 ? { [DUP_DISCOUNT_PROP_KEY]: DUP_DISCOUNT_PROP_VALUE } : {};
    // Full per-size quantity breakdown for the designer email (e.g. "M ×2, L ×1"). Stamped on
    // the one design-bearing line so the artist sees every size without checking order admin.
    const sizeBreakdown = selectedCols.map(c => `${c.label} ×${multipleQtys[c.key]}`).join(", ");
    const baseItems: { id: string; quantity: number; properties: Record<string, string> }[] = [];
    selectedCols.forEach((c, idx) => {
      const qty = multipleQtys[c.key]!;
      const sizeProps = { "_garment_size": c.label, [isLVm ? "Izmērs" : "Size"]: c.label };
      if (idx === 0) {
        baseItems.push({ id: baseVariantId, quantity: 1, properties: { ...sharedProps, "_embroidery_size": embroiderySizeDetail, ...screenshotProps, ...sizeProps, "_group_units": String(N), "_size_breakdown": sizeBreakdown } });
        if (qty > 1) baseItems.push({ id: baseVariantId, quantity: qty - 1, properties: { "_for_order_ref": orderRef, ...sizeProps, ...dupFlag } });
      } else {
        baseItems.push({ id: baseVariantId, quantity: qty, properties: { "_for_order_ref": orderRef, ...sizeProps, ...dupFlag } });
      }
    });

    // Add-ons (text / sleeve photo / additional designs) are per finished unit, so scale
    // them by the total number of units across all garment sizes — the same add-on
    // variants the single Add-to-Cart flow uses, so the cart total equals
    // (full per-unit price) × (total units) and matches what the popup displays.
    const regularTextCount = designs.filter(d => !!d.textContent && !isSleeveView(d.view)).length;
    const sleeveTextOnlyCount = designs.filter(d =>
      isSleeveView(d.view) && !!d.textContent && !designs.some(o => o.view === d.view && !o.textContent)
    ).length;
    const billableTextCount = regularTextCount + sleeveTextOnlyCount;
    const sleevePhotoCount = designs.filter(d => isSleeveView(d.view) && !d.textContent).length;
    const additionalPhotoDesigns: { design: Design; addSize: "S" | "M" }[] = [];
    for (const v of ["front", "back"] as View[]) {
      const photosOnSide = designs.filter(d => d.view === v && !d.textContent);
      for (let i = 1; i < photosOnSide.length; i++) {
        const d = photosOnSide[i];
        additionalPhotoDesigns.push({ design: d, addSize: (d.size === "L" ? "M" : d.size) as "S" | "M" });
      }
    }

    const addonItems: { id: string; quantity: number; properties: Record<string, string> }[] = [];
    // Same full×1 + discounted×(N-1) split as the base, applied to every add-on so additional
    // units get the discount on their full per-unit price.
    const pushSplit = (id: string, perUnit: number, props: Record<string, string>) => {
      if (perUnit <= 0) return;
      addonItems.push({ id, quantity: perUnit, properties: props });
      if (N > 1) addonItems.push({ id, quantity: perUnit * (N - 1), properties: { ...props, ...dupFlag } });
    };
    if (hasFrontAndBack && photoBack) {
      const backVariantId = BACK_DESIGN_VARIANT_IDS[photoBack.style]?.[photoBack.size];
      if (backVariantId) {
        const backStyleName = STYLES.find(s => s.id === photoBack.style)?.name || photoBack.style;
        const backMm = Math.round((photoBack.currentSizePx / 780) * 700);
        pushSplit(backVariantId, 1, { "_for_order_ref": orderRef, "_style": backStyleName, "_size": `${photoBack.size} (${backMm}mm)`, "_placement": "back" });
      }
    }
    if (billableTextCount > 0 && TEXT_ADDON_VARIANT_ID) {
      pushSplit(TEXT_ADDON_VARIANT_ID, billableTextCount, { "_for_order_ref": orderRef });
    }
    if (sleevePhotoCount > 0 && SLEEVE_PHOTO_ADDON_VARIANT_ID) {
      pushSplit(SLEEVE_PHOTO_ADDON_VARIANT_ID, sleevePhotoCount, { "_for_order_ref": orderRef });
    }
    for (const { design: addDesign, addSize } of additionalPhotoDesigns) {
      const addVariantId = ADDITIONAL_DESIGN_VARIANT_IDS[addDesign.style]?.[addSize];
      if (addVariantId) {
        const styleName = STYLES.find(s => s.id === addDesign.style)?.name || addDesign.style;
        const sizeMm = Math.round((addDesign.currentSizePx / 780) * 700);
        pushSplit(addVariantId, 1, { "_for_order_ref": orderRef, "_style": styleName, "_size": `${addSize} (${sizeMm}mm)`, "_placement": addDesign.view });
      }
    }

    submitCartForm([...baseItems, ...addonItems]);
  } catch (e) {
    console.error("[MULTIPLE ORDER] Failed:", e);
    toast({ title: t.errorCart, description: t.errorGeneric });
  } finally {
    setIsAddingMultiple(false);
  }
}, [multipleQtys, designs, product, color, style, size, toast, t, lang]);

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
    // Always submit the primary (front, else back) as a single-side Front-Only variant.
    // When a back design also exists it is added as its own back-design line below, priced
    // at the back's own style+size — so asymmetric front/back is charged correctly.
    const cartSize = photoFront?.size || photoBack?.size || size;
    const variantKey = `${product}-${color}-${cartSize}-${variantStyle}`;
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

    // --- Capture front/back/sleeve composite mockups for the designer email (shared helper) ---
    const _shots = await captureCartScreenshots(designs, product, color);
    const screenshotFrontUrl = _shots.front;
    const screenshotBackUrl = _shots.back;
    const screenshotLeftSleeveUrl = _shots.leftSleeve;
    const screenshotRightSleeveUrl = _shots.rightSleeve;
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
    // Duplicate discount: within this _order_ref group of N identical units, exactly ONE unit
    // stays full price (unflagged) and the other N-1 are flagged so Regios takes 35% off. Split
    // EVERY component (base, back, text, sleeve, additional) into a full ×1 portion and a
    // discounted ×(N-1) portion. The flag property differs, so Shopify keeps them separate lines.
    const N = cartQuantity > 0 ? cartQuantity : 1;
    const dupFlag: Record<string, string> = N > 1 ? { [DUP_DISCOUNT_PROP_KEY]: DUP_DISCOUNT_PROP_VALUE } : {};
    const orderRef = propsObj["_order_ref"] || "";

    // Base garment: the FULL line carries the heavy design props + _group_units (so the webhook/
    // designer email reports the true total N). The discounted line is lightweight and carries
    // _for_order_ref so the webhook skips it (one design email, not two).
    const cartItems: { id: string; quantity: number; properties: Record<string, string> }[] = [
      { id: variantId, quantity: 1, properties: { ...propsObj, "_group_units": String(N), "_size_breakdown": `${garmentSize} ×${N}` } },
    ];
    if (N > 1) {
      cartItems.push({ id: variantId, quantity: N - 1, properties: { "_for_order_ref": orderRef, ...dupFlag } });
    }

    // Split an add-on into full (×perUnit, unflagged) + discounted (×perUnit·(N-1), flagged).
    const pushSplit = (id: string, perUnit: number, props: Record<string, string>) => {
      if (perUnit <= 0) return;
      cartItems.push({ id, quantity: perUnit, properties: props });
      if (N > 1) cartItems.push({ id, quantity: perUnit * (N - 1), properties: { ...props, ...dupFlag } });
    };

    // Back design = first back photo, priced by its OWN style+size (real style, incl. car).
    if (hasFrontAndBack && photoBack) {
      const backVariantId = BACK_DESIGN_VARIANT_IDS[photoBack.style]?.[photoBack.size];
      if (backVariantId) {
        const backStyleName = STYLES.find(s => s.id === photoBack.style)?.name || photoBack.style;
        const backMm = Math.round((photoBack.currentSizePx / 780) * 700);
        pushSplit(backVariantId, 1, { "_for_order_ref": orderRef, "_style": backStyleName, "_size": `${photoBack.size} (${backMm}mm)`, "_placement": "back" });
      }
    }

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
      pushSplit(TEXT_ADDON_VARIANT_ID, billableTextCount, { "_for_order_ref": orderRef });
    }
    if (sleevePhotoCount > 0 && SLEEVE_PHOTO_ADDON_VARIANT_ID) {
      pushSplit(SLEEVE_PHOTO_ADDON_VARIANT_ID, sleevePhotoCount, { "_for_order_ref": orderRef });
    }
    for (const { design: addDesign, addSize } of additionalPhotoDesigns) {
      const addVariantId = ADDITIONAL_DESIGN_VARIANT_IDS[addDesign.style]?.[addSize];
      if (addVariantId) {
        const styleName = STYLES.find(s => s.id === addDesign.style)?.name || addDesign.style;
        const sizeMm = Math.round((addDesign.currentSizePx / 780) * 700);
        pushSplit(addVariantId, 1, { "_for_order_ref": orderRef, "_style": styleName, "_size": `${addSize} (${sizeMm}mm)`, "_placement": addDesign.view });
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
}, [designs, product, color, viewSizes, style, view, size, cartQuantity, toast, customer, lang]);


  return { handleAddToCart, handleAddMultipleToCart };
}