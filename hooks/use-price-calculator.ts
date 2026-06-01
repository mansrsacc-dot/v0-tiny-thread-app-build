import type { Product, Style, Size } from "@/lib/garment-images";
import type { Design } from "@/lib/types";
import {
  PRICING,
  BACK_SURCHARGE,
  SLEEVE_PRICE,
  TEXT_PRICE,
  ADDITIONAL_DESIGN_PRICING,
} from "@/lib/constants";

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

export interface PriceBreakdown {
  basePrice: number;
  backSurcharge: number;
  sleeveSurcharge: number;
  textSurcharge: number;
  additionalDesignSurcharge: number;
  currentPrice: number;
}

export function calculatePrice(
  designs: Design[],
  product: Product,
  style: Style,
  size: Size
): PriceBreakdown {
  const photoFrontDesign = designs.find(d => d.view === "front" && !d.textContent);
  const photoBackDesign = designs.find(d => d.view === "back" && !d.textContent);
  const primaryPhotoStyle: Style = photoFrontDesign?.style || photoBackDesign?.style || style;
  const primaryDesignSize = (photoFrontDesign?.size || photoBackDesign?.size || size) as Size;

  const basePrice = designs.length > 0 ? (PRICING[product]?.[primaryPhotoStyle]?.[primaryDesignSize] || 0) : 0;

  const hasBothSidesPhoto = !!photoFrontDesign && !!photoBackDesign;
  const backDesignSize = photoBackDesign?.size || primaryDesignSize;
  const backSurcharge = hasBothSidesPhoto
    ? (BACK_SURCHARGE[photoBackDesign!.style]?.[backDesignSize] || 0)
    : 0;

  const sleevePhotoDesigns = designs.filter(d => isSleeveView(d.view) && !d.textContent);
  const sleeveSurcharge = sleevePhotoDesigns.length * SLEEVE_PRICE;

  const sleeveTextOnlyCount = designs.filter(d =>
    isSleeveView(d.view) && !!d.textContent && !designs.some(o => o.view === d.view && !o.textContent)
  ).length;
  const regularTextCount = designs.filter(d => !!d.textContent && !isSleeveView(d.view)).length;
  const textSurcharge = (regularTextCount + sleeveTextOnlyCount) * TEXT_PRICE;

  let additionalDesignSurcharge = 0;
  for (const v of ["front", "back"] as const) {
    const photosOnSide = designs.filter(d => d.view === v && !d.textContent);
    for (let i = 1; i < photosOnSide.length; i++) {
      const d = photosOnSide[i];
      const eff = (d.size === "L" ? "M" : d.size) as "S" | "M";
      additionalDesignSurcharge += ADDITIONAL_DESIGN_PRICING[d.style]?.[eff] || 0;
    }
  }

  return {
    basePrice,
    backSurcharge,
    sleeveSurcharge,
    textSurcharge,
    additionalDesignSurcharge,
    currentPrice: basePrice + backSurcharge + sleeveSurcharge + textSurcharge + additionalDesignSurcharge,
  };
}
