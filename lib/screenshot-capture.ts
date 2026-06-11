"use client";

import type { Product, Color, View } from "@/lib/garment-images";
import type { Design } from "@/lib/types";
import { GARMENT_IMAGES } from "@/lib/garment-images";
import { TEXT_FONTS } from "@/lib/constants";

export interface CartScreenshots {
  front: string | null;
  back: string | null;
  leftSleeve: string | null;
  rightSleeve: string | null;
}

// Capture front/back/sleeve composite mockups (design overlaid on the garment) and upload each
// to Vercel Blob, returning the URLs. Shared by the single (handleAddToCart) and multi
// (handleAddMultipleToCart) cart flows so both produce identical designer-email mockups for
// every side — including sleeves. Native canvas API (works on iOS Safari / Android Chrome),
// using the same position/size math as the server composite. Never throws — returns nulls.
export async function captureCartScreenshots(
  designs: Design[],
  product: Product,
  color: Color,
): Promise<CartScreenshots> {
  let front: string | null = null;
  let back: string | null = null;
  let leftSleeve: string | null = null;
  let rightSleeve: string | null = null;
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
        if (!data.url) console.warn(`[SCREENSHOT] upload failed for ${side} — composite omitted (non-blocking)`);
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

    [front, back, leftSleeve, rightSleeve] = await Promise.all([
      uploadScreenshot(frontDataUrl, "front"),
      uploadScreenshot(backDataUrl, "back"),
      uploadScreenshot(leftSleeveDataUrl, "left-sleeve"),
      uploadScreenshot(rightSleeveDataUrl, "right-sleeve"),
    ]);
  } catch (e) {
    console.error("[SCREENSHOT] Failed, continuing without screenshots:", e);
  }
  return { front, back, leftSleeve, rightSleeve };
}
