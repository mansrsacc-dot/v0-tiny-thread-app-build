"use client";

import { cn } from "@/lib/utils";
import type { View, Product, Style, Color } from "@/lib/garment-images";
import type { Design, AddingMode, Customer } from "@/lib/types";
import { TEXT_FONTS, MAX_DESIGNS_PER_SIDE } from "@/lib/constants";

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

interface DesignLayersPanelProps {
  designs: Design[];
  designLabels: string[];
  selectedDesignId: string | null;
  setSelectedDesignId: (id: string | null) => void;
  setStyle: (style: Style) => void;
  onDeleteDesign: (id: string) => void;
  onEditText: (design: Design) => void;
  onSaveDesign: (design: Design) => void;
  customer: Customer | null;
  isSavingDesign: boolean;
  product: Product;
  view: View;
  setView: (view: View) => void;
  addingMode: AddingMode;
  setAddingMode: (mode: AddingMode) => void;
  theme: "dark" | "light";
  color: Color;
  t: Record<string, string>;
}

export function DesignLayersPanel({
  designs,
  designLabels,
  selectedDesignId,
  setSelectedDesignId,
  setStyle,
  onDeleteDesign,
  onEditText,
  onSaveDesign,
  customer,
  isSavingDesign,
  product,
  view,
  setView,
  addingMode,
  setAddingMode,
  theme,
  color,
  t,
}: DesignLayersPanelProps) {
  return (
    <div className="space-y-2">
      <label className={cn(
        "text-sm font-semibold uppercase tracking-wide",
        theme === "dark" ? "text-neutral-500" : "text-gray-500"
      )}>
        {t.designLayers}
      </label>

      <div className="space-y-2">
        {designs.map((design, designIdx) => (
          <div
            key={design.id}
            onClick={() => {
              setSelectedDesignId(design.id);
              if (!design.textContent) setStyle(design.style);
            }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
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
              <div className={cn(
                "text-sm font-medium truncate",
                theme === "dark" ? "text-white" : "text-gray-900"
              )}>
                {design.textContent
                  ? `${t.textOnly}: "${design.textContent}"`
                  : designLabels[designIdx]}
              </div>
              <div className={cn("text-xs", theme === "dark" ? "text-neutral-500" : "text-gray-500")}>
                {design.view === "front" ? t.front
                  : design.view === "back" ? t.back
                  : design.view === "left-sleeve" ? t.leftSleeve
                  : t.rightSleeve}
                {design.textContent || isSleeveView(design.view) ? "" : ` · ${design.size}`}
              </div>
            </div>

            {design.textContent && (
              <button
                onClick={(e) => { e.stopPropagation(); onEditText(design); }}
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
                onClick={(e) => { e.stopPropagation(); onSaveDesign(design); }}
                disabled={isSavingDesign}
                className={cn(
                  "p-1 rounded transition-colors",
                  isSavingDesign ? "opacity-50" : "hover:bg-[#3e92cc]/20 text-[#3e92cc]"
                )}
                title="Saglabāt dizainu"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); onDeleteDesign(design.id); }}
              className="p-1 rounded hover:bg-red-500/20 text-red-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add to back/front (hoodie only, when there's exactly 1 photo design) */}
      {product === "hoodie" && (() => {
        const photoDesigns = designs.filter(d => !d.textContent);
        if (photoDesigns.length !== 1) return null;
        const existingView = photoDesigns[0]?.view;
        const otherView = existingView === "front" ? "back" : "front";
        if (photoDesigns.some(d => d.view === otherView)) return null;
        return (
          <div>
            <button
              onClick={() => {
                setView(otherView as "front" | "back");
                setSelectedDesignId(null);
                setAddingMode({ context: otherView === "back" ? "back" : "additional", step: "size" });
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
            {otherView === "back" && (
              <p className="text-center text-xs text-white/40 mt-1">{t.addToBackPrice}</p>
            )}
          </div>
        );
      })()}

      {/* Add another design to current side (2nd or 3rd photo) */}
      {!isSleeveView(view) && (() => {
        const photosOnCurrentView = designs.filter(d => d.view === view && !d.textContent).length;
        if (photosOnCurrentView < 1 || photosOnCurrentView >= MAX_DESIGNS_PER_SIDE) return null;
        return (
          <div>
            <button
              onClick={() => setAddingMode({ context: "additional", step: "size" })}
              className={cn(
                "w-full py-2 text-sm border border-dashed rounded-lg transition-all",
                theme === "dark"
                  ? "border-[#3e92cc]/50 text-[#3e92cc] hover:border-[#3e92cc] hover:bg-[#3e92cc]/20"
                  : "border-[#3e92cc]/60 text-[#3e92cc] hover:border-[#3e92cc] hover:bg-[#3e92cc]/10"
              )}
            >
              + {t.addAnotherDesign}
            </button>
            <p className="text-center text-xs text-white/40 mt-1">{t.additionalDesignPrice}</p>
          </div>
        );
      })()}
    </div>
  );
}
