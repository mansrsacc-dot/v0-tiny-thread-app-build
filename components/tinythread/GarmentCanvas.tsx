"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { GARMENT_IMAGES } from "@/lib/garment-images";
import type { View, Product, Color, Size, Style } from "@/lib/garment-images";
import type { Design } from "@/lib/types";
import { TEXT_FONTS, TEXT_COLOR_PALETTE, TEXT_SIZE_CONSTRAINTS, SLEEVE_SIZE_CONSTRAINTS } from "@/lib/constants";
import { SIZE_CONSTRAINTS } from "@/lib/garment-images";

const isSleeveView = (v: string) => v === "left-sleeve" || v === "right-sleeve";

interface GarmentCanvasProps {
  view: View;
  product: Product;
  color: Color;
  theme: "dark" | "light";
  designs: Design[];
  currentDesignsForView: Design[];
  selectedDesignId: string | null;
  showStitched: boolean;
  setShowStitched: (v: boolean) => void;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  previewRef: React.RefObject<HTMLDivElement | null>;
  sizeScale: number;
  previewWidth: number;
  isGenerating: boolean;
  cooldown: number;
  t: Record<string, string>;
  selectedDesign: Design | undefined;
  setSelectedDesignId: (id: string | null) => void;
  setDesigns: React.Dispatch<React.SetStateAction<Design[]>>;
  setStyle: React.Dispatch<React.SetStateAction<Style>>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  getGarmentImage: () => string | null;
  getSizeInMm: (sizePx: number, sizeCategory: Size, isText?: boolean) => number;
  handlePointerDown: (e: React.MouseEvent | React.TouchEvent, designId: string) => void;
  handleResizePointerDown: (e: React.MouseEvent | React.TouchEvent, designId: string) => void;
  handleDeleteDesign: (id: string) => void;
  handleEditText: (design: Design) => void;
  handleRegenerate: () => void;
  navigateHistory: (direction: "prev" | "next", targetDesignId?: string) => void;
}

export function GarmentCanvas({
  view, product, color, theme, designs, currentDesignsForView,
  selectedDesignId, selectedDesign, showStitched, setShowStitched,
  zoom, setZoom, previewRef, sizeScale, previewWidth,
  isGenerating, cooldown, t,
  setSelectedDesignId, setDesigns, setStyle, fileInputRef,
  getGarmentImage, getSizeInMm,
  handlePointerDown, handleResizePointerDown, handleDeleteDesign,
  handleEditText, handleRegenerate, navigateHistory,
}: GarmentCanvasProps) {
  const handleMouseDown = handlePointerDown;
  const handleResizeMouseDown = handleResizePointerDown;
  const [regenTooltipDesignId, setRegenTooltipDesignId] = useState<string | null>(null);
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
<div className={cn(
  "w-full md:flex-1 md:h-screen order-1 md:order-2 flex flex-col relative",
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
        // Clamp legacy oversized text designs (e.g. old sleeve designs saved at 150px)
        const safeTextSizePx = isText ? Math.min(design.currentSizePx, TEXT_SIZE_CONSTRAINTS.L.max) : design.currentSizePx;
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
              // Text: no fixed dimensions -- container auto-sizes to text content so the
              // selection ring wraps the actual rendered text, not an arbitrary square.
              // Images: fixed square sized to currentSizePx.
              ...(isText ? {} : {
                width: design.currentSizePx * sizeScale,
                height: design.currentSizePx * sizeScale,
              }),
              // Permanent dashed outline keeps designs visible on any garment color.
              // Blue ring-2 is added via className when selected (box-shadow, coexists with outline).
              outline: selectedDesignId === design.id ? "none" : "1px dashed rgba(80,80,80,0.3)",
              outlineOffset: "2px",
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
              <div className="flex items-center justify-center pointer-events-none px-1 py-0.5">
                <span
                  style={{
                    fontFamily: fontDef.css,
                    fontVariant: fontDef.fontVariant,
                    color: textColor,
                    fontWeight: 700,
                    // Text font size uses canvas HEIGHT (aspect 4:5 → height = width×1.25).
                    // Formula: textMm × (previewHeight / garmentMm) = (sizePx/780) × previewHeight
                    fontSize: Math.max(8, Math.round((safeTextSizePx / 780) * (previewWidth * 1.25))),
                    lineHeight: 1.2,
                    whiteSpace: design.textMultiRow ? "pre-line" : "nowrap",
                    textAlign: "center",
                    textShadow: color === "black" ? "0 0 2px rgba(0,0,0,0.3)" : "0 0 2px rgba(255,255,255,0.3)",
                  }}
                >
                  {design.textContent}
                </span>
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

                {/* Resize Handle -- hidden for fixed-size sleeve designs */}
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
                  {isSleeveView(design.view) ? t.sleeveSizeFixed : `~${getSizeInMm(design.currentSizePx, design.size, !!design.textContent)}mm`}
                </div>
                
                {/* Regenerate & History Controls - Below Design */}
                {design.generatedImages[design.style] && (
                  <div 
                    className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {/* Regenerate Button */}
                    <Tooltip
                      open={regenTooltipDesignId === design.id}
                      onOpenChange={(open) => setRegenTooltipDesignId(open ? design.id : null)}
                    >
                      <TooltipTrigger asChild>
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
                          onTouchStart={() => {
                            touchTimerRef.current = setTimeout(() => setRegenTooltipDesignId(design.id), 400);
                          }}
                          onTouchEnd={() => {
                            if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                            setTimeout(() => setRegenTooltipDesignId(null), 1800);
                          }}
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
                      </TooltipTrigger>
                      <TooltipContent side="top" className="bg-neutral-900 text-neutral-100 border-neutral-700">
                        {t.regenTooltipPrefix} — {4 - design.regenerationCount} {t.regenLeft}
                      </TooltipContent>
                    </Tooltip>
                    
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

    {/* Upload Prompt Overlay -- only when view has no designs at all */}
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
              {view === "front" && designs.filter(d => !d.textContent).length === 0 ? (
                <>
                  <p className="text-white font-semibold text-sm group-hover:text-[#3e92cc] transition-colors">{t.clickToUpload}</p>
                  <p className="text-white/40 text-xs mt-1">{t.maxFileSize}</p>
                </>
              ) : (
                <>
                  <p className="text-white font-semibold text-sm group-hover:text-[#3e92cc] transition-colors">
                    {view === "back"
                      ? t.addToBack
                      : isSleeveView(view)
                        ? (view === "left-sleeve" ? t.addToLeftSleeve : t.addToRightSleeve)
                        : t.addToFront}
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
      {product.toUpperCase()} -- {color.toUpperCase()} -- {view.toUpperCase()}
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
  );
}