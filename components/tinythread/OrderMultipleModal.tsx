"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Product } from "@/lib/garment-images";

interface OrderMultipleModalProps {
  product: Product;
  // Flat per-unit price of the finished canvas design (embroidery size, style, text,
  // sleeve, additional designs all included). Every garment size costs this same price.
  flatUnitPrice: number;
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
  flatUnitPrice,
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
  // Garment-size (fit) columns. Same finished design on every fit — flat price.
  // Hoodie: S/M/L/XL (XL is a normal selectable column). Cap: two fit groups.
  const sizes = product === "hoodie"
    ? [{ key: "S", label: "S" }, { key: "M", label: "M" }, { key: "L", label: "L" }, { key: "XL", label: "XL" }]
    : [{ key: "S", label: "S/M" }, { key: "M", label: "L/XL" }];

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
            const qty = multipleQtys[key] || 0;

            return (
              <div
                key={key}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-1.5 rounded-xl border min-w-0 overflow-hidden",
                  theme === "dark" ? "border-white/10 bg-white/5" : "border-gray-200 bg-gray-50"
                )}
              >
                <span className={cn("font-bold text-sm", theme === "dark" ? "text-white" : "text-gray-900")}>{label}</span>
                <span className={cn("text-xs", theme === "dark" ? "text-white/45" : "text-gray-400")}>€{flatUnitPrice}</span>
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
              </div>
            );
          })}
        </div>

        {/* Always-visible duplicate-discount note */}
        <p className="text-xs text-center text-[#3e92cc] mb-3">{t.dupDiscountNote}</p>

        <div className={cn(
          "flex items-center justify-between py-3 border-t mb-4",
          theme === "dark" ? "border-white/10" : "border-gray-200"
        )}>
          <span className={cn("text-sm", theme === "dark" ? "text-white/50" : "text-gray-500")}>{t.orderMultipleTotal}</span>
          <span className={cn("font-bold text-lg", theme === "dark" ? "text-white" : "text-gray-900")}>€{Number.isInteger(multipleOrderTotal) ? multipleOrderTotal : multipleOrderTotal.toFixed(2)}</span>
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
            <>{t.orderMultipleAddBtn}{multipleOrderTotal > 0 ? ` — €${Number.isInteger(multipleOrderTotal) ? multipleOrderTotal : multipleOrderTotal.toFixed(2)}` : ""}</>
          )}
        </Button>
      </div>
    </div>
  );
}
