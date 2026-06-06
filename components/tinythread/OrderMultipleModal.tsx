"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Product, Color, Style } from "@/lib/garment-images";
import type { Design } from "@/lib/types";
import { VARIANT_IDS, PRICING } from "@/lib/constants";

interface OrderMultipleModalProps {
  product: Product;
  color: Color;
  style: Style;
  primaryPhotoStyle: Style;
  designs: Design[];
  multipleQtys: Record<string, number>;
  setMultipleQtys: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  multipleOrderTotal: number;
  multipleOrderTotalQty: number;
  isAddingMultiple: boolean;
  onAddToCart: () => void;
  onClose: () => void;
  theme: "dark" | "light";
  t: Record<string, string>;
}

export function OrderMultipleModal({
  product,
  color,
  style,
  primaryPhotoStyle,
  designs,
  multipleQtys,
  setMultipleQtys,
  multipleOrderTotal,
  multipleOrderTotalQty,
  isAddingMultiple,
  onAddToCart,
  onClose,
  theme,
  t,
}: OrderMultipleModalProps) {
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
  const variantStyleForModal = ((photoFrontForModal?.style || photoBackForModal?.style || style) === "car"
    ? "pet-head"
    : (photoFrontForModal?.style || photoBackForModal?.style || style));

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={cn(
        "rounded-2xl p-6 w-full max-w-sm shadow-2xl",
        theme === "dark" ? "bg-[#1e1b18] border border-white/10" : "bg-white border border-gray-200"
      )}>
        <div className="flex items-center justify-between mb-5">
          <h2 className={cn("text-base font-bold", theme === "dark" ? "text-white" : "text-gray-900")}>
            {t.orderMultipleTitle}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors",
              theme === "dark" ? "text-white/40 hover:text-white hover:bg-white/10" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            )}
          >✕</button>
        </div>

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
                  "flex flex-col items-center gap-1.5 p-1.5 rounded-xl border min-w-0 overflow-hidden",
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50",
                  !hasVariant && "opacity-40"
                )}
              >
                <span className={cn("font-bold text-sm", theme === "dark" ? "text-white" : "text-gray-900")}>{label}</span>
                {price != null && hasVariant ? (
                  <span className={cn("text-xs", theme === "dark" ? "text-white/45" : "text-gray-400")}>€{price}</span>
                ) : (
                  <span className={cn("text-xs truncate", theme === "dark" ? "text-white/30" : "text-gray-400")}>{t.orderMultipleSizeNA}</span>
                )}
                {hasVariant ? (
                  <div className="flex items-center gap-0.5 w-full justify-center">
                    <button
                      onClick={() => setMultipleQtys(prev => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) - 1) }))}
                      disabled={qty === 0}
                      className={cn(
                        "w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30",
                        theme === "dark" ? "bg-white/10 hover:bg-white/20 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                      )}
                    >−</button>
                    <span className={cn("w-5 shrink-0 text-center text-sm font-bold tabular-nums", theme === "dark" ? "text-white" : "text-gray-900")}>{qty}</span>
                    <button
                      onClick={() => setMultipleQtys(prev => ({ ...prev, [key]: Math.min(10, (prev[key] || 0) + 1) }))}
                      disabled={qty === 10}
                      className={cn(
                        "w-5 h-5 shrink-0 rounded flex items-center justify-center text-xs font-bold transition-colors disabled:opacity-30",
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

        <div className={cn(
          "flex items-center justify-between py-3 border-t mb-4",
          theme === "dark" ? "border-white/10" : "border-gray-200"
        )}>
          <span className={cn("text-sm", theme === "dark" ? "text-white/50" : "text-gray-500")}>{t.orderMultipleTotal}</span>
          <span className={cn("font-bold text-lg", theme === "dark" ? "text-white" : "text-gray-900")}>€{multipleOrderTotal}</span>
        </div>

        <Button
          onClick={onAddToCart}
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
}
