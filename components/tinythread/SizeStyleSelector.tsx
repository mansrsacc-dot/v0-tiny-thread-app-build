"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { STYLES, SIZE_CONSTRAINTS } from "@/lib/garment-images";
import type { View, Product, Style, Size, Color } from "@/lib/garment-images";
import type { Design, AddingMode } from "@/lib/types";
import { BACK_SURCHARGE, ADDITIONAL_DESIGN_PRICING } from "@/lib/constants";

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

interface SizeStyleSelectorProps {
  view: View;
  product: Product;
  color: Color;
  style: Style;
  theme: "dark" | "light";
  t: Record<string, string>;
  addingMode: AddingMode;
  setAddingMode: (mode: AddingMode) => void;
  viewSizes: Record<string, Size>;
  setViewSizes: React.Dispatch<React.SetStateAction<Record<string, Size>>>;
  designs: Design[];
  setDesigns: React.Dispatch<React.SetStateAction<Design[]>>;
  selectedDesignId: string | null;
  selectedDesign: Design | undefined;
  selectedIsAdditional: boolean;
  currentDesignsForView: Design[];
  onStyleChange: (style: Style) => void;
}

export function SizeStyleSelector({
  view,
  product,
  color,
  style,
  theme,
  t,
  addingMode,
  setAddingMode,
  viewSizes,
  setViewSizes,
  designs,
  setDesigns,
  selectedDesignId,
  selectedDesign,
  selectedIsAdditional,
  currentDesignsForView,
  onStyleChange,
}: SizeStyleSelectorProps) {
  const size: Size = viewSizes[view] ?? "M";

  const handleSizeClick = (s: "S" | "M" | "L") => {
    if (addingMode) {
      setViewSizes(prev => ({ ...prev, [view]: s }));
      if (addingMode.step === "size") {
        setAddingMode({ ...addingMode, step: "style", size: s as "S" | "M" });
      } else {
        setAddingMode({ ...addingMode, size: s as "S" | "M" });
      }
    } else {
      const { min, max } = SIZE_CONSTRAINTS[s];
      const mid = Math.round(min + (max - min) / 2);
      setDesigns(prev => prev.map(d => {
        if (isSleeveView(d.view) || d.textContent) return d;
        const targeted = selectedDesignId
          ? d.id === selectedDesignId && d.view === view
          : d.view === view && !d.textContent;
        if (!targeted) return d;
        return { ...d, size: s, currentSizePx: mid };
      }));
      setViewSizes(prev => ({ ...prev, [view]: s }));
    }
  };

  const activeSize = addingMode
    ? addingMode.size
    : (selectedDesign?.size ?? currentDesignsForView.find(d => !d.textContent)?.size ?? size);

  return (
    <>
      {/* Size Selection */}
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
        <div className={cn(
          "space-y-2 rounded-xl transition-all",
          addingMode?.step === "size" ? "ring-2 ring-[#3e92cc]/70 shadow-[0_0_14px_rgba(62,146,204,0.3)] p-2" : ""
        )}>
          <div className="flex items-center justify-between">
            <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
              {addingMode?.step === "size"
                ? <span className="text-[#3e92cc]">{t.chooseSizeHint}</span>
                : t.size}
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(["S", "M"] as const).map(s => (
              <button
                key={s}
                onClick={() => handleSizeClick(s)}
                className={cn(
                  "py-3 px-2 rounded-lg border text-center transition-all",
                  activeSize === s
                    ? "border-[#3e92cc] bg-[#3e92cc]/10"
                    : theme === "dark"
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className={cn("text-lg font-semibold",
                  activeSize === s ? "text-[#3e92cc]" : theme === "dark" ? "text-white" : "text-gray-900"
                )}>{s}</div>
                <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                  {SIZE_CONSTRAINTS[s].label}
                </div>
              </button>
            ))}
            {/* L button only when not adding mode, not cap, not additional slot */}
            {!addingMode && product !== "cap" && !selectedIsAdditional && (
              <button
                onClick={() => handleSizeClick("L")}
                className={cn(
                  "py-3 px-2 rounded-lg border text-center transition-all",
                  activeSize === "L"
                    ? "border-[#3e92cc] bg-[#3e92cc]/10"
                    : theme === "dark"
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className={cn("text-lg font-semibold",
                  activeSize === "L" ? "text-[#3e92cc]" : theme === "dark" ? "text-white" : "text-gray-900"
                )}>L</div>
                <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                  {SIZE_CONSTRAINTS["L"].label}
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* What to Expect - Before/After Example (only before first design) */}
      {!designs.length && (style === "pet-head" || style === "car" || style === "standard" || style === "outline") && (
        <div className={cn(
          "rounded-xl overflow-hidden border",
          theme === "dark" ? "border-neutral-800 bg-neutral-900/50" : "border-gray-200 bg-gray-50"
        )}>
          <div className={cn("px-3 py-2 text-center", theme === "dark" ? "bg-neutral-800/50" : "bg-gray-100")}>
            <p className={cn("text-xs font-semibold uppercase tracking-wider", theme === "dark" ? "text-neutral-400" : "text-gray-500")}>
              {t.fromPhotoToStitch}
            </p>
          </div>
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1 relative">
              <img
                src={
                  style === "car" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/car_before.jpg"
                  : style === "standard" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/logo_before_final.jpg"
                  : style === "outline" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/outline_before.jpg"
                  : "https://guhctceu21hc4orl.public.blob.vercel-storage.com/example_before.jpg"
                }
                alt="Before"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className={cn(
                "absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                theme === "dark" ? "bg-black/70 text-white/70" : "bg-white/80 text-gray-600"
              )}>
                {t.photoLabel}
              </div>
            </div>
            <div className={cn("text-lg flex-shrink-0", theme === "dark" ? "text-neutral-600" : "text-gray-300")}>→</div>
            <div className="flex-1 relative">
              <img
                src={
                  style === "car" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/car_after.jpg"
                  : style === "standard" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/logo_after_final.jpg"
                  : style === "outline" ? "https://guhctceu21hc4orl.public.blob.vercel-storage.com/outline_after.jpg"
                  : "https://guhctceu21hc4orl.public.blob.vercel-storage.com/example_after.jpg"
                }
                alt="After"
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className={cn(
                "absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-bold",
                theme === "dark" ? "bg-black/70 text-[#3e92cc]" : "bg-white/80 text-[#3e92cc]"
              )}>
                {t.resultLabel}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Style Selection */}
      <div className={cn(
        "space-y-2 rounded-xl transition-all",
        addingMode?.step === "style" ? "ring-2 ring-[#3e92cc]/70 shadow-[0_0_14px_rgba(62,146,204,0.3)] p-2" : "",
        addingMode?.step === "size" ? "opacity-40 pointer-events-none select-none" : ""
      )}>
        <label className={cn("text-sm font-semibold uppercase tracking-wide", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
          {addingMode?.step === "style"
            ? <span className="text-[#3e92cc]">{t.chooseStyleHint}</span>
            : t.style}
        </label>
        <div className="grid grid-cols-2 md:grid-cols-1 gap-2">
          {STYLES.map(s => {
            const chosenSize = addingMode?.size;
            const priceLine = addingMode?.step === "style" && chosenSize
              ? (addingMode.context === "additional"
                ? `${chosenSize}: +€${ADDITIONAL_DESIGN_PRICING[s.id as Style]?.[chosenSize]}`
                : `${chosenSize}: +€${BACK_SURCHARGE[s.id]?.[chosenSize]}`)
              : null;
            return (
              <button
                key={s.id}
                onClick={() => {
                  if (addingMode?.step === "style") {
                    onStyleChange(s.id as Style);
                    setAddingMode(addingMode ? { ...addingMode, step: "upload" } : null);
                  } else {
                    onStyleChange(s.id as Style);
                  }
                }}
                className={cn(
                  "w-full p-3 rounded-lg border text-left transition-all",
                  style === s.id
                    ? "border-[#3e92cc] bg-[#3e92cc]/10"
                    : theme === "dark"
                      ? "border-neutral-700 hover:border-neutral-600"
                      : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className={cn(
                  "font-medium text-sm",
                  style === s.id ? "text-[#3e92cc]" : theme === "dark" ? "text-white" : "text-gray-900"
                )}>
                  {s.id === "outline" ? t.styleOutline
                    : s.id === "standard" ? t.styleStandard
                    : s.id === "pet-head" ? t.stylePetHead
                    : t.styleCar}
                </div>
                <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                  {s.id === "outline" ? t.outlineDesc
                    : s.id === "standard" ? t.standardDesc
                    : s.id === "pet-head" ? t.petHeadDesc
                    : t.carDesc}
                </div>
                <div className={cn("text-xs mt-0.5 hidden md:block", theme === "dark" ? "text-neutral-600" : "text-gray-400")}>
                  {t.bestFor}: {s.id === "outline" ? t.outlineBest
                    : s.id === "standard" ? t.standardBest
                    : s.id === "pet-head" ? t.petHeadBest
                    : t.carBest}
                </div>
                {priceLine && (
                  <div className="text-xs mt-1.5 text-[#3e92cc] font-semibold">{priceLine}</div>
                )}
              </button>
            );
          })}
        </div>
        {style === "pet-head" && (
          <div className="p-2 rounded-lg bg-[#3e92cc]/10 border border-[#3e92cc]/20">
            <p className="text-xs text-[#3e92cc]">{t.petHeadHint}</p>
          </div>
        )}
      </div>
    </>
  );
}
