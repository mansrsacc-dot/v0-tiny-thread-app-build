"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Product } from "@/lib/garment-images";
import { SizeQtyGrid } from "@/components/tinythread/SizeQtyGrid";

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

        <SizeQtyGrid
          product={product}
          flatUnitPrice={flatUnitPrice}
          multipleQtys={multipleQtys}
          setMultipleQtys={setMultipleQtys}
          theme={theme}
          className="mb-5"
          t={t}
        />

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
