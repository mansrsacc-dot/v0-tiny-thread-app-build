"use client";

import { cn } from "@/lib/utils";
import type { Product } from "@/lib/garment-images";
import { dupDiscountedTotal } from "@/lib/constants";

interface ConfirmCartModalProps {
  hasOnlyFrontDesign: boolean;
  product: Product;
  quantity: number;
  unitPrice: number;
  garmentSize: "S" | "M" | "L" | "XL";
  onGarmentSizeChange: (s: "S" | "M" | "L" | "XL") => void;
  onQuantityChange: (q: number) => void;
  onConfirm: () => void;
  onClose: () => void;
  t: Record<string, string>;
}

export function ConfirmCartModal({ hasOnlyFrontDesign, product, quantity, unitPrice, garmentSize, onGarmentSizeChange, onQuantityChange, onConfirm, onClose, t }: ConfirmCartModalProps) {
  const total = dupDiscountedTotal(unitPrice, quantity);
  const totalDisplay = Number.isInteger(total) ? String(total) : total.toFixed(2);
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4">
      <div className="bg-[#1e1b18] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="text-4xl mb-4">🧵</div>
        <h2 className="text-xl font-bold text-white mb-2">{t.confirmTitle}</h2>
        <p className="text-white/50 text-sm mb-6">{t.confirmDesc}</p>
        {hasOnlyFrontDesign && (
          <p className="text-[#3e92cc]/70 text-xs mb-6">{t.confirmAddBack}</p>
        )}

        {/* Garment size selector (wearable fit, flat price — same as the sidebar). Hoodies
            only; caps are one-size. Defaults to the sidebar's current garment size. */}
        {product === "hoodie" && (
          <div className="mb-6">
            <p className="text-white/60 text-sm mb-2">{t.garmentSize}</p>
            <div className="grid grid-cols-4 gap-2">
              {(["S", "M", "L", "XL"] as const).map(gs => (
                <button
                  key={gs}
                  onClick={() => onGarmentSizeChange(gs)}
                  className={cn(
                    "py-2.5 rounded-lg border text-sm font-bold transition-all",
                    garmentSize === gs
                      ? "border-[#3e92cc] bg-[#3e92cc]/10 text-[#3e92cc]"
                      : "border-white/10 text-white/70 hover:border-white/30"
                  )}
                >
                  {gs}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <span className="text-white/60 text-sm">{t.quantity ?? "Qty"}</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 transition-colors"
            >−</button>
            <span className="w-8 text-center text-white font-bold text-lg tabular-nums">{quantity}</span>
            <button
              onClick={() => onQuantityChange(Math.min(10, quantity + 1))}
              disabled={quantity >= 10}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-lg flex items-center justify-center disabled:opacity-30 transition-colors"
            >+</button>
          </div>
        </div>

        {/* Always-visible duplicate-discount note + live discounted total */}
        <p className="text-[#3e92cc] text-xs mb-2">{t.dupDiscountNote}</p>
        <div className="flex items-center justify-between border-t border-white/10 py-3 mb-5">
          <span className="text-white/50 text-sm">{t.orderMultipleTotal}</span>
          <span className="text-white font-bold text-lg">€{totalDisplay}</span>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            className="w-full px-6 py-3 bg-[#d8315b] hover:bg-[#c02850] text-white font-bold rounded-lg transition-colors"
          >
            {t.confirmYes}
          </button>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-white/10 text-white font-medium rounded-lg hover:bg-white/20 transition-colors"
          >
            {t.confirmNo}
          </button>
        </div>
      </div>
    </div>
  );
}
